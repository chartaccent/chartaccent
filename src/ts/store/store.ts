import * as d3 from "d3";

import { Dataset, Column, Row, Chart, Defaults, AppState } from "../model/model";
import * as Actions from "./actions";
import { ChartAccent } from "../chartaccent";
import { globalSamples } from "./samples";
import { parseDataset } from "../model/utils";
import { EventEmitter, EventSubscription } from "fbemitter";
import { AppLogger, ExportLogData } from "./logger";

export class MainStore extends EventEmitter {
    private _logger: AppLogger;
    private _dataset: Dataset;
    private _chart: Chart;
    private _samples: typeof globalSamples;
    private _chartAccent: ChartAccent;
    private _exportAs: (type: string, callback: (blob: Blob, doDownload: () => void) => void) => void;

    public get dataset(): Dataset { return this._dataset; }
    public get chart(): Chart { return this._chart; }
    public get samples(): typeof globalSamples { return this._samples; }
    public get chartAccent(): ChartAccent { return this._chartAccent; }
    public get logger(): AppLogger { return this._logger; }

    public get chartReady(): boolean {
        return this._dataset && this._chart && this._chart.type != null;
    }

    public setChartAccent(value: ChartAccent) {
        this._chartAccent = value;
    }

    public setExportAs(func: (type: string, callback: (blob: Blob, doDownload: () => void) => void) => void) {
        this._exportAs = func;
    }

    public exportAs(type: string, emailAddress: string, shareData: boolean, callback: (error: string) => void) {
        if(this._exportAs) {
            let state = this.getState();
            this._exportAs(type, (blob: Blob, doDownload: () => void) => {
                if(shareData) {
                    let reader = new FileReader();
                    reader.onload = (e) => {
                        let imageDataURL = reader.result;
                        let exportData: ExportLogData = {
                            clientID: this.logger.getClientID(),
                            timeCreated: new Date().getTime(),
                            sessionID: this.logger.getSessionID(),
                            state: state,
                            imageType: type,
                            imageDataURL: imageDataURL,
                            emailAddress: emailAddress
                        }
                        this.logger.logExport(exportData, (error) => {
                            if(error != null) {
                                callback(error);
                            } else {
                                doDownload();
                                callback(null);
                            }
                        });
                    }
                    reader.readAsDataURL(blob);
                } else {
                    setTimeout(() => {
                        doDownload();
                        callback(null);
                    }, 1000);
                }
            });
        }
    }

    constructor() {
        super();

        this._logger = new AppLogger();
        this._dataset = null;
        this._chart = Defaults.chart(this._dataset);
        this._samples = globalSamples;
        this._chartAccent = null;

        Actions.globalDispatcher.register((action) => this.handleAction(action));
    }

    public getState() {
        let state: AppState = {
            dataset: this._dataset,
            chart: this._chart,
            annotations: this._chartAccent.saveAnnotations(),
            timestamp: new Date().getTime()
        };
        return state;
    }

    public handleAction(action: Actions.Action) {
        if(action instanceof Actions.LoadData) {
            let dataset = parseDataset(action.fileName, action.raw, action.fileType);
            if(action.sampleFileName != null) {
                dataset.sampleFileName = action.sampleFileName;
            }
            this._dataset = dataset;
            this.emitDatasetChanged();

            if(this._chart) {
                this._chart = Defaults.chart(this._dataset);
                this.emitChartChanged();
            }
            if(dataset.sampleFileName != null) {
                this.logger.logAction("dataset/load", `N=${this._dataset.rows.length},C=${this._dataset.columns.length},SAMPLE=${dataset.sampleFileName}`);
            } else {
                this.logger.logAction("dataset/load", `N=${this._dataset.rows.length},C=${this._dataset.columns.length},CUSTOM`);
            }
        }
        if(action instanceof Actions.UpdateChart) {
            this.handleUpdateChartAction(action);
        }
        if(action instanceof Actions.SaveState) {
            this._chart.dataset = undefined;
            try {
                let stateJSON = JSON.stringify(this.getState(), null, 2);
                var file = new File([ stateJSON ], "chartaccent.json", { type: "application/json" });
                saveAs(file, "chartaccent.json");
            } catch(e) {
                console.log(e, e.stack);
            }
            this._chart.dataset = this._dataset;
            this.logger.logAction("appstate/save", "");
        }
        if(action instanceof Actions.LoadState) {
            this._dataset = action.state.dataset;
            this._chart = action.state.chart;
            this._chart.dataset = this._dataset;

            this.emitDatasetChanged();
            this.emitChartChanged();

            this._chartAccent.loadAnnotations(action.state.annotations, true);
            this.logger.logAction("appstate/load", "");
        }
        if(action instanceof Actions.Reset) {
            this._dataset = null;
            this._chart = Defaults.chart(this._dataset);;
            this._chartAccent = null;
            this.emitDatasetChanged();
            this.emitChartChanged();
            this.logger.logAction("appstate/reset", "");
        }
        if(action instanceof Actions.StartIntroduction) {
            if(this._dataset && this._chart && this._chart.type != null) {
                let intro = introJs();
                intro.start();
            } else {
                let sample = this.samples[4];
                d3.text(sample.csv, "text/plain", (err, data) => {
                    if(!err) {
                        this.handleAction(new Actions.LoadData(sample.csv, data, "csv"));
                        setTimeout(() => {
                            let intro = introJs();
                            intro.onexit(() => {
                                new Actions.Reset().dispatch();
                            });
                            intro.oncomplete(() => {
                                new Actions.Reset().dispatch();
                            });
                            intro.start();
                        }, 100);
                    }
                });
            }
        }
    }

    public handleUpdateChartAction(action: Actions.UpdateChart) {
        // Is it targeting the current chart?
        if(this._chart != action.chart) return;

        if(action instanceof Actions.UpdateChartType) {
            if(this._chart.type == action.newType) return;
            let newChart: Chart = null;
            let oldChart = this._chart;
            switch(action.newType) {
                case "bar-chart": {
                    newChart = Defaults.barChart(this._dataset);
                } break;
                case "line-chart": {
                    newChart = Defaults.lineChart(this._dataset);
                } break;
                case "scatterplot": {
                    newChart = Defaults.scatterplotChart(this._dataset);
                } break;
                default: {
                    return;
                }
            }
            this._chart = newChart;
            this.emitChartChanged();
            this.logger.logAction("chart/type", action.newType);
        }
        if(action instanceof Actions.UpdateChartTitle) {
            this._chart.title = action.newTitle;
            this.emitChartChanged();
            this.logger.logAction("chart/title", `L=${action.newTitle.text.length}`);
        }
        if(action instanceof Actions.UpdateChartWidthHeight) {
            this._chart.width = action.newWidth;
            this._chart.height = action.newHeight;
            this.emitChartChanged();
            this.logger.logAction("chart/size", `W=${action.newWidth},H=${action.newHeight}`);
        }
        if(action instanceof Actions.UpdateChartXColumn) {
            (this._chart as any).xColumn = action.newXColumn;
            (this._chart as any).xLabel = Defaults.label(action.newXColumn);
            this.emitChartChanged();
            this.logger.logAction("chart/xcolumn", "");
        }
        if(action instanceof Actions.UpdateChartYColumn) {
            (this._chart as any).yColumn = action.newYColumn;
            (this._chart as any).yLabel = Defaults.label(action.newYColumn);
            this.emitChartChanged();
            this.logger.logAction("chart/ycolumn", "");
        }
        if(action instanceof Actions.UpdateChartXScale) {
            (this._chart as any).xScale = action.newXScale;
            this.emitChartChanged();
            this.logger.logAction("chart/xscale", "");
        }
        if(action instanceof Actions.UpdateChartYScale) {
            (this._chart as any).yScale = action.newYScale;
            this.emitChartChanged();
            this.logger.logAction("chart/yscale", "");
        }
        if(action instanceof Actions.UpdateChartGroupColumn) {
            (this._chart as any).groupColumn = action.newGroupColumn;
            this.emitChartChanged();
            this.logger.logAction("chart/groupcolumn", "");
        }
        if(action instanceof Actions.UpdateChartSizeColumn) {
            (this._chart as any).sizeColumn = action.newSizeColumn;
            this.emitChartChanged();
            this.logger.logAction("chart/sizecolumn", "");
        }
        if(action instanceof Actions.UpdateChartNameColumn) {
            (this._chart as any).nameColumn = action.newNameColumn;
            this.emitChartChanged();
            this.logger.logAction("chart/namecolumn", "");
        }
        if(action instanceof Actions.UpdateChartYColumns) {
            (this._chart as any).yColumns = action.newYColumns;
            this.emitChartChanged();
            this.logger.logAction("chart/ycolumns", `N=${action.newYColumns.length}`);
        }
        if(action instanceof Actions.UpdateChartXLabel) {
            (this._chart as any).xLabel = action.newXLabel;
            this.emitChartChanged();
            this.logger.logAction("chart/xlabel", `L=${action.newXLabel.text.length}`);
        }
        if(action instanceof Actions.UpdateChartYLabel) {
            (this._chart as any).yLabel = action.newYLabel;
            this.emitChartChanged();
            this.logger.logAction("chart/xlabel", `L=${action.newYLabel.text.length}`);
        }
        if(action instanceof Actions.UpdateChartColors) {
            this._chart.colors = action.newColors;
            this.emitChartChanged();
            this.logger.logAction("chart/colors", action.newColors.join(","));
        }

    }

    private emitDatasetChanged() {
        this.emit("dataset-changed");
    }
    public addDatasetChangedListener(listener: Function): EventSubscription {
        return this.addListener("dataset-changed", listener);
    }
    private emitChartChanged() {
        this.emit("chart-changed");
    }
    public addChartChangedListener(listener: Function): EventSubscription {
        return this.addListener("chart-changed", listener);
    }
}

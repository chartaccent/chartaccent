import * as d3 from "d3";

import { Dataset, Column, Row, Chart, Defaults, AppState } from "../model/model";
import * as Actions from "./actions";
import { ChartAccent } from "../chartaccent";
import { globalSamples } from "./samples";
import { parseDataset } from "../model/utils";
import { EventEmitter, EventSubscription } from "fbemitter";
import { ActionLogger } from "./logger";

export class MainStore extends EventEmitter {
    private _logger: ActionLogger;
    private _dataset: Dataset;
    private _chart: Chart;
    private _samples: typeof globalSamples;
    private _chartAccent: ChartAccent;

    public get dataset(): Dataset { return this._dataset; }
    public get chart(): Chart { return this._chart; }
    public get samples(): typeof globalSamples { return this._samples; }
    public get chartAccent(): ChartAccent { return this._chartAccent; }
    public get logger(): ActionLogger { return this._logger; }

    public get chartReady(): boolean {
        return this._dataset && this._chart && this._chart.type != null;
    }

    public setChartAccent(value: ChartAccent) {
        this._chartAccent = value;
    }

    constructor() {
        super();

        this._logger = new ActionLogger;
        this._dataset = null;
        this._chart = Defaults.chart(this._dataset);
        this._samples = globalSamples;
        this._chartAccent = null;

        Actions.globalDispatcher.register((action) => this.handleAction(action));
    }

    public handleAction(action: Actions.Action) {
        if(action instanceof Actions.LoadData) {
            let dataset = parseDataset(action.fileName, action.raw, action.fileType);
            this._dataset = dataset;
            this.emitDatasetChanged();

            if(this._chart) {
                this._chart = Defaults.chart(this._dataset);
                this.emitChartChanged();
            }

            this.logger.log("dataset/load", `N=${this._dataset.rows.length},C=${this._dataset.columns.length}`);
        }
        if(action instanceof Actions.UpdateChart) {
            this.handleUpdateChartAction(action);
        }
        if(action instanceof Actions.SaveState) {
            this._chart.dataset = undefined;
            try {
                let state: AppState = {
                    dataset: this._dataset,
                    chart: this._chart,
                    annotations: this._chartAccent.saveAnnotations(),
                    timestamp: new Date().getTime()
                };
                let stateJSON = JSON.stringify(state, null, 2);
                var file = new File([ stateJSON ], "chartaccent.json", { type: "application/json" });
                saveAs(file, "chartaccent.json");
            } catch(e) {
                console.log(e, e.stack);
            }
            this._chart.dataset = this._dataset;
            this.logger.log("appstate/save", "");
        }
        if(action instanceof Actions.LoadState) {
            this._dataset = action.state.dataset;
            this._chart = action.state.chart;
            this._chart.dataset = this._dataset;

            this.emitDatasetChanged();
            this.emitChartChanged();

            this._chartAccent.loadAnnotations(action.state.annotations, true);
            this.logger.log("appstate/load", "");
        }
        if(action instanceof Actions.Reset) {
            this._dataset = null;
            this._chart = Defaults.chart(this._dataset);;
            this._chartAccent = null;
            this.emitDatasetChanged();
            this.emitChartChanged();
            this.logger.log("appstate/reset", "");
        }
        if(action instanceof Actions.StartIntroduction) {
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
            this.logger.log("chart/type", action.newType);
        }
        if(action instanceof Actions.UpdateChartTitle) {
            this._chart.title = action.newTitle;
            this.emitChartChanged();
            this.logger.log("chart/title", `L=${action.newTitle.text.length}`);
        }
        if(action instanceof Actions.UpdateChartWidthHeight) {
            this._chart.width = action.newWidth;
            this._chart.height = action.newHeight;
            this.emitChartChanged();
            this.logger.log("chart/size", `W=${action.newWidth},H=${action.newHeight}`);
        }
        if(action instanceof Actions.UpdateChartXColumn) {
            (this._chart as any).xColumn = action.newXColumn;
            (this._chart as any).xLabel = Defaults.label(action.newXColumn);
            this.emitChartChanged();
            this.logger.log("chart/xcolumn", "");
        }
        if(action instanceof Actions.UpdateChartYColumn) {
            (this._chart as any).yColumn = action.newYColumn;
            (this._chart as any).yLabel = Defaults.label(action.newYColumn);
            this.emitChartChanged();
            this.logger.log("chart/ycolumn", "");
        }
        if(action instanceof Actions.UpdateChartGroupColumn) {
            (this._chart as any).groupColumn = action.newGroupColumn;
            this.emitChartChanged();
            this.logger.log("chart/groupcolumn", "");
        }
        if(action instanceof Actions.UpdateChartSizeColumn) {
            (this._chart as any).sizeColumn = action.newSizeColumn;
            this.emitChartChanged();
            this.logger.log("chart/sizecolumn", "");
        }
        if(action instanceof Actions.UpdateChartNameColumn) {
            (this._chart as any).nameColumn = action.newNameColumn;
            this.emitChartChanged();
            this.logger.log("chart/namecolumn", "");
        }
        if(action instanceof Actions.UpdateChartYColumns) {
            (this._chart as any).yColumns = action.newYColumns;
            this.emitChartChanged();
            this.logger.log("chart/ycolumns", `N=${action.newYColumns.length}`);
        }
        if(action instanceof Actions.UpdateChartXLabel) {
            (this._chart as any).xLabel = action.newXLabel;
            this.emitChartChanged();
            this.logger.log("chart/xlabel", `L=${action.newXLabel.text.length}`);
        }
        if(action instanceof Actions.UpdateChartYLabel) {
            (this._chart as any).yLabel = action.newYLabel;
            this.emitChartChanged();
            this.logger.log("chart/xlabel", `L=${action.newYLabel.text.length}`);
        }
        if(action instanceof Actions.UpdateChartColors) {
            this._chart.colors = action.newColors;
            this.emitChartChanged();
            this.logger.log("chart/colors", action.newColors.join(","));
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

import { Dataset, Column, Row, Chart, Defaults } from "../model/model";
import * as Actions from "./actions";
import { globalSamples } from "./samples";
import { parseDataset } from "./utils";
import { EventEmitter, EventSubscription } from "fbemitter";

export class MainStore extends EventEmitter {
    private _dataset: Dataset;
    private _chart: Chart;
    private _samples: typeof globalSamples;

    public get dataset(): Dataset { return this._dataset; }
    public get chart(): Chart { return this._chart; }
    public get samples(): typeof globalSamples { return this._samples; }

    constructor() {
        super();

        this._dataset = null;
        this._chart = Defaults.chart(this._dataset);
        this._samples = globalSamples;

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
        }
        if(action instanceof Actions.UpdateChart) {
            this.handleUpdateChartAction(action);
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
        }
        if(action instanceof Actions.UpdateChartTitle) {
            this._chart.title = action.newTitle;
            this.emitChartChanged();
        }
        if(action instanceof Actions.UpdateChartWidthHeight) {
            this._chart.width = action.newWidth;
            this._chart.height = action.newHeight;
            this.emitChartChanged();
        }
        if(action instanceof Actions.UpdateChartXColumn) {
            (this._chart as any).xColumn = action.newXColumn;
            (this._chart as any).xLabel = Defaults.label(action.newXColumn);
            this.emitChartChanged();
        }
        if(action instanceof Actions.UpdateChartYColumn) {
            (this._chart as any).yColumn = action.newYColumn;
            (this._chart as any).yLabel = Defaults.label(action.newYColumn);
            this.emitChartChanged();
        }
        if(action instanceof Actions.UpdateChartGroupColumn) {
            (this._chart as any).groupColumn = action.newGroupColumn;
            this.emitChartChanged();
        }
        if(action instanceof Actions.UpdateChartNameColumn) {
            (this._chart as any).nameColumn = action.newNameColumn;
            this.emitChartChanged();
        }
        if(action instanceof Actions.UpdateChartYColumns) {
            (this._chart as any).yColumns = action.newYColumns;
            this.emitChartChanged();
        }
        if(action instanceof Actions.UpdateChartXLabel) {
            (this._chart as any).xLabel = action.newXLabel;
            this.emitChartChanged();
        }
        if(action instanceof Actions.UpdateChartYLabel) {
            (this._chart as any).yLabel = action.newYLabel;
            this.emitChartChanged();
        }
        if(action instanceof Actions.UpdateChartColors) {
            this._chart.colors = action.newColors;
            this.emitChartChanged();
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
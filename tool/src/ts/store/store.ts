import { Dataset, Column, Row, Chart } from "../model/model";
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
        this._chart = {
            dataset: this._dataset,
            type: null
        };
        this._samples = globalSamples;
    }

    public handleAction(action: Actions.Action) {
        if(action instanceof Actions.LoadDataAction) {
            let dataset = parseDataset(action.fileName, action.raw, action.fileType);
            if(this._chart) {
                this._chart = {
                    dataset: this._dataset,
                    type: null
                };
                this.emitChartChanged();
            }
            this._dataset = dataset;
            this.emitDatasetChanged();
        }
    }

    public emitDatasetChanged() {
        this.emit("dataset-changed");
    }
    public addDatasetChangedListener(listener: Function): EventSubscription {
        return this.addListener("dataset-changed", listener);
    }
    public emitChartChanged() {
        this.emit("chart-changed");
    }
    public addChartChangedListener(listener: Function): EventSubscription {
        return this.addListener("chart-changed", listener);
    }
}


export let globalStore = new MainStore();

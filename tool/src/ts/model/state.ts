import { Dataset } from "./dataset";
import { Chart } from "./chart";
import { SavedAnnotations } from "../chartaccent";

export interface AppState {
    dataset: Dataset;
    chart: Chart;
    annotations: SavedAnnotations;
    timestamp: number;
}
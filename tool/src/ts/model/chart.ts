import { Dataset, Row, Column } from "./dataset";

export interface Scale {
    type: "categorical" | "linear" | "log";
    min?: number;
    max?: number;
}

export interface Label {
    text: string;
    fontFamily?: string;
    fontSize?: number;
    fontStyle?: string;
    textAlign?: "left" | "right" | "middle";
}

// The Chart object

export interface Chart {
    dataset: Dataset;

    type: string;

    title?: Label;
    width: number;
    height: number;

    colors: string[];

    annotations?: any;
}

// Declare chart-type-specific fields here:

export interface BarChart extends Chart {
    type: "bar-chart";

    xColumn: string;
    xScale: Scale;
    xLabel: Label;

    yColumns: string[];
    yScale: Scale;
    yLabel: Label;

    legendLabel: Label;
}

export interface LineChart extends Chart {
    type: "line-chart";

    xColumn: string;
    xScale: Scale;
    xLabel: Label;

    yColumns: string[];
    yScale: Scale;
    yLabel: Label;

    legendLabel: Label;
}

export interface Scatterplot extends Chart {
    type: "scatterplot";

    xColumn: string;
    xScale: Scale;
    xLabel: Label;

    yColumn: string;
    yScale: Scale;
    yLabel: Label;

    nameColumn: string;

    groupColumn?: string;
    legendLabel: Label;
}
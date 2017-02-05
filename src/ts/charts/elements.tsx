import * as React from "react";
import * as d3 from "d3";

import { Chart, Label, Dataset } from "../model/model";

let measureTextCanvas = document.createElement("canvas");
let measureTextCanvasCtx = measureTextCanvas.getContext("2d");
export function measureTextWidth(text: string, fontFamily: string, fontSize: number = 14) {
    measureTextCanvasCtx.font = `${fontSize}px ${fontFamily}`;
    return measureTextCanvasCtx.measureText(text).width;
}

export function applyAxisStyle(sel: d3.Selection<any>) {
    sel.selectAll("path").style({
        "fill": "none",
        "stroke": "black",
        "shape-rendering": "crispEdges"
    });
    sel.selectAll("line").style({
        "fill": "none",
        "stroke": "black",
        "shape-rendering": "crispEdges"
    });
}

export class ChartLabel extends React.Component<{
    label: Label;
    anchor?: "start" | "end" | "middle";
    transform?: string;
}, {}> {
    public render() {
        let label = this.props.label;
        if(label == null || label.text == "") return null;
        return (
            <g transform={this.props.transform}>
                <text style={{
                    fontFamily: label.fontFamily || "Arial",
                    fontSize: label.fontSize || 12,
                    fontWeight: label.fontStyle == "bold" || label.fontStyle == "bold-italic" ? "bold" : "normal",
                    fontStyle: label.fontStyle == "italic" || label.fontStyle == "bold-italic" ? "italic" : "normal",
                    textAnchor: this.props.anchor || "middle",
                    fill: label.color
                }}
                >{label.text}</text>
            </g>
        );
    }
}

export function findColumnFormat(dataset: Dataset, columnName: string): string {
    for(let column of dataset.columns) {
        if(column.name == columnName) return column.format;
    }
    return ".1f";
}
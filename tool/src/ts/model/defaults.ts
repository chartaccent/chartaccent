import { Chart, Label, BarChart, LineChart, Scatterplot, Scale } from "./chart";
import { Dataset } from "./dataset";

import * as d3 from "d3";

import { getUniqueValues } from "../utils/utils";

export module Defaults {

    export let colors = [
        { name: "colorbrewer1", colors: [ "#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f" ] },
        { name: "colorbrewer2", colors: [ "#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02" ] },
        { name: "colorbrewer3", colors: [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c" ] },
        { name: "colorbrewer4", colors: [ "#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc" ] },
        { name: "colorbrewer5", colors: [ "#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4", "#e6f5c9", "#fff2ae" ] },
        { name: "colorbrewer6", colors: [ "#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33" ] },
        { name: "colorbrewer7", colors: [ "#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f" ] },
        { name: "colorbrewer8", colors: [ "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462" ] }
    ];

    export function label(text: string = "", fontSize: number = 14): Label {
        return {
            text: text,
            fontFamily: "Arial",
            fontSize: fontSize,
            fontStyle: "regular"
        }
    }

    export function scale(type: "categorical" | "linear" | "log"): Scale {
        return {
            type: type
        };
    }

    export function barChart(dataset: Dataset): BarChart {
        let xColumn = dataset.columns
            .filter((d) => d.type == "string")[0].name;

        let yColumns = dataset.columns
            .filter((d) => d.type == "number" || d.type == "integer" || d.type == "date").slice(0, 2).map((d) => d.name);
        return {
            dataset: dataset,
            type: "bar-chart",
            title: Defaults.label(dataset.fileName, 16),
            width: 800,
            height: 400,
            xColumn: xColumn,
            yColumns: yColumns,
            xLabel: Defaults.label(xColumn),
            yLabel: Defaults.label("Value"),
            xScale: Defaults.scale("categorical"),
            yScale: Defaults.scale("linear"),
            legendLabel: Defaults.label("Series"),
            colors: Defaults.colors[6].colors,
            annotations: null
        }
    }
    export function lineChart(dataset: Dataset): LineChart {
        let xColumn = dataset.columns
            .filter((d) => d.type == "string")[0].name;

        let yColumns = dataset.columns
            .filter((d) => d.type == "number" || d.type == "integer" || d.type == "date").slice(0, 2).map((d) => d.name);
        return {
            dataset: dataset,
            type: "line-chart",
            title: Defaults.label(dataset.fileName, 16),
            width: 800,
            height: 400,
            xColumn: xColumn,
            yColumns: yColumns,
            xLabel: Defaults.label(xColumn),
            yLabel: Defaults.label("Value"),
            xScale: Defaults.scale("categorical"),
            yScale: Defaults.scale("linear"),
            legendLabel: Defaults.label("Series"),
            colors: Defaults.colors[6].colors,
            annotations: null
        }
    }
    export function scatterplotChart(dataset: Dataset): Scatterplot {
        let [ xColumn, yColumn ] = dataset.columns
            .filter((d) => d.type == "number" || d.type == "integer" || d.type == "date").slice(0, 2).map((d) => d.name);

        let stringColumns = dataset.columns
            .filter((d) => d.type == "string").map((d) => {
                let values = getUniqueValues(dataset.rows.map(row => row[d.name].toString()));
                return {
                    name: d.name,
                    uniqueValues: values.length
                };
            });

        stringColumns.sort((a, b) => a.uniqueValues - b.uniqueValues);

        // Use the column with the most unique values as name
        let nameColumn = stringColumns.length > 0 ? stringColumns[stringColumns.length - 1].name : null;

        // Use the column with >= 2 unique values as group, select the one with fewest unique values.
        stringColumns = stringColumns.filter(d => d.uniqueValues >= 2 && d.uniqueValues <= 6);
        let groupColumn = stringColumns.length > 0 ? stringColumns[0].name : null;

        return {
            dataset: dataset,
            type: "scatterplot",
            title: Defaults.label(dataset.fileName, 16),
            width: 800,
            height: 400,
            xColumn: xColumn,
            yColumn: yColumn,
            groupColumn: groupColumn,
            nameColumn: nameColumn,
            xLabel: Defaults.label(xColumn),
            yLabel: Defaults.label(yColumn),
            xScale: Defaults.scale("linear"),
            yScale: Defaults.scale("linear"),
            legendLabel: Defaults.label("Series"),
            colors: Defaults.colors[1].colors,
            annotations: null
        }
    }

    export function chart(dataset: Dataset): Chart {
        if(dataset != null) {
            // return Defaults.scatterplotChart(dataset);
            return {
                dataset: dataset,
                type: null,
                title: Defaults.label(dataset.fileName, 16),
                width: 800,
                height: 400,
                colors: Defaults.colors[1].colors,
                annotations: null
            };
        } else {
            return {
                dataset: null,
                type: null,
                title: Defaults.label("", 16),
                width: 800,
                height: 400,
                colors: Defaults.colors[1].colors,
                annotations: null
            };
        }
    }

}
import { Chart, Label, BarChart, LineChart, Scatterplot, Scale } from "./chart";
import { Dataset } from "./dataset";

import { getColumnsForDistinctAxis, getColumnsForContinuousAxis } from "./utils";

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
        { name: "colorbrewer8", colors: [ "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462" ] },
        { name: "Purple-Gray 12", colors: [ "#7b66d2", "#a699e8", "#dc5fbd", "#ffc0da", "#5f5a41", "#b4b19b", "#995688", "#d898ba", "#ab6ad5", "#d098ee", "#8b7c6e", "#dbd4c5" ] },
        { name: "Tableau 20", colors: [ "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5" ] },
        { name: "Green-Orange 6", colors: [ "#32a251", "#ff7f0f", "#3cb7cc", "#ffd94a", "#39737c", "#b85a0d" ] },
        { name: "Color Blind 10", colors: [ "#006ba4", "#ff800e", "#ababab", "#595959", "#5f9ed1", "#c85200", "#898989", "#a2c8ec", "#ffbc79", "#cfcfcf" ] },
        { name: "Blue-Red 6", colors: [ "#2c69b0", "#f02720", "#ac613c", "#6ba3d6", "#ea6b73", "#e9c39b" ] },
        { name: "Blue-Red 12", colors: [ "#2c69b0", "#b5c8e2", "#f02720", "#ffb6b0", "#ac613c", "#e9c39b", "#6ba3d6", "#b5dffd", "#ac8763", "#ddc9b4", "#bd0a36", "#f4737a" ] },
        { name: "Tableau 10 Light", colors: [ "#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5", "#c49c94", "#f7b6d2", "#c7c7c7", "#dbdb8d", "#9edae5" ] },
        { name: "Purple-Gray 6", colors: [ "#7b66d2", "#dc5fbd", "#94917b", "#995688", "#d098ee", "#d7d5c5" ] },
        { name: "Tableau 10 Medium", colors: [ "#729ece", "#ff9e4a", "#67bf5c", "#ed665d", "#ad8bc9", "#a8786e", "#ed97ca", "#a2a2a2", "#cdcc5d", "#6dccda" ] },
        { name: "Green-Orange 12", colors: [ "#32a251", "#acd98d", "#ff7f0f", "#ffb977", "#3cb7cc", "#98d9e4", "#b85a0d", "#ffd94a", "#39737c", "#86b4a9", "#82853b", "#ccc94d" ] },
        { name: "Tableau 10", colors: [ "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf" ] },
        { name: "Traffic Light", colors: [ "#b10318", "#dba13a", "#309343", "#d82526", "#ffc156", "#69b764", "#f26c64", "#ffdd71", "#9fcd99" ] },
        { name: "Gray 5", colors: [ "#60636a", "#a5acaf", "#414451", "#8f8782", "#cfcfcf" ] }
    ];

    export let defaultColors = [ "#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02" ];

    export let fonts = [
        "Roboto",
        "Helvetica",
        "Arial",
        "Lucida Grande",
        "Geneva",
        "Verdana",
        "Tahoma",
        "Comic Sans MS",
        "Impact",
        "Georgia",
        "Times",
        "Palatino",
        "Consolas",
        "Lucida Console"
    ];

    export let defaultFont = "Roboto";

    export function chartTitle(dataset: Dataset = null): string {
        if(dataset == null) return "Chart";
        if(dataset.sampleFileName != null) return dataset.sampleFileName;
        let index = dataset.fileName.lastIndexOf(".");
        if(index != -1) {
            return dataset.fileName.slice(0, index);
        } else {
            return dataset.fileName
        }
    }

    export function label(text: string = "", fontSize: number = 14): Label {
        return {
            text: text,
            fontFamily: Defaults.defaultFont,
            fontSize: fontSize,
            fontStyle: "regular",
            color: "#000000"
        }
    }

    export function scale(type: "categorical" | "linear" | "log"): Scale {
        return {
            type: type
        };
    }

    export function barChart(dataset: Dataset): BarChart {
        let xColumnCandidates = getColumnsForDistinctAxis(dataset, 20);
        let yColumnCandidates = getColumnsForContinuousAxis(dataset);

        if(xColumnCandidates.length == 0 || yColumnCandidates.length == 0) return null;

        let xColumn = xColumnCandidates[0];

        yColumnCandidates.sort((a, b) => a < b ? -1 : 1);
        let yColumns = yColumnCandidates.slice(0, 2);

        return {
            dataset: dataset,
            type: "bar-chart",
            title: Defaults.label(chartTitle(dataset), 20),
            width: 700,
            height: 400,
            xColumn: xColumn,
            yColumns: yColumns,
            xLabel: Defaults.label(""),
            yLabel: Defaults.label("Value"),
            xScale: Defaults.scale("categorical"),
            yScale: Defaults.scale("linear"),
            legendLabel: Defaults.label("Series"),
            colors: Defaults.colors[6].colors
        }
    }

    export function lineChart(dataset: Dataset): LineChart {
        let xColumnCandidates = getColumnsForDistinctAxis(dataset, 20);
        let yColumnCandidates = getColumnsForContinuousAxis(dataset);

        if(xColumnCandidates.length == 0 || yColumnCandidates.length == 0) return null;

        let xColumn = xColumnCandidates[0];

        yColumnCandidates.sort((a, b) => a < b ? -1 : 1);
        let yColumns = yColumnCandidates.slice(0, 2);


        return {
            dataset: dataset,
            type: "line-chart",
            title: Defaults.label(chartTitle(dataset), 20),
            width: 700,
            height: 400,
            xColumn: xColumn,
            yColumns: yColumns,
            xLabel: Defaults.label(""),
            yLabel: Defaults.label("Value"),
            xScale: Defaults.scale("categorical"),
            yScale: Defaults.scale("linear"),
            legendLabel: Defaults.label("Series"),
            colors: Defaults.colors[6].colors
        }
    }

    export function scatterplotChart(dataset: Dataset): Scatterplot {
        let xyColumnCandidates = getColumnsForContinuousAxis(dataset);
        if(xyColumnCandidates.length < 2) return null;
        xyColumnCandidates.sort((a, b) => a < b ? -1 : 1);

        let xColumn = xyColumnCandidates[0];
        let yColumn = xyColumnCandidates[1];
        let sizeColumn = null; // xyColumnCandidates[2] || null;

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
            title: Defaults.label(chartTitle(dataset), 20),
            width: 700,
            height: 400,
            xColumn: xColumn,
            yColumn: yColumn,
            sizeColumn: sizeColumn,
            groupColumn: groupColumn,
            nameColumn: nameColumn,
            xLabel: Defaults.label(xColumn),
            yLabel: Defaults.label(yColumn),
            xScale: Defaults.scale("linear"),
            yScale: Defaults.scale("linear"),
            legendLabel: Defaults.label("Series"),
            colors: this.defaultColors
        }
    }

    export function nullChart(): Chart {
        return {
            dataset: null,
            type: null,
            title: Defaults.label("", 20),
            width: 700,
            height: 400,
            colors: this.defaultColors
        };
    }

    export function chart(dataset: Dataset): Chart {
        if(dataset != null) {
            return Defaults.barChart(dataset) || Defaults.scatterplotChart(dataset) || Defaults.nullChart();
        } else {
            return Defaults.nullChart();
        }
    }

    export function isChartValid(dataset: Dataset, chart: string) {
        if(!dataset) return false;
        switch(chart) {
            case "bar-chart": return Defaults.barChart(dataset) ? true : false;
            case "line-chart": return Defaults.lineChart(dataset) ? true : false;
            case "scatterplot": return Defaults.scatterplotChart(dataset) ? true : false;
        }
        return false;
    }

}
import { Chart, BarChart, LineChart, Scatterplot, Dataset } from "../model/model";
import * as d3 from "d3";

export class LineGenerator {
    lines: string[] = [];
    indentation: number = 0;

    public add(str: string) {
        let prefix = "";
        for (let i = 0; i < this.indentation; i++) {
            prefix += "    ";
        }
        this.lines.push(prefix + str);
    }
    public addBlock(str: string) {
        let lines = str.replace(/\r/g, "").split("\n");
        let minSpaces = 1e10;
        for (let line of lines) {
            for (let i = 0; i < line.length; i++) {
                if (line[i] != " ") {
                    minSpaces = Math.min(minSpaces, i);
                    break;
                }
            }
        }
        for (let line of lines) {
            line = line.substr(minSpaces);
            this.add(line);
        }
    }
    public indent() {
        this.indentation += 1;
    }
    public unindent() {
        this.indentation -= 1;
    }
    public getCode() {
        return this.lines.join("\n");
    }
}

export class ChartExporter {
    public htmlCode = new LineGenerator();
    public cssCode = new LineGenerator();

    private addPrefixCode() {
        this.htmlCode.addBlock(`
            <!DOCTYPE html>
            <meta charset="utf-8" />
            <title>ChartAccent Exported Chart</title>
            <script src="https://d3js.org/d3.v4.min.js"></script>
            <div id="chart-container"></div>
            <script type="text/javascript">
        `);
        this.htmlCode.indent();
    }

    private addSuffixCode() {
        this.htmlCode.unindent();
        this.htmlCode.addBlock(`
            </script>
        `);
    }

    private addDataset(dataset: Dataset) {
        this.htmlCode.addBlock(`var dataset = ${JSON.stringify(dataset, null, 2)};`);
    }

    private addParameters(parameters: { width: number, height: number }) {
        this.htmlCode.addBlock(`
            // Chart parameters
            var width = ${parameters.width};
            var height = ${parameters.height};
            var margin = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            };
        `);
    }

    private addSVGCreation() {
        this.htmlCode.addBlock(`
            // Create the SVG element to hold our chart
            var svg = d3.select("#chart-container").append("svg");
            svg.attr("width", width);
            svg.attr("height", height);

        `);
    }
}
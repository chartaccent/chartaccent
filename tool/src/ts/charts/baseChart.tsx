import * as React from "react";
import * as d3 from "d3";
import * as ChartAccent from "../chartaccent";

import { Chart, Label } from "../model/model";

import { ChartLabel, measureTextWidth } from "./elements";

export interface IBaseChartViewProps {
    chart: Chart;
    eventTracker: (action: string, label: string) => void;
}

export interface IChartMargin {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export class BaseChartView extends React.Component<IBaseChartViewProps, {}> {
    protected _svg: SVGElement;
    protected _chartLayer: SVGGElement;
    protected _legendLayer: SVGGElement;
    protected _margin: IChartMargin;

    protected _annotationBackgroundLayer: SVGGElement;
    protected _annotationLayer: SVGGElement;

    protected _legendSelection: d3.Selection<any>;

    public get chartLayer(): SVGGElement { return this._chartLayer; }
    public get svg(): SVGElement { return this._svg; }

    constructor(props: IBaseChartViewProps) {
        super(props);

        this._margin = {
            top: 60,
            right: 80,
            bottom: 50,
            left: 80
        };

        this.componentWillUpdate();
    }

    public componentWillUpdate() {
        this._margin.right = this.measureLegend() + 10;
        this._margin.left = this.d3GetYAxisWidth() + 10;
        this._margin.bottom = this.d3GetXAxisHeight() + 10;
    }

    // Call d3-based render process
    public componentDidMount() {
        this.d3RenderChart();
    }
    public componentDidUpdate() {
        this.d3RenderChart();
    }

    // Override this to get legend items
    public getLegendItems(): string[] {
        return [];
    }

    public d3GetYAxisWidth(): number {
        return 0;
    }

    public d3GetXAxisHeight(): number {
        return 20;
    }

    // Override this to process chart with d3
    public d3RenderChart() {
        this.d3RenderLegend();
    }

    public d3RenderLegend() {
        let legendItems = this.getLegendItems() || [];
        let sel = d3.select(this._legendLayer).selectAll("g.legend").data(legendItems);
        let enter = sel.enter().append("g").attr("class", "legend");
        enter.attr("transform", (d, i) => "translate(0, " + i * 18 + ")");
        enter.append("text");
        enter.append("circle");
        sel.exit().remove();
        sel.select("text")
        .text(function(d) { return d; })
        .attr("x", 10).attr("y", 5)
        .style({
            "font-size": 14,
            "text-anchor": "start"
        });
        sel.select("circle")
        .attr("cx", 0).attr("cy", 0).attr("r", 5)
        .style({
            "stroke": "none",
            "fill": (d, i) => this.props.chart.colors[i % this.props.chart.colors.length]
        });
        this._legendSelection = sel;
    }

    public measureLegend() {
        let columns = this.getLegendItems() || [];
        if(columns.length == 0) return 0;
        return d3.max(columns, d => measureTextWidth(d, "Arial", 14)) + 40;
    }

    // Override this to render chart content with React
    public renderChart(): JSX.Element {
        return null;
    }

    public render() {
        let chart = this.props.chart;
        return (
            <svg
                className="chart-view-svg"
                ref={(svg: SVGElement) => this._svg = svg}
                width={chart.width}
                height={chart.height}
                style={{
                    fontFamily: "Helvetica",
                    fontSize: 14
                }}
            >
                <g ref={(g: SVGGElement) => this._annotationBackgroundLayer = g} />
                <g ref={(g: SVGGElement) => this._chartLayer = g}>
                    <ChartLabel
                        label={chart.title}
                        transform={`translate(${chart.width / 2}, ${this._margin.top - 20})`}
                        anchor="middle"
                    />
                    <g ref={(g: SVGGElement) => this._legendLayer = g} transform={`translate(${chart.width - this._margin.right + 20}, ${this._margin.top})`} />
                    { this.renderChart() }
                </g>
                <g ref={(g: SVGGElement) => this._annotationLayer = g} />
            </svg>
        );
    }

    public getAnnotationBackgroundLayer(): SVGGElement {
        return this._annotationBackgroundLayer;
    }
    public getAnnotationLayer(): SVGGElement {
        return this._annotationLayer;
    }
    public configureChartAccent(chartaccent: ChartAccent.ChartAccent) {
    }
}
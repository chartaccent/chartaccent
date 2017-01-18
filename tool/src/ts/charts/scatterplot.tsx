import * as React from "react";
import * as d3 from "d3";

import { Chart, Scatterplot } from "../model/model";
import { BaseChartView } from "./baseChart";
import { ChartLabel, applyAxisStyle, measureTextWidth, findColumnFormat } from "./elements";
import { getUniqueValues } from "../utils/utils";
import * as ChartAccent from "../chartaccent";

export class ScatterplotView extends BaseChartView {
    public _scatterplotChartLayer: SVGGElement;
    public _scatterplotChartXAxis: SVGGElement;
    public _scatterplotChartYAxis: SVGGElement;
    public _scatterplotChartContent: SVGGElement;

    private _pointsSelections: d3.Selection<any>;

    public getLegendItems(): string[] {
        let chart = this.props.chart as Scatterplot;
        if(chart.groupColumn) {
            let groupColumnValues = chart.dataset.rows.map((x) => x[chart.groupColumn].toString());
            return getUniqueValues(groupColumnValues);
        } else {
            return [];
        }
    }

    public d3RenderChart() {
        super.d3RenderChart();

        let chart = this.props.chart as Scatterplot;
        let sel = d3.select(this._scatterplotChartLayer);

        let { xScale, xAxis } = this.d3GetXAxis();
        let { yScale, yAxis } = this.d3GetYAxis();

        let sizeScale: d3.scale.Pow<number, number> = null;
        if(chart.sizeColumn) {
            sizeScale = d3.scale.pow()
                .domain([
                    0,
                    d3.max(chart.dataset.rows, (r) => +r[chart.sizeColumn])
                ])
                .range([ 0, 20 ])
                .exponent(0.5);
        }

        d3.select(this._scatterplotChartXAxis).call(xAxis).call(applyAxisStyle);
        d3.select(this._scatterplotChartYAxis).call(yAxis).call(applyAxisStyle);

        d3.select(this._scatterplotChartContent).selectAll("*").remove();

        var points = d3.select(this._scatterplotChartContent).append("g")
            .selectAll("circle").data(chart.dataset.rows);
        points.enter().append("circle")
            .attr("cx", d => xScale(+d[chart.xColumn]))
            .attr("cy", d => yScale(+d[chart.yColumn]))
            .attr("r", chart.sizeColumn ? d => sizeScale(+d[chart.sizeColumn]) : d => 5)
            .style("stroke", "none")
            .style("fill", chart.colors[0]);

        if(chart.groupColumn != null) {
            let groups = this.getLegendItems();
            points.style("fill", d => chart.colors[groups.indexOf(d[chart.groupColumn].toString()) % chart.colors.length]);
        }

        this._pointsSelections = points;
    }

    public d3GetXAxis() {
        let chart = this.props.chart as Scatterplot;
        let xScale = d3.scale.linear()
            .domain([
                d3.min(chart.dataset.rows, (r) => +r[chart.xColumn]),
                d3.max(chart.dataset.rows, (r) => +r[chart.xColumn])
            ])
            .range([ this._margin.left, chart.width - this._margin.right ]);
        let xAxis = d3.svg.axis().scale(xScale).orient("bottom");
        return { xScale, xAxis };
    }

    public d3GetYAxis() {
        let chart = this.props.chart as Scatterplot;
        let yScale = d3.scale.linear()
            .domain([
                d3.min(chart.dataset.rows, (r) => +r[chart.yColumn]),
                d3.max(chart.dataset.rows, (r) => +r[chart.yColumn])
            ])
            .range([ chart.height - this._margin.bottom, this._margin.top ])
            .nice();
        let yAxis = d3.svg.axis().scale(yScale).orient("left");
        return { yScale, yAxis };
    }

    public d3GetYAxisWidth() {
        let { yScale, yAxis } = this.d3GetYAxis();
        let tickValues = yScale.ticks(yAxis.ticks()[0]);
        let tickStrings = tickValues.map(yScale.tickFormat());
        return d3.max(tickStrings, (d) => measureTextWidth(d, "Arial", 14)) + 30;
    }

    public d3GetXAxisHeight() {
        return 40;
    }

    public configureChartAccent(chartaccent: ChartAccent.ChartAccent) {
        let chart = this.props.chart as Scatterplot;
        let { xScale, xAxis } = this.d3GetXAxis();
        let { yScale, yAxis } = this.d3GetYAxis();

        let nameFormat = chart.nameColumn ? chart.nameColumn : '"Item"';

        let chartRepresentation = chartaccent.AddChart({
            event_tracker: this.props.eventTracker,
            bounds: {
                x: 0, y: 0, width: this.props.chart.width, height: this.props.chart.height,
                origin_x: 0,
                origin_y: 0
            },
            selection_mode: "lasso",
            default_lasso_label_expression: nameFormat,
            cartesian_scales: {
                x: xScale, y: yScale     // D3 axis.
            },
            tables: [
                { name: "data", data: this.props.chart.dataset.rows, isDefault: true }
            ],
            palette: this.props.chart.colors.slice(0, 6)
        });
        chartRepresentation.addAxis({
            axis: "x",
            origin_y: chart.height - this._margin.bottom,
            name: chart.xLabel.text,
            default_format: findColumnFormat(chart.dataset, chart.xColumn)
        });
        chartRepresentation.addAxis({
            axis: "y",
            origin_x: this._margin.left,
            name: chart.yLabel.text,
            default_format: findColumnFormat(chart.dataset, chart.yColumn)
        });
        chartRepresentation.addSeriesFromD3Selection({
            name: "Data",
            selection: this._pointsSelections,
            default_label: nameFormat,
            bubbleset: "default-on",
            getAxisValue: (d, axis) => {
                if(axis == "x") return d[chart.xColumn];
                if(axis == "y") return d[chart.yColumn];
            },
            getValue: chart.nameColumn ? d => d[chart.nameColumn] : d => "Item",
            itemToString: chart.nameColumn ? d => d[chart.nameColumn] : d => "Item",
            visibility: (f) => {}
        });
        if(chart.groupColumn) {
            let legendItems = this.getLegendItems() || [];
            chartRepresentation.addLegend({
                items: legendItems.map((g, index) => {
                    return {
                        name: g,
                        items: [ {
                            series: "Data",
                            items: chart.dataset.rows.filter(d => d[chart.groupColumn].toString() == g)
                        } ],
                        selection: d3.select(this._legendSelection[0][index]),
                        color: chart.colors[index % chart.colors.length]
                    };
                }),
                bubbleset: "default-on",
                default_label_mode: "label"
            });
        }
    }

    public renderChart() {
        let chart = this.props.chart as Scatterplot;
        return (
            <g ref={(g: SVGGElement) => this._scatterplotChartLayer = g}>
                <g ref={(g: SVGGElement) => this._scatterplotChartContent = g} />
                <g ref={(g: SVGGElement) => this._scatterplotChartXAxis = g} transform={`translate(0, ${chart.height - this._margin.bottom})`} />
                <g ref={(g: SVGGElement) => this._scatterplotChartYAxis = g} transform={`translate(${this._margin.left}, 0)`} />
                <ChartLabel
                    transform={`translate(${this._margin.left - this.d3GetYAxisWidth() + 10}, ${(this._margin.top + chart.height - this._margin.bottom) / 2}) rotate(-90)`}
                    label={chart.yLabel}
                    anchor="middle"
                />
                <ChartLabel
                    transform={`translate(${(this._margin.left + chart.width - this._margin.right) / 2}, ${chart.height - this._margin.bottom + 40})`}
                    label={chart.xLabel}
                    anchor="middle"
                />
            </g>
        );
    }
}
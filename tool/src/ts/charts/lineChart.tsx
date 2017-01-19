import * as React from "react";
import * as d3 from "d3";

import { Chart, BarChart, Row } from "../model/model";
import { BaseChartView } from "./baseChart";
import { ChartLabel, applyAxisStyle, measureTextWidth, findColumnFormat } from "./elements";

import * as ChartAccent from "../chartaccent";

export class LineChartView extends BaseChartView {
    public _lineChartLayer: SVGGElement;
    public _lineChartXAxis: SVGGElement;
    public _lineChartYAxis: SVGGElement;
    public _lineChartContent: SVGGElement;

    private _lineSelections: { line: d3.Selection<any>, dots: d3.Selection<any> }[];

    public getLegendItems(): string[] {
        let chart = this.props.chart as BarChart;
        return chart.yColumns;
    }

    public d3RenderChart() {
        super.d3RenderChart();

        let chart = this.props.chart as BarChart;
        let sel = d3.select(this._lineChartLayer);

        let { xScale, xAxis } = this.d3GetXAxis();
        let { yScale, yAxis } = this.d3GetYAxis();

        d3.select(this._lineChartXAxis).call(xAxis).call(applyAxisStyle);
        d3.select(this._lineChartYAxis).call(yAxis).call(applyAxisStyle);

        d3.select(this._lineChartContent).selectAll("*").remove();
        this._lineSelections = chart.yColumns.map((column, i) => {
            var sp = xScale.rangeBand() / 2;
            var c = d3.select(this._lineChartContent).append("g");
            var line = c.append("path").attr("class", "line")
                .datum(chart.dataset.rows)
                .attr("d", d3.svg.line<Row>().x((d) => xScale(d[chart.xColumn].toString()) + sp).y((d) => yScale(+d[chart.yColumns[i]])))
                .style("stroke", chart.colors[i % chart.colors.length])
                .style("stroke-width", 2)
                .style("stroke-linejoin", "round")
                .style("stroke-linecap", "round")
                .style("fill", "none");

            var dots = c.selectAll(".dot")
                .data(chart.dataset.rows)
            .enter().append("circle")
                .attr("class", "dot")
                .attr("cx", (d) => xScale(d[chart.xColumn].toString()) + sp)
                .attr("cy", (d) => yScale(+d[chart.yColumns[i]]))
                .attr("r", 4).style("fill", chart.colors[i % chart.colors.length]);

            return { line, dots };
        });
    }

    public d3GetXAxis() {
        let chart = this.props.chart as BarChart;
        let xValues = chart.dataset.rows.map((d) => d[chart.xColumn].toString());
        let xScale = d3.scale.ordinal()
            .domain(xValues)
            .rangeRoundBands([ this._margin.left, chart.width - this._margin.right ], 0.4);
        let xAxis = d3.svg.axis().scale(xScale).orient("bottom");
        return { xScale, xAxis };
    }

    public d3GetYAxis() {
        let chart = this.props.chart as BarChart;
        let yScale = d3.scale.linear();
        yScale.range([ chart.height - this._margin.bottom, this._margin.top ])
        yScale.domain([
            chart.yScale.min != null ? chart.yScale.min : d3.min(chart.yColumns, (d) => d3.min(chart.dataset.rows, (r) => +r[d])),
            chart.yScale.max != null ? chart.yScale.max : d3.max(chart.yColumns, (d) => d3.max(chart.dataset.rows, (r) => +r[d]))
        ]);
        if(chart.yScale.min == null && chart.yScale.max == null) {
            yScale.nice();
        }
        let yAxis = d3.svg.axis().scale(yScale).orient("left");
        return { yScale, yAxis };
    }

    public d3GetYAxisWidth() {
        let { yScale, yAxis } = this.d3GetYAxis();
        let tickValues = yScale.ticks(yAxis.ticks()[0]);
        let tickStrings = tickValues.map(yScale.tickFormat());
        return d3.max(tickStrings, (d) => measureTextWidth(d, "Arial", 14)) + 30;
    }

    public configureChartAccent(chartaccent: ChartAccent.ChartAccent) {
        let chart = this.props.chart as BarChart;
        let { xScale, xAxis } = this.d3GetXAxis();
        let { yScale, yAxis } = this.d3GetYAxis();

        let valueFormat = ".1f";
        if(chart.yColumns && chart.yColumns.length > 0) {
            valueFormat = findColumnFormat(chart.dataset, chart.yColumns[0]);
        }
        let valueFormatExpression = 'format("' + valueFormat + '", value)';

        let chartRepresentation = chartaccent.AddChart({
            event_tracker: this.props.eventTracker,
            bounds: {
                x: 0, y: 0, width: this.props.chart.width, height: this.props.chart.height,
                origin_x: 0,
                origin_y: 0
            },
            default_lasso_label: "per-item",
            default_lasso_label_expression: valueFormatExpression,
            cartesian_scales: {
                x: xScale, y: yScale     // D3 axis.
            },
            selection_mode: "marquee",
            tables: [
                { name: "data", data: this.props.chart.dataset.rows, isDefault: true }
            ],
            palette: this.props.chart.colors.slice(0, 6)
        });
        chartRepresentation.addAxis({
            axis: "x",
            origin_y: chart.height - this._margin.bottom,
            name: chart.xColumn
        });
        chartRepresentation.addAxis({
            axis: "y",
            origin_x: this._margin.left,
            name: chart.yLabel.text,
            default_format: valueFormat
        });
        this._lineSelections.forEach((sel, index) => {
            let yColumn = chart.yColumns[index];
            chartRepresentation.addSeriesFromD3Selection({
                name: yColumn,
                selection: sel.dots,
                path: sel.line,
                default_label: valueFormatExpression,
                getAxisValue: function(d, axis) {
                    if(axis == "x") return d[chart.xColumn];
                    if(axis == "y") return d[yColumn];
                },
                getValue: function(d) {
                    return d[yColumn];
                },
                itemToString: (d) => d3.format(valueFormat)(d[yColumn]),
                visibility: function(f) {
                    // sel.style("visibility", (d) => f(d) ? "visible" : "hidden");
                }
            });
        });
        let legendItems = this.getLegendItems() || [];
        chartRepresentation.addLegend({
            items: legendItems.map((d, index) => {
                return {
                    name: d,
                    items: [ {
                        series: d,
                        items: chart.dataset.rows
                    } ],
                    selection: d3.select(this._legendSelection[0][index])
                };
            }),
            default_label_mode: "item-label",
            default_label: valueFormatExpression
        });
    }

    public renderChart() {
        let chart = this.props.chart as BarChart;
        return (
            <g ref={(g: SVGGElement) => this._lineChartLayer = g}>
                <g ref={(g: SVGGElement) => this._lineChartContent = g} />
                <g ref={(g: SVGGElement) => this._lineChartXAxis = g} transform={`translate(0, ${chart.height - this._margin.bottom})`} />
                <g ref={(g: SVGGElement) => this._lineChartYAxis = g} transform={`translate(${this._margin.left}, 0)`} />
                <ChartLabel
                    transform={`translate(${this._margin.left - this.d3GetYAxisWidth() + 10}, ${(this._margin.top + chart.height - this._margin.bottom) / 2}) rotate(-90)`}
                    label={chart.yLabel}
                    anchor="middle"
                />
            </g>
        );
    }
}
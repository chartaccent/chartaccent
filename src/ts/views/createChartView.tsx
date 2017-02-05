import * as React from "react";
import * as d3 from "d3";

import * as Actions from "../store/actions";
import { Chart, BarChart, Scatterplot, LineChart, Defaults } from "../model/model";

import { getColumnsForDistinctAxis, getColumnsForContinuousAxis } from "../model/utils";
import * as InputWidgets from "./inputWidgets";

import { HorizontalRule } from "../controls/controls";

import { ChartView } from "../charts/chartView";
import { MainStore } from "../store/store";

export class ChartTypeView extends React.Component<{
    chart: Chart;
}, {}> {
    public render() {
        let chartTypes = [
            { type: "bar-chart", "caption": "Bar Chart", thumbnail: "assets/images/bar-chart.png" },
            { type: "line-chart", "caption": "Line Chart", thumbnail: "assets/images/line-chart.png" },
            { type: "scatterplot", "caption": "Scatterplot", thumbnail: "assets/images/scatterplot.png" }
        ]

        return (
            <section className="section-choose-chart">
                <h2>Choose a Chart</h2>
                <p data-intro="Choose a chart that best suits your dataset. Non-suitable chart types are disabled.">
                {
                    chartTypes.map((item) => (
                        <button
                            className={`button-chart-type ${item.type == this.props.chart.type ? "active" : ""} ${Defaults.isChartValid(this.props.chart.dataset, item.type) ? "" : "disabled" }`}
                            onClick={() => {
                                if(Defaults.isChartValid(this.props.chart.dataset, item.type)) {
                                    new Actions.UpdateChartType(this.props.chart, item.type).dispatch();
                                }
                            }}
                        >
                            <img src={item.thumbnail} />
                            <span>{item.caption}</span>
                        </button>
                    ))
                }
                </p>
            </section>
        );
    }
}

export interface ICreateChartViewProps {
    chart: Chart;
    store: MainStore;
}

export class CreateChartView extends React.Component<ICreateChartViewProps, {}> {
    refs: {
        [ name: string ]: Element;
    }

    public onChartChanged() {
        this.forceUpdate();
    }

    public renderFor(type: string) {
        switch(type) {
            case "line-chart":
            case "bar-chart": {
                return this.renderForBarOrLineChart(type);
            };
            case "scatterplot": {
                return this.renderForScatterplot();
            };
        }
    }

    public renderForBarOrLineChart(type: "bar-chart" | "line-chart") {
        let chart = this.props.chart as BarChart | LineChart;

        let xColumnCandidates = getColumnsForDistinctAxis(chart.dataset);
        let yColumnCandidates = getColumnsForContinuousAxis(chart.dataset);

        return (
            <div className="widget-row">
                <div className="col-6">
                    <div className="options-panel">
                        <h3>X Axis</h3>
                        <div className="widget-row widget-row-p">
                            <InputWidgets.ColumnWidget
                                columnCount={12}
                                text="X"
                                title="choose a column for x axis"
                                column={chart.xColumn}
                                candidates={xColumnCandidates}
                                onChange={(newColumn) => new Actions.UpdateChartXColumn(chart, newColumn).dispatch()}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-6">
                    <div className="options-panel">
                        <h3>Y Axis</h3>
                        <div className="widget-row widget-row-p">
                            <InputWidgets.ColumnsWidget
                                columnCount={12}
                                text="Y"
                                title="choose a column for x axis"
                                columns={chart.yColumns || []}
                                candidates={yColumnCandidates}
                                onChange={(newColumns) => new Actions.UpdateChartYColumns(chart, newColumns).dispatch()}
                            />
                        </div>
                        <div className="widget-row widget-row-p">
                            <InputWidgets.ScaleWidget
                                columnCount={12}
                                text="Y"
                                title="y range"
                                scale={chart.yScale}
                                onChange={(newScale) => new Actions.UpdateChartYScale(chart, newScale).dispatch()}
                            />
                        </div>
                        <div className="widget-row widget-row-p">
                            <InputWidgets.LabelWidget
                                columnCount={12}
                                text="Label"
                                title="enter the label for Y axis"
                                label={chart.yLabel}
                                onChange={(newTitle) => new Actions.UpdateChartYLabel(chart, newTitle).dispatch()}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    public renderForScatterplot() {
        let chart = this.props.chart as Scatterplot;

        let xyColumnCandidates = getColumnsForContinuousAxis(chart.dataset);

        let groupColumnCandidates = chart.dataset.columns
            .filter((d) => d.type == "string")
            .map((d) => d.name);

        return (
            <div>
                <div className="widget-row">
                    <div className="col-6">
                        <div className="options-panel">
                            <h3>X Axis</h3>
                            <div className="widget-row widget-row-p">
                                <InputWidgets.ColumnWidget
                                    columnCount={12}
                                    text="X"
                                    title="choose a column for x axis"
                                    column={chart.xColumn}
                                    candidates={xyColumnCandidates}
                                    onChange={(newColumn) => new Actions.UpdateChartXColumn(chart, newColumn).dispatch()}
                                />
                            </div>
                            <div className="widget-row widget-row-p">
                                <InputWidgets.LabelWidget
                                    columnCount={12}
                                    text="Label"
                                    title="enter the label for X axis"
                                    label={chart.xLabel}
                                    onChange={(newTitle) => new Actions.UpdateChartXLabel(chart, newTitle).dispatch()}
                                />
                            </div>
                            <div className="widget-row widget-row-p">
                                <InputWidgets.ScaleWidget
                                    columnCount={12}
                                    text="X"
                                    title="x range"
                                    scale={chart.xScale}
                                    onChange={(newScale) => new Actions.UpdateChartXScale(chart, newScale).dispatch()}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="options-panel">
                            <h3>Y Axis</h3>
                            <div className="widget-row widget-row-p">
                                <InputWidgets.ColumnWidget
                                    columnCount={12}
                                    text="Y"
                                    title="choose a column for x axis"
                                    column={chart.yColumn}
                                    candidates={xyColumnCandidates}
                                    onChange={(newColumn) => new Actions.UpdateChartYColumn(chart, newColumn).dispatch()}
                                />
                            </div>
                            <div className="widget-row widget-row-p">
                                <InputWidgets.LabelWidget
                                    columnCount={12}
                                    text="Label"
                                    title="enter the label for Y axis"
                                    label={chart.yLabel}
                                    onChange={(newTitle) => new Actions.UpdateChartYLabel(chart, newTitle).dispatch()}
                                />
                            </div>
                            <div className="widget-row widget-row-p">
                                <InputWidgets.ScaleWidget
                                    columnCount={12}
                                    text="Y"
                                    title="y range"
                                    scale={chart.yScale}
                                    onChange={(newScale) => new Actions.UpdateChartYScale(chart, newScale).dispatch()}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="widget-row">
                    <div className="col-12">
                        <div className="options-panel">
                            <h3>Points</h3>
                            <div className="widget-row widget-row-p">
                                <InputWidgets.ColumnWidget
                                    columnCount={4}
                                    text="Color"
                                    title="choose a column for color"
                                    column={chart.groupColumn}
                                    allowNull={true}
                                    candidates={groupColumnCandidates}
                                    onChange={(newColumn) => new Actions.UpdateChartGroupColumn(chart, newColumn).dispatch()}
                                />
                                <InputWidgets.ColumnWidget
                                    columnCount={4}
                                    text="Size"
                                    title="choose a column for size"
                                    column={chart.sizeColumn}
                                    allowNull={true}
                                    candidates={xyColumnCandidates}
                                    onChange={(newColumn) => new Actions.UpdateChartSizeColumn(chart, newColumn).dispatch()}
                                />
                                <InputWidgets.ColumnWidget
                                    columnCount={4}
                                    text="Label"
                                    title="choose a column for name"
                                    allowNull={true}
                                    column={chart.nameColumn}
                                    candidates={groupColumnCandidates}
                                    onChange={(newColumn) => new Actions.UpdateChartNameColumn(chart, newColumn).dispatch()}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    public render() {
        let chart = this.props.chart;
        let dataset = chart.dataset;
        return (
            <section className="section-create-chart">
                <h2>Configure and Annotate</h2>
                <div className="chart-options" data-intro="Specify chart options such as X/Y axes, data series, chart title, and color scheme.">
                    <div className="widget-row">
                        <div className="col-4">
                            <div className="widget-row">
                                <div className="col-12">
                                    <div className="options-panel">
                                        <h3>General</h3>
                                        <div className="widget-row widget-row-p">
                                            <InputWidgets.LabelWidget
                                                columnCount={12}
                                                text="Title"
                                                title="enter chart title"
                                                label={chart.title}
                                                onChange={(newTitle) => new Actions.UpdateChartTitle(chart, newTitle).dispatch()}
                                            />
                                        </div>
                                        <div className="widget-row widget-row-p">
                                            <InputWidgets.WidthHeightWidget
                                                columnCount={12}
                                                text="Title"
                                                title="enter chart title"
                                                width={chart.width}
                                                height={chart.height}
                                                onChange={(newWidth, newHeight) => new Actions.UpdateChartWidthHeight(chart, newWidth, newHeight).dispatch()}
                                            />
                                        </div>
                                        <div className="widget-row widget-row-p">
                                            <InputWidgets.ColorsWidget
                                                columnCount={12}
                                                text="Colors"
                                                title="choose a color palette"
                                                colors={chart.colors || []}
                                                onChange={(newColors) => new Actions.UpdateChartColors(chart, newColors).dispatch()}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-8">
                        { this.renderFor(chart.type) }
                        </div>
                    </div>
                </div>
                { chart.type != null ? <ChartView chart={chart} store={this.props.store} /> : null }
            </section>
        );
    }
}
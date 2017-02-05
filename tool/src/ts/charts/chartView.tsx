import * as React from "react";
import * as d3 from "d3";

import { Chart, BarChart, Scatterplot } from "../model/model";

import * as Actions from "../store/actions";
import { MainStore } from "../store/store";

import { BaseChartView } from "./baseChart";
import { BarChartView } from "./barChart";
import { LineChartView } from "./lineChart";
import { ScatterplotView } from "./scatterplot";

import { Button, HorizontalRule } from "../controls/controls";

import * as ChartAccent from "../chartaccent";

import { isSameArray, isSubset } from "../utils/utils";

export interface IChartViewProps {
    chart: Chart;
    store: MainStore;
}

export interface IChartViewState {
}

export interface ChartInfo {
    type: string;
    dataLength: number;
    xColumns: string[];
    yColumns: string[];
    groupColumn: string;
}

export class ChartView extends React.Component<IChartViewProps, IChartViewState> {
    refs: {
        chartView: BaseChartView;
        panelContainer: HTMLDivElement;
        toolbarContainer: HTMLDivElement;
    }

    protected chartAccent: ChartAccent.ChartAccent;
    protected currentChartInfo: ChartInfo;

    constructor(props: IChartViewProps) {
        super(props);
    }

    public componentDidMount() {
        this.componentDidUpdate();
    }

    public componentDidUpdate() {
        d3.select(this.refs.chartView.getAnnotationBackgroundLayer()).selectAll("*").remove();
        d3.select(this.refs.chartView.getAnnotationLayer()).selectAll("*").remove();
        d3.select(this.refs.panelContainer).selectAll("*").remove();
        d3.select(this.refs.toolbarContainer).selectAll("*").remove();

        let chart = this.props.chart;
        let newChartInfo: ChartInfo;
        switch(this.props.chart.type) {
            case "bar-chart":
            case "line-chart": {
                newChartInfo = {
                    type: chart.type,
                    dataLength: chart.dataset.rows.length,
                    xColumns: [ (chart as BarChart).xColumn ],
                    yColumns: (chart as BarChart).yColumns,
                    groupColumn: null
                };
            } break;
            case "scatterplot": {
                newChartInfo = {
                    type: chart.type,
                    dataLength: chart.dataset.rows.length,
                    xColumns: [ (chart as Scatterplot).xColumn ],
                    yColumns: [ (chart as Scatterplot).yColumn ],
                    groupColumn: (chart as Scatterplot).groupColumn
                };
            } break;
        }

        let saved: ChartAccent.SavedAnnotations;
        if(this.chartAccent && this.currentChartInfo) {
            // Check if the old and new chart are consistent:
            let shouldSave = false;
            switch(newChartInfo.type) {
                case "bar-chart":
                case "line-chart": {
                    if(this.currentChartInfo.type == "bar-chart" || this.currentChartInfo.type == "line-chart") {
                        shouldSave =
                            isSameArray(this.currentChartInfo.xColumns, newChartInfo.xColumns) &&
                            isSubset(this.currentChartInfo.yColumns, newChartInfo.yColumns)
                    }
                } break;
                case "scatterplot": {
                    if(this.currentChartInfo.type == "scatterplot") {
                        shouldSave =
                            isSameArray(this.currentChartInfo.xColumns, newChartInfo.xColumns) &&
                            isSameArray(this.currentChartInfo.yColumns, newChartInfo.yColumns) &&
                            this.currentChartInfo.groupColumn == newChartInfo.groupColumn;
                    }
                } break;
            }
            if(shouldSave) {
                saved = this.chartAccent.saveAnnotations();
            }
        }
        this.chartAccent = ChartAccent.Create({
            layer_background: d3.select(this.refs.chartView.getAnnotationBackgroundLayer()),
            layer_annotation: d3.select(this.refs.chartView.getAnnotationLayer()),
            panel: d3.select(this.refs.panelContainer),
            toolbar: d3.select(this.refs.toolbarContainer),
        });
        this.refs.chartView.configureChartAccent(this.chartAccent);
        this.currentChartInfo = newChartInfo;
        if(saved) {
            try {
                this.chartAccent.loadAnnotations(saved);
            } catch(e) {
                console.log(e.stack, e);
                // If something wrong here, let's discard previously created annotations
                this.chartAccent = null;
                this.componentDidUpdate();
            }
        }
        this.props.store.setChartAccent(this.chartAccent);
        this.props.store.setExportAs(this.exportAs.bind(this));
    }

    public trackEvent(type: string, value: string) {
        this.props.store.logger.log(type, value);
    }

    public trackChartEvent(type: string, value: string) {
        this.trackEvent("annotation/" + type, value);
    }

    public exportAs(type: "svg" | "png" | "gif", callback: (blob: Blob) => void) {
        let do_download = (url: Blob) => {
            saveAs(url, "chartaccent." + type);
            callback(url);
        };
        if(type == "svg") {
            var blob = this.chartAccent.getSVGDataBlob();
            do_download(blob);
        }
        if(type == "png") {
            this.chartAccent.getImageDataBlob("image/png", 4, (blob) => {
                do_download(blob);
            });
        }
        if(type == "gif") {
            this.chartAccent.getAnimatedGIFImages(function(blob) {
                do_download(blob);
            });
        }
        this.trackEvent("export/" + type, this.chartAccent.summarizeState());
    }

    public renderChartView() {
        let chart = this.props.chart;
        switch(chart.type) {
            case "bar-chart": return (<BarChartView ref="chartView" chart={chart} eventTracker={(action, label) => this.trackChartEvent(action, label)} />);
            case "line-chart": return (<LineChartView ref="chartView" chart={chart} eventTracker={(action, label) => this.trackChartEvent(action, label)} />);
            case "scatterplot": return (<ScatterplotView ref="chartView" chart={chart} eventTracker={(action, label) => this.trackChartEvent(action, label)} />);
        }
        return null;
    }

    public render() {
        return (
            <div>
                <div className="chart-view" data-intro="Annotate your chart here. <a href='index.html#section-tutorial'>Click to see more details.</a>">
                    <div className="panel-container">
                        <div ref="panelContainer" className="panel" />
                    </div>
                    <div ref="toolbarContainer" className="toolbar" />
                    <div className="chart">
                        <div className="chart-container" style={{ width: this.props.chart.width + "px", height: this.props.chart.height + "px" }}>
                        { this.renderChartView() }
                        <div className="corner-resize" onMouseDown={(e) => this.onResizeStart(e)}>
                            <img src="assets/images/corner.svg" />
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    public onResizeStart(e0: React.MouseEvent<HTMLDivElement>) {
        let width0 = this.props.chart.width;
        let height0 = this.props.chart.height;
        let x0 = e0.pageX;
        let y0 = e0.pageY;
        let onMouseMove = (e: MouseEvent) => {
            let nWidth = width0 + e.pageX - x0;
            let nHeight = height0 + e.pageY - y0;
            nWidth = Math.max(300, Math.min(3000, nWidth));
            nHeight = Math.max(200, Math.min(2000, nHeight));
            new Actions.UpdateChartWidthHeight(this.props.chart, nWidth, nHeight).dispatch();
        }
        let onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp, true);
        }
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp, true);
    }
}
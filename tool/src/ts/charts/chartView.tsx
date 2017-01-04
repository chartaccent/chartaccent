import * as React from "react";
import * as d3 from "d3";

import { Chart } from "../model/model";

import * as Actions from "../store/actions";

import { BaseChartView } from "./baseChart";
import { BarChartView } from "./barChart";
import { LineChartView } from "./lineChart";
import { ScatterplotView } from "./scatterplot";

import { Button, HorizontalRule } from "../controls/controls";

import * as ChartAccent from "../chartaccent";

export interface IChartViewProps {
    chart: Chart;
}

export interface IChartViewState {
}

export class ChartView extends React.Component<IChartViewProps, IChartViewState> {
    refs: {
        chartView: BaseChartView;
        panelContainer: HTMLDivElement;
        toolbarContainer: HTMLDivElement;
    }

    protected chartAccent: ChartAccent.ChartAccent;

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
        let saved: ChartAccent.SavedAnnotations;
        if(this.chartAccent) {
            saved = this.chartAccent.saveAnnotations();
        }
        this.chartAccent = ChartAccent.Create({
            layer_background: d3.select(this.refs.chartView.getAnnotationBackgroundLayer()),
            layer_annotation: d3.select(this.refs.chartView.getAnnotationLayer()),
            panel: d3.select(this.refs.panelContainer),
            toolbar: d3.select(this.refs.toolbarContainer),
        });
        this.refs.chartView.configureChartAccent(this.chartAccent);
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
        // this.trackEvent("export/" + type, self.chartaccent.summarizeState());
    }

    public renderChartView() {
        let chart = this.props.chart;
        switch(chart.type) {
            case "bar-chart": return (<BarChartView ref="chartView" chart={chart} />);
            case "line-chart": return (<LineChartView ref="chartView" chart={chart} />);
            case "scatterplot": return (<ScatterplotView ref="chartView" chart={chart} />);
        }
        return null;
    }

    public render() {
        return (
            <section>
                <HorizontalRule />
                <h2>Annotate</h2>
                <div className="chart-view">
                    <div ref="panelContainer" className="panel" />
                    <div ref="toolbarContainer"  className="toolbar" />
                    <div className="chart">
                        <div className="chart-container" style={{ width: this.props.chart.width + "px", height: this.props.chart.height + "px" }}>
                        { this.renderChartView() }
                        <div className="corner-resize" onMouseDown={(e) => this.onResizeStart(e)}></div>
                        </div>
                    </div>
                </div>
                <HorizontalRule />
                <h2>Export</h2>
                <p>
                    <Button text="Export PNG" onClick={() => this.exportAs("png", () => {})} />
                    {" "}
                    <Button text="Export SVG" onClick={() => this.exportAs("svg", () => {})} />
                    {" "}
                    <Button text="Export Animated GIF" onClick={() => this.exportAs("gif", () => {})} />
                </p>
            </section>
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
            window.removeEventListener("mouseup", onMouseUp);
        }
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }
}
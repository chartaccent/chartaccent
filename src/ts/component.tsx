// This file is the entry point of the ChartAccent PowerBI custom visual
import * as React from "react";
import * as ReactDOM from "react-dom";
import { EventEmitter } from "fbemitter";

import { ChartView, createChartView, IChartViewStore } from "./charts/chartView";
import { BaseChartView } from "./charts/baseChart";
import { Dataset, Chart } from "./model/model";
import * as ChartAccent from "./chartaccent";

export interface IChartAccentComponentOptions {
    chart?: Chart;
    mode?: "editing" | "viewing";
    showConsole?: boolean;
    messages?: string[];
    error?: string;
}

export class ImageOverlayView extends React.Component<{}, { url: string }> {
    constructor(props: {}) {
        super(props);
        this.state = {
            url: null
        }
    }
    public render() {
        return (
            <div style={{
                position: "fixed", left: "0", right: "0", top: "0", bottom: "0", zIndex: 10000,
                background: "#ffffff",
                pointerEvents: "all",
                cursor: "default"
            }}>
                <div style={{
                    backgroundImage: "url(" + this.state.url + ")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "contain",
                    position: "absolute",
                    left: "0", right: "0", top: "0", bottom: "0"
                }} />
            </div>
        );
    }
}

export class ChartAccentComponentView extends React.Component<{
    store: IChartViewStore
}, IChartAccentComponentOptions> {
    chartView: ChartView;
    overlay: ImageOverlayView;

    constructor(props: { store: IChartViewStore }) {
        super(props);
        this.state = {
            messages: []
        };
    }
    public render() {
        if (this.state.error != null) {
            return (<pre style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word"
            }}>{this.state.error}</pre>);
        }
        if (this.state.chart) {
            return (
                <div className="chart-view-container">
                    <ChartView chart={this.state.chart} ref={(view) => { this.chartView = view; }} store={this.props.store} />
                    {this.state.mode == "viewing" ? <ImageOverlayView ref={(overlay) => { this.overlay = overlay; }} /> : null}
                </div>
            );
        } else {
            return (<div>Please specify the chart options</div>);
        }
    }

    public componentDidUpdate() {
        requestAnimationFrame(() => {
            if (this.state.mode == "viewing") {
                if (this.chartView && this.overlay) {
                    let dataurl = this.chartView.getSVGDataURLBase64();
                    this.overlay.setState({ url: dataurl });
                }
            }
        });
    }


    // public renderConsole() {
    //     return (<div>
    //         <div style={{
    //             maxHeight: "300px",
    //             overflowY: "scroll"
    //         }}>{this.state.messages.map(m => <pre style={{
    //             whiteSpace: "pre-wrap",
    //             wordWrap: "break-word"
    //         }}>{m}</pre>)}</div>
    //         <p>
    //             <input ref="commandInput" type="text" />
    //             <button onClick={() => {
    //                 let cmd = ((this.refs as any).commandInput).value;
    //                 let result = "";
    //                 try {
    //                     result = eval(cmd).toString();
    //                 } catch (e) {
    //                     result = e.message + "\n" + e.stack;
    //                 }
    //                 this.state.messages.push(result);
    //                 this.setState({ messages: this.state.messages });
    //             }}>Run</button>
    //         </p>
    //     </div>)
    // }

    // public render() {
    //     if (this.state.showConsole) {
    //         return (
    //             <div>
    //                 {this.renderConsole()}
    //                 {this.renderChart()}
    //             </div>
    //         );
    //     } else {
    //         return this.renderChart();
    //     }
    // }
}

export class ChartAccentComponent extends EventEmitter {
    public container: HTMLDivElement;
    public chartView: ChartAccentComponentView;
    public chartAccent: ChartAccent.ChartAccent;
    public nextLoadAnnotations: ChartAccent.SavedAnnotations;

    constructor(container: HTMLDivElement) {
        super();

        this.container = container;

        ChartAccent.setRootContainer(container);

        this.chartView = ReactDOM.render(<ChartAccentComponentView store={{
            disableResize: true,
            setChartAccent: (chartaccent: ChartAccent.ChartAccent) => {
                this.chartAccent = chartaccent;
                if (this.nextLoadAnnotations) {
                    this.chartAccent.loadAnnotations(this.nextLoadAnnotations);
                    this.chartView.componentDidUpdate();
                    this.nextLoadAnnotations = null;
                }
            },
            setExportAs: (func: (type: string, callback: (blob: Blob, doDownload: () => void) => void) => void) => {
            },
            logger: {
                logAction: (action: string, label: string, privateData: any) => {
                    this.emit("action", action, label, privateData);
                }
            }
        }} />, this.container) as ChartAccentComponentView;
    }

    public saveAnnotations() {
        return this.chartAccent.saveAnnotations();
    }

    public loadAnnotations(data: ChartAccent.SavedAnnotations) {
        if (this.chartAccent) {
            this.chartAccent.loadAnnotations(data);
            this.chartView.componentDidUpdate();
        } else {
            this.nextLoadAnnotations = data;
        }
    }

    public update(options: IChartAccentComponentOptions) {
        this.chartView.setState(options);
    }

    public getWidth() {
        if(this.chartView.state.chart) {
            return this.chartView.state.chart.width;
        } else {
            return null;
        }
    }

    public getHeight() {
        if(this.chartView.state.chart) {
            return this.chartView.state.chart.height;
        } else {
            return null;
        }
    }

    public destroy() {
        ReactDOM.unmountComponentAtNode(this.container);
    }
}

(window as any)["ChartAccentComponent"] = ChartAccentComponent;
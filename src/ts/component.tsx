// This file is the entry point of the ChartAccent PowerBI custom visual
import * as React from "react";
import * as ReactDOM from "react-dom";

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

export class ChartAccentComponentView extends React.Component<{
    store: IChartViewStore
}, IChartAccentComponentOptions> {
    constructor(props: {}) {
        super(props);
        this.state = {
            messages: []
        };
    }
    public renderChart() {
        if (this.state.error != null) {
            return (<pre style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word"
            }}>{this.state.error}</pre>);
        }
        if (this.state.chart) {
            if (this.state.mode == "viewing") {
                return createChartView(this.state.chart);
            } else {
                return (
                    <div className="chart-view-container">
                        <ChartView chart={this.state.chart} store={this.props.store} />
                    </div>
                );
            }
        } else {
            return (<div>Please specify the chart options</div>);
        }
    }

    public renderConsole() {
        return (<div>
            <div style={{
                maxHeight: "300px",
                overflowY: "scroll"
            }}>{this.state.messages.map(m => <pre style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word"
            }}>{m}</pre>)}</div>
            <p>
                <input ref="commandInput" type="text" />
                <button onClick={() => {
                    let cmd = ((this.refs as any).commandInput).value;
                    let result = "";
                    try {
                        result = eval(cmd).toString();
                    } catch (e) {
                        result = e.message + "\n" + e.stack;
                    }
                    this.state.messages.push(result);
                    this.setState({ messages: this.state.messages });
                }}>Run</button>
            </p>
        </div>)
    }

    public render() {
        if (this.state.showConsole) {
            return (
                <div>
                    {this.renderConsole()}
                    {this.renderChart()}
                </div>
            );
        } else {
            return this.renderChart();
        }
    }
}

export class ChartAccentComponent {
    public container: HTMLDivElement;
    public chartView: ChartAccentComponentView;
    public chartAccent: ChartAccent.ChartAccent;

    constructor(container: HTMLDivElement) {
        this.container = container;

        ChartAccent.setRootContainer(container);

        this.chartView = ReactDOM.render(<ChartAccentComponentView store={{
            setChartAccent: (chartaccent: ChartAccent.ChartAccent) => {
                this.chartAccent = chartaccent;
            },
            setExportAs: (func: (type: string, callback: (blob: Blob, doDownload: () => void) => void) => void) => {
            },
            logger: {
                logAction: (action: string, label: string, privateData: any) => {

                }
            }
        }} />, this.container) as ChartAccentComponentView;
    }

    public saveAnnotations() {
        return this.chartAccent.saveAnnotations();
    }

    public loadAnnotations(data: ChartAccent.SavedAnnotations) {
        this.chartAccent.loadAnnotations(data);
    }

    public update(options: IChartAccentComponentOptions) {
        this.chartView.setState(options);
    }

    public destroy() {
        ReactDOM.unmountComponentAtNode(this.container);
    }
}

(window as any)["ChartAccentComponent"] = ChartAccentComponent;
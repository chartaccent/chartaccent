import * as React from "react";

import { globalStore } from "../store/store";
import * as Actions from "../store/actions";

import * as d3 from "d3";
import { EventSubscription } from "fbemitter";

export class ChartTypeView extends React.Component<{
    chartType: string;
    onChange?: (chartType: string) => void;
}, {}> {
    public render() {
        let chartTypes = [
            { type: "bar-chart", "caption": "Bar Chart", thumbnail: "assets/images/bar-chart.png" },
            { type: "line-chart", "caption": "Line Chart", thumbnail: "assets/images/line-chart.png" },
            { type: "scatterplot", "caption": "Scatterplot", thumbnail: "assets/images/scatterplot.png" }
        ]
        return (
            <p>
            {
                chartTypes.map((item) => (
                    <button
                        className={`button-chart-type ${item.type == this.props.chartType ? "active" : ""}`}
                        onClick={() => {
                            if(this.props.onChange != null) {
                                this.props.onChange(item.type)
                            }
                        }}
                    >
                        <img src={item.thumbnail} />
                        <span>{item.caption}</span>
                    </button>
                ))
            }
            </p>
        )
    }
}

export class CreateChartView extends React.Component<{}, {}> {
    refs: {
        [ name: string ]: Element;
    }

    private _subscriptions: EventSubscription[] = [];

    public componentDidMount() {
        this._subscriptions.push(globalStore.addListener("chart-changed", () => this.onChartChanged()));
    }

    public componentWillUnmount() {
        for(let sub of this._subscriptions) {
            sub.remove();
        }
    }

    public onChartChanged() {
        this.forceUpdate();
    }

    public render() {
        if(globalStore.chart == null) {
            return (
                <section className="section-review-data">
                </section>
            )
        } else {
            let dataset = globalStore.dataset;
            return (
                <section className="section-create-chart">
                    <h2>Create Chart</h2>
                    <ChartTypeView
                        chartType={globalStore.chart.type}
                    />
                </section>
            );
        }
    }
}
import * as React from "react";

import { globalStore } from "../store/store";
import * as Actions from "../store/actions";

import * as d3 from "d3";
import { EventSubscription } from "fbemitter";

export class ReviewDataView extends React.Component<{}, {}> {
    refs: {
        [ name: string ]: Element;
    }

    private _subscriptions: EventSubscription[] = [];

    public componentDidMount() {
        this._subscriptions.push(globalStore.addListener("dataset-changed", () => this.onDatasetChanged()));
    }

    public componentWillUnmount() {
        for(let sub of this._subscriptions) {
            sub.remove();
        }
    }

    public onDatasetChanged() {
        this.forceUpdate();
    }

    public render() {
        if(globalStore.dataset == null) {
            return (
                <section className="section-review-data">
                </section>
            )
        } else {
            let dataset = globalStore.dataset;
            return (
                <section className="section-review-data">
                    <h2>Check column types and digits</h2>
                    <p>ChartAccent automatically detect data types and set the number of displayed digits.</p>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr className="column-name">
                                    { dataset.columns.map((column, index) => <th key={`c${index}`}>{column.name}</th>) }
                                </tr>
                                <tr className="column-type">
                                    { dataset.columns.map((column, index) => <th key={`c${index}`}>{column.type}</th>) }
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    dataset.rows.map((row, rowIndex) => {
                                        return (
                                            <tr key={`r${rowIndex}`}>
                                                { dataset.columns.map((column, index) => <td key={`c${index}`}>{row[column.name]}</td>) }
                                            </tr>
                                        );
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </section>
            );
        }
    }
}
import * as React from "react";
import { EventSubscription } from "fbemitter";
import * as d3 from "d3";

import * as Actions from "../store/actions";
import { Dataset } from "../model/model";
import { HorizontalRule } from "../controls/controls";

export class ReviewDataView extends React.Component<{
    dataset: Dataset;
}, {}> {
    refs: {
        [ name: string ]: Element;
    }

    public onDatasetChanged() {
        this.forceUpdate();
    }

    public render() {
        let dataset = this.props.dataset;
        return (
            <section className="section-review-data">
                <HorizontalRule />
                <h2>Review Data</h2>
                <p className="note">ChartAccent automatically detect data types and set the number of displayed digits.</p>
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
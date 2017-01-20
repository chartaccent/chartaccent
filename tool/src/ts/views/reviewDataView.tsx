import * as React from "react";
import { EventSubscription } from "fbemitter";
import * as d3 from "d3";

import * as Actions from "../store/actions";
import { Dataset, RowType } from "../model/model";
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

    public formatValue(type: string, format: string, value: RowType): string {
        if(value == null) return "N/A";
        switch(type) {
            case "string": {
                return value.toString();
            }
            case "integer":
            case "number": {
                let fmt = d3.format(format);
                return fmt(value as number);
            }
            case "date": {
                let fmt = d3.time.format(format);
                return fmt(value as Date);
            }
            default: {
                return value.toString();
            }
        }
    }

    public render() {
        let dataset = this.props.dataset;
        return (
            <div className="table-container" data-intro="You can review your dataset before creating a chart.">
                <table>
                    <thead>
                        <tr className="column-name">
                            { dataset.columns.map((column, index) => <th key={`c${index}`}>{column.name}</th>) }
                        </tr>
                    </thead>
                    <tbody>
                        {
                            dataset.rows.map((row, rowIndex) => {
                                return (
                                    <tr key={`r${rowIndex}`}>
                                        { dataset.columns.map((column, index) => <td key={`c${index}`} className={`rowtype-${column.type}`}>{this.formatValue(column.type, column.format, row[column.name])}</td>) }
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
            </div>
        );
    }
}
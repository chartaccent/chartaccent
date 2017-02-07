import * as React from "react";
import * as d3 from "d3";

import { Button } from "../controls/controls";
import { ColumnWidget } from "./inputWidgets";
import { MainStore } from "../store/store";
import * as Actions from "../store/actions";
import { Dataset, RowType } from "../model/model";

export class LoadDataView extends React.Component<{
    store: MainStore,
    dataset: Dataset
}, {}> {
    refs: {
        [ name: string ]: Element;
        inputFile: HTMLInputElement;
        inputFileForm: HTMLFormElement;
    }

    public render() {
        return (
            <section className="section-load-data">
                <h2>Choose Data File (CSV)</h2>
                <p data-intro="Open your CSV file or load one of our sample datasets.">
                    <Button text="Choose File" onClick={() => {
                        this.refs.inputFileForm.reset();
                        this.refs.inputFile.onchange = () => {
                            if(this.refs.inputFile.files.length == 1) {
                                let file = this.refs.inputFile.files[0];
                                let fileName = file.name;
                                let fileReader = new FileReader();
                                fileReader.onload = () => {
                                    let content = fileReader.result;
                                    new Actions.LoadData(fileName, content, "csv").dispatch();
                                };
                                fileReader.readAsText(file, "utf-8");
                            } else {
                                // The user didn't choose anything
                            }
                        };
                        this.refs.inputFile.click();
                    }} />
                    <span> or </span>
                    <div style={{ width: "300px", display: "inline-block" }}>
                        <ColumnWidget
                            columnCount={6}
                            candidates={this.props.store.samples.map(d => d.name)}
                            column={null}
                            contentOnly={true}
                            nullText="load sample dataset..."
                            onChange={(sampleName) => {
                                let samples = this.props.store.samples.filter((s) => s.name == sampleName);
                                if(samples.length > 0) {
                                    let sample = samples[0];
                                    d3.text(sample.csv, "text/plain", (err, data) => {
                                        if(!err) {
                                            let name = sample.csv.slice(sample.csv.lastIndexOf("/") + 1);
                                            new Actions.LoadData(name, data, "csv", sampleName).dispatch();
                                        }
                                    });
                                }
                            }}
                            text="or"
                        />
                    </div>
                    <form ref="inputFileForm">
                        <input ref="inputFile" className="invisible" type="file" accept=".csv" />
                    </form>
                </p>
                <p className="note"><strong>Privacy Notes</strong></p>
                <p className="note" style={{ maxWidth: "600px", textAlign: "justify" }}>
                    While you are using the tool, we log anonymous interaction information to help us improve your experience.
                    Your data remains on your machine and is not sent to us unless you export the content you create and share it with us.
                    We will use the anonymous information and the data you share with us for research and may include them in future publications.
                </p>
                { this.props.dataset != null ? <ReviewDataView dataset={this.props.dataset} /> : null }
            </section>
        );
    }
}

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
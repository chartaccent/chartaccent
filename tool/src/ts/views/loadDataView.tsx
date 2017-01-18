import * as React from "react";
import * as d3 from "d3";

import { Button } from "../controls/controls";
import { ColumnWidget } from "./inputWidgets";
import { MainStore } from "../store/store";
import * as Actions from "../store/actions";

export class LoadDataView extends React.Component<{
    store: MainStore
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
                                            new Actions.LoadData(name, data, "csv").dispatch();
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
                <p className="note">Your file will not be uploaded to our server.</p>
            </section>
        );
    }
}
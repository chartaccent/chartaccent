import * as React from "react";
import * as d3 from "d3";

import { Button } from "../controls/controls";
import { MainStore } from "../store/store";
import * as Actions from "../store/actions";

export class LoadDataView extends React.Component<{
    store: MainStore
}, {}> {
    refs: {
        [ name: string ]: Element;
        inputFile: HTMLInputElement;
        inputFileForm: HTMLFormElement;
        selectSample: HTMLSelectElement;
    }

    public render() {
        return (
            <section className="section-load-data">
                <h2>Choose Data File (CSV)</h2>
                <p>
                    <Button text="Choose File" onClick={() => {
                        this.refs.inputFileForm.reset();
                        this.refs.inputFile.onchange = () => {
                            if(this.refs.inputFile.files.length == 1) {
                                this.refs.selectSample.value = "load";

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
                    <select ref="selectSample" onChange={() => {
                        let samples = this.props.store.samples.filter((sample) => sample.name == this.refs.selectSample.value);
                        if(samples.length > 0) {
                            let sample = samples[0];
                            d3.text(sample.csv, "text/plain", (err, data) => {
                                if(!err) {
                                    new Actions.LoadData(sample.csv, data, "csv").dispatch();
                                }
                            });
                        }
                    }}>
                        <option value="load" selected disabled>load sample dataset...</option>
                        {
                            this.props.store.samples.map((sample) => (
                                <option value={sample.name}>{sample.name}</option>
                            ))
                        }
                    </select>
                    <form ref="inputFileForm">
                        <input ref="inputFile" className="invisible" type="file" accept=".csv" />
                    </form>
                </p>
                <p className="note">Your file will NOT be uploaded to our server.</p>
            </section>
        );
    }
}
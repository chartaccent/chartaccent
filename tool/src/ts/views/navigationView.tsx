import * as React from "react";

import { Button } from "../controls/controls";

import * as Actions from "../store/actions";
import { MainStore } from "../store/store";

export class NavigationView extends React.Component<{
    store: MainStore;
}, {}> {
    refs: {
        inputFile: HTMLInputElement;
        inputFileForm: HTMLFormElement;
    }

    public onOpenFile() {
        this.refs.inputFileForm.reset();
        this.refs.inputFile.onchange = () => {
            if(this.refs.inputFile.files.length == 1) {
                let file = this.refs.inputFile.files[0];
                let fileName = file.name;
                let fileReader = new FileReader();
                fileReader.onload = () => {
                    let content = fileReader.result;
                    new Actions.LoadState(JSON.parse(content)).dispatch();
                };
                fileReader.readAsText(file, "utf-8");
            } else {
                // The user didn't choose anything
            }
        };
        this.refs.inputFile.click();
    }
    public render() {
        return (
            <div className="navigation-view">
                <a href="index.html" className="title">ChartAccent Home</a>
                {" "}
                <Button type="text" text="Open..." icon="load" onClick={() => this.onOpenFile()} />
                {" "}
                <Button type="text" text="Save" icon="save" onClick={() => {
                    if(this.props.store.chartReady) {
                        new Actions.SaveState().dispatch();
                    } else {
                        alert("Please create a chart before saving it.");
                    }
                }} />
                <form className="invisible" ref="inputFileForm"><input ref="inputFile" id="loadFile" type="file" /></form>
                <span className="pull-right"><Button type="text" text="Help..." onClick={() => new Actions.StartIntroduction().dispatch()} /></span>
            </div>
        );
    }
}
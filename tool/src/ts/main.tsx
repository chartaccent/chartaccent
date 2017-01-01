import * as React from "react";
import * as ReactDOM from "react-dom";
import { MainView } from "./views/mainView";
import * as d3 from "d3";

ReactDOM.render(<MainView />, document.getElementById("main-view-container"));

// We can add some test code here

import { globalStore } from "./store/store";
import * as Actions from "./store/actions";

let sample = globalStore.samples[0];
d3.text(sample.csv, "text/plain", (err, data) => {
    if(!err) {
        new Actions.LoadDataAction(sample.csv, data, "csv").dispatch();
    }
});
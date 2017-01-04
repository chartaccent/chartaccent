import * as React from "react";
import * as ReactDOM from "react-dom";
import { MainView } from "./views/mainView";
import { MainStore } from "./store/store";
import * as d3 from "d3";

export let globalStore = new MainStore();

ReactDOM.render(<MainView store={globalStore}/>, document.getElementById("main-view-container"));

// We can add some test code here
import * as Actions from "./store/actions";

// let sample = globalStore.samples[4];
// d3.text(sample.csv, "text/plain", (err, data) => {
//     if(!err) {
//         new Actions.LoadData(sample.csv, data, "csv").dispatch();
//     }
// });
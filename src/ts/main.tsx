import * as React from "react";
import * as ReactDOM from "react-dom";
import { MainView } from "./views/mainView";
import { MainStore } from "./store/store";
import * as d3 from "d3";
import * as Actions from "./store/actions";

export let globalStore = new MainStore();

ReactDOM.render(<MainView store={globalStore}/>, document.getElementById("main-view-container"));


// We can add some test code here

// Show the introduction at first use.
if("done" != localStorage.getItem("introduction")) {
    new Actions.StartIntroduction().dispatch();
    localStorage.setItem("introduction", "done");
}
import * as React from "react";
import * as ReactDOM from "react-dom";
import { MainView } from "./views/mainView";

ReactDOM.render(<MainView />, document.getElementById("main-view-container"));

// We can add some test code here

import { globalStore } from "./store/store";
import * as Actions from "./store/actions";

// new Actions.LoadDataAction("
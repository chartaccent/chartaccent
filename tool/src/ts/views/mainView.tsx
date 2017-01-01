import * as React from "react";
import { NavigationView } from "./navigationView";
import { ControlsTestView } from "./controlsTestView";
import { LoadDataView } from "./loadDataView";
import { ReviewDataView } from "./reviewDataView";
import { CreateChartView } from "./createChartView";

import { globalStore } from "../store/store";
import { EventSubscription } from "fbemitter";

export class MainView extends React.Component<{}, {}> {
    private _subscriptions: EventSubscription[] = [];

    public componentDidMount() {
        this._subscriptions.push(globalStore.addListener("chart-changed", () => this.onChartChanged()));
        // this._subscriptions.push(globalStore.addListener(""))
    }

    public componentWillUnmount() {
        for(let sub of this._subscriptions) {
            sub.remove();
        }
    }

    public render() {
        return (
            <div className="wrapper">
                <div className="menu-wrapper">
                    <NavigationView />
                </div>
                <div className="main-wrapper">
                    <LoadDataView />
                    <ReviewDataView />
                    <CreateChartView />
                </div>
            </div>
        );
    }
}
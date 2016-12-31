import * as React from "react";
import { NavigationView } from "./navigationView";
import { ControlsTestView } from "./controlsTestView";
import { LoadDataView } from "./loadDataView";
import { ReviewDataView } from "./reviewDataView";

export class MainView extends React.Component<{}, {}> {
    public render() {
        return (
            <div className="main-view">
                <NavigationView />
                <LoadDataView />
                <ReviewDataView />
                <ControlsTestView />
            </div>
        );
    }
}
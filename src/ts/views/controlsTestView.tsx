import * as React from "react";

import * as Controls from "../controls/controls";

export class ControlsTestView extends React.Component<{}, {}> {
    public render() {
        return (
            <div>
                <Controls.Button text="Hello World" onClick={() => alert("Click.")}/>
                <Controls.Button type="small" text="Hello World" />
                <Controls.Button type="text" text="Hello World" />
            </div>
        );
    }
}
import * as React from "react";

import { Chart } from "../model/model";
import { ChartView } from "../charts/chartView";
import * as Actions from "../store/actions";

export interface IAnnotationViewProps {
    chart: Chart;
}

export class AnnotationView extends React.Component<IAnnotationViewProps, {}> {
    public render() {
        return (
            <section>
                <h2>Annotate</h2>
                <div className="annotation-view" style={{ width: this.props.chart.width + "px", height: this.props.chart.height + "px" }}>
                    <ChartView chart={this.props.chart} />
                </div>
            </section>
        );
    }
}
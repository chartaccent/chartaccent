import * as React from "react";

import { Chart } from "../model/model";
import { ChartView } from "../charts/chartView";
import * as Actions from "../store/actions";

export interface IChartPreviewProps {
    chart: Chart;
}

export class ChartPreview extends React.Component<IChartPreviewProps, {}> {
    public onResizeStart(e0: React.MouseEvent<HTMLDivElement>) {
        let width0 = this.props.chart.width;
        let height0 = this.props.chart.height;
        let x0 = e0.clientX;
        let y0 = e0.clientY;
        let onMouseMove = (e: MouseEvent) => {
            let dx = e.clientX - x0;
            let dy = e.clientY - y0;
            new Actions.UpdateChartWidthHeight(this.props.chart, width0 + dx, height0 + dy).dispatch();
        }
        let onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        }
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }
    public render() {
        return (
            <div className="chart-preview" style={{ width: this.props.chart.width + "px", height: this.props.chart.height + "px" }}>
                <ChartView chart={this.props.chart} />
            </div>
        );
    }
}
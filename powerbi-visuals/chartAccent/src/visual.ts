// ChartAccent custom visual

module powerbi.extensibility.visual {
    export class VisualBase implements IVisual {
        protected view: any;
        protected host: IVisualHost;

        protected settings = {
            title: null,
            xAxis: {
                text: "",
                min: 0,      // min, max for Scatterplot
                max: null
            },
            yAxis: {
                text: "Measure",
                min: 0,
                max: null
            }
        };

        constructor(options: VisualConstructorOptions) {
            this.view = new ((window as any).ChartAccentComponent)(options.element);
            this.host = options.host;
        }

        public getTitle() {
            if (this.settings.title != null && this.settings.title != "") {
                return {
                    "text": this.settings.title,
                    "fontFamily": "Roboto",
                    "fontSize": 20,
                    "fontStyle": "regular",
                    "color": "#000000"
                };
            } else {
                return null;
            }
        }

        public getXLabel() {
            return {
                text: this.settings.xAxis.text,
                fontFamily: "Roboto",
                fontSize: 14,
                fontStyle: "regular",
                color: "#000000"
            };
        }
        public getYLabel() {
            return {
                text: this.settings.yAxis.text,
                fontFamily: "Roboto",
                fontSize: 14,
                fontStyle: "regular",
                color: "#000000"
            };
        }

        public getColors() {
            return [
                "#66c2a5",
                "#fc8d62",
                "#8da0cb",
                "#e78ac3",
                "#a6d854",
                "#ffd92f"
            ];
        }
        public getXScale() {
            return {
                type: "linear",
                min: this.settings.xAxis.min,
                max: this.settings.xAxis.max
            };
        }

        public getYScale() {
            return {
                type: "linear",
                min: this.settings.yAxis.min,
                max: this.settings.yAxis.max
            };
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case "xAxis": {
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            min: this.settings.xAxis.min,
                            max: this.settings.xAxis.max,
                            text: this.settings.xAxis.text
                        },
                        selector: null
                    });
                } break;
                case "yAxis": {
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            min: this.settings.yAxis.min,
                            max: this.settings.yAxis.max,
                            text: this.settings.yAxis.text
                        },
                        selector: null
                    });
                } break;
                case "annotations": {
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            data: JSON.stringify(this.view.saveAnnotations())
                        },
                        selector: null
                    });
                } break;
            };

            return objectEnumeration;
        }

        public chartUpdate(options: VisualUpdateOptions) {
        }

        public update(options: VisualUpdateOptions) {
            try {
                if (!options.dataViews || !options.dataViews[0]) {
                    this.view.update({ chart: null });
                    return;
                }
                let objects = options.dataViews[0].metadata.objects;
                let annotations = null;
                if (objects) {
                    if (objects["title"]) {
                        this.settings.title = objects["title"]["titleText"] as string;
                    }
                    if (objects["xAxis"]) {
                        this.settings.xAxis.min = objects["xAxis"]["min"] as number;
                        this.settings.xAxis.max = objects["xAxis"]["max"] as number;
                        this.settings.xAxis.text = objects["xAxis"]["text"] as string;
                    }
                    if (objects["yAxis"]) {
                        this.settings.yAxis.min = objects["yAxis"]["min"] as number;
                        this.settings.yAxis.max = objects["yAxis"]["max"] as number;
                        this.settings.yAxis.text = objects["yAxis"]["text"] as string;
                    }
                    if (objects["annotations"]) {
                        let data = objects["annotations"]["data"] as string;
                        console.log("Load: ", data);
                        try {
                            if (data != null) {
                                annotations = JSON.parse(data);
                            }
                        } catch (e) {
                            console.log(e, e.stack);
                        }
                    }
                }
                this.chartUpdate(options);
                if (annotations != null) {
                    this.view.loadAnnotations(annotations);
                }
            } catch (e) {
                this.view.update({
                    chart: null,
                    error: e.message + "\n" + e.stack
                });
            }
        }
    }

    export class VisualBarChart extends VisualBase {
        constructor(options: VisualConstructorOptions) {
            super(options);
        }

        public chartUpdate(options: VisualUpdateOptions) {
            let r = makeDatasetBarLineChart(options);
            if (!r) {
                this.view.update({ chart: null });
                return;
            }
            let [dataset, xColumn, yColumns] = r;
            let mode = "editing";
            let [width, height] = getSizeEditingMode(options.viewport.width, options.viewport.height);

            let chart = {
                dataset: dataset,
                type: "bar-chart",
                title: this.getTitle(),
                width: width,
                height: height,
                xColumn: xColumn,
                yColumns: yColumns,
                xLabel: this.getXLabel(),
                yLabel: this.getYLabel(),
                xScale: { type: "categorical" },
                yScale: this.getYScale(),
                legendLabel: null,
                colors: this.getColors()
            };
            this.view.update({ chart: chart, mode: mode });
        }
    }

    export class VisualLineChart extends VisualBase {
        constructor(options: VisualConstructorOptions) {
            super(options);
        }

        public chartUpdate(options: VisualUpdateOptions) {
            let r = makeDatasetBarLineChart(options);
            if (!r) {
                this.view.update({ chart: null });
                return;
            }
            let [dataset, xColumn, yColumns] = r;
            let mode = "editing";
            let [width, height] = getSizeEditingMode(options.viewport.width, options.viewport.height);

            let chart = {
                dataset: dataset,
                type: "line-chart",
                title: this.getTitle(),
                width: width,
                height: height,
                xColumn: xColumn,
                yColumns: yColumns,
                xLabel: this.getXLabel(),
                yLabel: this.getYLabel(),
                xScale: { type: "categorical" },
                yScale: this.getYScale(),
                legendLabel: null,
                colors: this.getColors()
            };
            this.view.update({ chart: chart, mode: mode });
        }
    }

    export class VisualScatterplot extends VisualBase {
        constructor(options: VisualConstructorOptions) {
            super(options);
            this.settings.xAxis.min = null;
            this.settings.yAxis.min = null;
        }

        public chartUpdate(options: VisualUpdateOptions) {
            let r = makeDatasetScatterplot(options);
            if (!r) {
                this.view.update({ chart: null });
                return;
            }
            let [dataset, nameColumn, xColumn, yColumn, groupColumn, sizeColumn] = r;
            let mode = "editing";
            let [width, height] = getSizeEditingMode(options.viewport.width, options.viewport.height);

            let chart = {
                dataset: dataset,
                type: "scatterplot",
                title: null,
                width: width,
                height: height,
                xColumn: xColumn,
                yColumn: yColumn,
                nameColumn: nameColumn,
                sizeColumn: sizeColumn,
                groupColumn: groupColumn,
                xLabel: this.getXLabel(),
                yLabel: this.getYLabel(),
                xScale: this.getXScale(),
                yScale: this.getYScale(),
                legendLabel: null,
                colors: this.getColors()
            };
            this.view.update({ chart: chart, mode: mode });
        }
    }
}
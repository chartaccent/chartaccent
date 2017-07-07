module powerbi.extensibility.visual {
    export function makeLabel(text: string, fontSize: number = 14) {
        return {
            text: text,
            fontFamily: "Arial",
            fontSize: fontSize,
            fontStyle: "regular",
            color: "#000000"
        }
    }

    export function makeColumn(name: string, type: string, format?: string) {
        return {
            name: name,
            type: type,
            format: format
        }
    }

    export function makeDatasetBarLineChart(options: powerbi.extensibility.visual.VisualUpdateOptions) {
        if (!options.dataViews
            || !options.dataViews[0]
            || !options.dataViews[0].categorical
            || !options.dataViews[0].categorical.categories
            || !options.dataViews[0].categorical.categories[0]) {
            return;
        }
        let dv = options.dataViews[0];
        let category = dv.categorical.categories[0];
        let values = dv.categorical.values;
        if (!values || values.length == 0) return;
        let valueNames = values.map(d => d.source.displayName);

        let dataset = {
            fileName: "dataset.csv",
            rawFile: "dataset.csv",
            type: "csv",
            columns: [makeColumn(category.source.displayName, "string")].concat(valueNames.map(v => makeColumn(v, "number", ".1f"))),
            rows: category.values.map((d, i) => {
                let obj: any = {};
                obj[category.source.displayName] = d.valueOf();
                for (let v of values) {
                    obj[v.source.displayName] = v.values[i].valueOf() as number;
                }
                return obj;
            })
        };
        return [dataset, category.source.displayName, valueNames];
    }

    export function makeDatasetScatterplot(options: powerbi.extensibility.visual.VisualUpdateOptions) {
        if (!options.dataViews
            || !options.dataViews[0]
            || !options.dataViews[0].categorical
            || !options.dataViews[0].categorical.categories
            || !options.dataViews[0].categorical.categories[0]) {
            return;
        }
        let dv = options.dataViews[0];
        let category = dv.categorical.categories[0];
        let values = dv.categorical.values;
        if (!values) return;

        let xColumn = null;
        let yColumn = null;
        let nameColumn = category.source.displayName;
        let groupColumn = null;
        let sizeColumn = null;
        for (let v of values) {
            if (v.source.roles["measureX"]) xColumn = v.source.displayName;
            if (v.source.roles["measureY"]) yColumn = v.source.displayName;
            if (v.source.roles["measureColor"]) groupColumn = v.source.displayName;
            if (v.source.roles["measureSize"]) sizeColumn = v.source.displayName;
        }

        if (!xColumn || !yColumn) return;

        let dataset = {
            fileName: "dataset.csv",
            rawFile: "dataset.csv",
            type: "csv",
            columns: [makeColumn(category.source.displayName, "string")].concat(values.map(v => makeColumn(v.source.displayName, v.source.index == 2 ? "string" : "number", ".1f"))),
            rows: category.values.map((d, i) => {
                let obj: any = {};
                obj[category.source.displayName] = d.valueOf();
                for (let v of values) {
                    if (v) {
                        obj[v.source.displayName] = v.values[i].valueOf() as number;
                    }
                }
                return obj;
            })
        };
        return [dataset, nameColumn, xColumn, yColumn, groupColumn, sizeColumn];
    }

    export function getSizeViewingMode(width: number, height: number) {
        return [width, height];
    }
    export function getSizeEditingMode(width: number, height: number) {
        return [width - 400, height - 100];
    }
}
import { ColumnType, RowType, Column, Row, Dataset } from "../model/model";
import { isDistinctValues, getUniqueValues } from "../utils/utils";
import * as d3 from "d3";

// Infer column type.
// Adapted from datalib: https://github.com/vega/datalib/blob/master/src/import/type.js

let TESTS: { [ name: string ]: (x: string) => boolean } = {
    boolean: (x: string) => x.toLowerCase() === "true" || x.toLowerCase() === "false",
    integer: (x: string) => TESTS["number"](x) && (+x.replace(/\,/g, "")) === ~~(+x.replace(/\,/g, "")),
    number: (x: string) => !isNaN(+x.replace(/\,/g, "")),
    date: (x: string) => !isNaN(Date.parse(x)),
};

let CONVERTERS: { [ name: string ]: (x: string) => RowType } = {
    boolean: (x: string) => x.toLowerCase() === "true" ? true : false,
    integer: (x: string) => +x.replace(/\,/g, ""),
    number: (x: string) => +x.replace(/\,/g, ""),
    date: (x: string) => Date.parse(x),
    string: (x: string) => x
};

export function inferColumnType(values: string[]): ColumnType {
    // console.log(values);
    let candidates: ColumnType[] = [ "boolean", "integer", "number", "date" ];
    for(let i = 0; i < values.length; i++) {
        let v = values[i];
        // skip empty values
        if(v == null) continue;
        v = v.trim();
        if(v == "") continue;
        // test for remaining candidates
        for(let j = 0; j < candidates.length; j++) {
            if(!TESTS[candidates[j]](v)) {
                // console.log(candidates[j], "fail at", v);
                candidates.splice(j, 1);
                j -= 1;
            }
        }
        // if no types left, return "string"
        if(candidates.length == 0) return "string";
    }
    return candidates[0];
}

export function convertColumnType(value: string, type: ColumnType): RowType {
    if(value == null) return null;
    return CONVERTERS[type](value);
}

export function parseDataset(fileName: string, content: string, type: "csv" | "tsv"): Dataset {
    let rows: string[][];
    switch(type) {
        case "csv": {
            rows = d3.csv.parseRows(content);

        } break;
        case "tsv": {
            rows = d3.tsv.parseRows(content);
        } break;
        default: {
            rows = [[]];
        } break;
    }

    // Remove empty rows if any
    rows = rows.filter((row) => row.length > 0);

    if(rows.length > 0) {
        let header = rows[0];

        let columns = header.map((name, index) => {
            // Infer column type
            let values = rows.slice(1).map((row) => row[index]);
            let type = inferColumnType(values);
            let format = undefined;
            if(type == "integer") format = ".0f";
            if(type == "number") {
                let valuesFixed = values.map(d => +d).filter(d => !isNaN(d)).map(d => d.toFixed(10));
                valuesFixed = valuesFixed.map(d => {
                    let m = d.match(/\.([0-9]{10})$/);
                    if(m) return m[1];
                    else return "0000000000";
                });
                let k: number;
                for(k = 10 - 1; k >= 0; k--) {
                    if(valuesFixed.every(v => v[k] == "0")) {
                        continue;
                    } else {
                        break;
                    }
                }
                format = `.${k + 1}f`;
            }
            if(type == "date") format = "%Y/%m/%d-%H:%M:%S";
            return {
                name: name,
                type: type,
                format: format
            } as Column;
        });
        let outRows = rows.slice(1).map((row) => {
            let out: Row = {};
            columns.forEach((column, index) => {
                out[column.name] = convertColumnType(row[index], column.type) || null;
            });
            return out;
        });
        let dataset = {
            columns: columns,
            rawFile: content,
            fileName: fileName,
            rows: outRows,
            type: type
        } as Dataset;
        return dataset;
    } else {
    }
}

export function getColumnsSummary(dataset: Dataset) {
    return dataset.columns.map((column) => {
        let values = dataset.rows.filter(row => row[column.name] != null).map(row => row[column.name].toString());
        let uniqueValues = getUniqueValues(values);
        return {
            name: column.name,
            type: column.type,
            format: column.format,
            values: values,
            uniqueValues: uniqueValues,
            isDistinctValues: isDistinctValues(values)
        }
    });
}

export function getColumnsForDistinctAxis(dataset: Dataset, maxUniqueValues: number = 1e10) {
    let summary = getColumnsSummary(dataset);
    let candidates = summary.filter(c => c.isDistinctValues && c.type == "string" && c.uniqueValues.length <= maxUniqueValues);
    return candidates.map(c => c.name);
}

export function getColumnsForContinuousAxis(dataset: Dataset) {
    let candidates = dataset.columns.filter(d => d.type == "integer" || d.type == "number");
    return candidates.map(c => c.name);
}
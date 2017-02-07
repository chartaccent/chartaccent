export type FileType = "csv" | "tsv";
export type ColumnType = "boolean" | "integer" | "number" | "date" | "string";
export type RowType = boolean | string | number | Date;

export interface Column {
    name: string;
    type: ColumnType;
    format?: string;
}

export interface Row {
    [ name: string ]: RowType;
}

export interface Dataset {
    fileName: string;
    sampleFileName?: string;
    rawFile: string;
    type: FileType;
    columns: Column[];
    rows: Row[];
}
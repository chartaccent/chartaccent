import * as d3 from "d3";

declare module ChartAccent {
    export let version: string;

    export function Create(info: {
        layer_background: d3.Selection<SVGGElement>;
        layer_annotation: d3.Selection<SVGGElement>
        panel: d3.Selection<HTMLDivElement>
        toolbar: d3.Selection<HTMLDivElement>
    }): ChartAccent;

    export function setRootContainer(e: Element): void;

    export interface SavedAnnotations {
    }

    export class ChartAccent {
        public AddChart(info: {
            event_tracker: (action: string, label: string) => void;
            bounds: {
                x: number; y: number;
                width: number; height: number;
                origin_x: number; origin_y: number;
            };
            default_lasso_label?: "per-item";
            default_lasso_label_expression: string;
            cartesian_scales: {
                x: any;
                y: any;
            };
            selection_mode: "marquee" | "lasso";
            tables: { name: string, data: any[], isDefault: boolean }[];
            palette: string[];
        }): ChartRepresentation;

        public saveAnnotations(): SavedAnnotations;
        public loadAnnotations(annotations: SavedAnnotations, logEvent?: boolean): void;

        public getSVGDataBlob(): Blob;
        public getImageDataBlob(mineType: string, scaleFactor: number, callback: (blob: Blob) => void): void;
        public getAnimatedGIFImages(callback: (blob: Blob) => void): void;
        public summarizeState(): string;
    }

    export class ChartRepresentation {
        public addAxis(info: {
            axis: "x" | "y";
            name: string;
            origin_x?: number;
            origin_y?: number;
            default_format?: string;
        }): void;

        public addSeriesFromD3Selection(info: {
            name: string,
            selection: d3.Selection<any>;
            path?: d3.Selection<any>;
            bubbleset?: "default-on";
            default_label: string;
            getAxisValue: (d: any, axis: "x" | "y") => any;
            getValue: (d: any) => any;
            itemToString: (d: any) => string;
            visibility: (f: (d: any) => boolean) => void;
        }): void;

        public addLegend(info: {
            items: { name: string, items: { series: string, items: any[] }[], selection: d3.Selection<any>; }[];
            default_label_mode: "item-label" | "label";
            default_label?: string;
            bubbleset?: "default-on";
        }): void;
    }
}

export = ChartAccent;
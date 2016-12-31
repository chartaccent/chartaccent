import { globalStore } from "./store";

export class Action {
    public dispatch() {
        globalStore.handleAction(this);
    }
};

export class LoadDataAction extends Action {
    constructor(
        public fileName: string,
        public raw: string,
        public fileType: "csv" | "tsv"
    ) {
        super();
    }
}
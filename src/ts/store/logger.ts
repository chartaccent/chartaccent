import { AzureStorageLoggingService } from "../logging/logging";
import { AppState } from "../model/model";

let service = new AzureStorageLoggingService();
service.startSession();

export interface ExportLogData {
    timeCreated: number;
    clientID: string;
    sessionID: string;
    state: AppState;
    imageType: string;
    imageDataURL: string;
    emailAddress: string;
    history?: [ number, string, string, any ][];
}

export class AppLogger {
    protected _privateActions: [ number, string, string, any ][];

    constructor() {
        this._privateActions = [];
    }
    public getClientID() {
        return service.clientID;
    }
    public getSessionID() {
        return service.sessionID;
    }

    public logAction(action: string, label: string, privateData: any = null) {
        let timestamp = new Date().getTime();

        service.logAction(timestamp, action, label);

        console.log("Action", action, label);

        this._privateActions.push([ timestamp, action, label, privateData ]);
    }

    public logExport(data: ExportLogData) {
        data.history = this._privateActions;
        service.logExport(JSON.stringify(data));
    }
}

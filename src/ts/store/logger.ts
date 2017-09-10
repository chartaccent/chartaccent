import { AzureStorageLoggingService } from "../logging/logging";
import { AppState } from "../model/model";



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
    protected service = new AzureStorageLoggingService();

    constructor() {
        this.service.startSession();
        this._privateActions = [];
    }
    public getClientID() {
        return this.service.clientID;
    }
    public getSessionID() {
        return this.service.sessionID;
    }

    public logAction(action: string, label: string, privateData: any = null) {
        let timestamp = new Date().getTime();

        this.service.logAction(timestamp, action, label);

        console.log("Action", action, label);

        this._privateActions.push([ timestamp, action, label, privateData ]);
    }

    public logExport(data: ExportLogData, callback: (error: string) => void) {
        data.history = this._privateActions;
        this.service.logExport(JSON.stringify(data), callback);
    }
}

export function generateSessionID(): string {
    let s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

export abstract class LoggingService {
    public abstract get sessionID(): string;
    public abstract startSession(): void;
    public abstract logAction(type: string, code: string): void;
    public abstract logExport(stateJSON: string, imageDataURL: string): void;
}

export class NullLoggingService extends LoggingService {
    private _sessionID: string;

    public get sessionID(): string {
        return this._sessionID;
    }
    public startSession(): void {
        this._sessionID = generateSessionID();
        console.log("NL.StartSession", this.sessionID);
    }
    public logAction(type: string, code: string): void {
        console.log("NL.Action", type, code);

    }
    public logExport(stateJSON: string, imageDataURL: string): void {
        console.log("NL.Export", stateJSON, imageDataURL);
    }
}

import { putSession, putExport } from "./azureBlobStorage";

export class AzureStorageLoggingService extends LoggingService {
    private _sessionID: string;

    private _sessionData: {
        sessionID: string;
        timeCreated: number;
        userAgent: string;
        actions: [ string, string ][];
    };

    constructor() {
        super();
        this._sessionData = null;
    }

    public get sessionID(): string {
        return this._sessionID;
    }
    public startSession(): void {
        this._sessionID = "6c3a327b-a001-0441-5631-15e90d5cccfa";
        // this._sessionID = generateSessionID();
        this._sessionData = {
            sessionID: this._sessionID,
            timeCreated: new Date().getTime(),
            userAgent: navigator.userAgent,
            actions: []
        };
        putSession(this.sessionID, JSON.stringify(this._sessionData), (err) => {
        });
    }

    public logAction(type: string, code: string): void {
        this._sessionData.actions.push([ type, code ]);
        putSession(this.sessionID, JSON.stringify(this._sessionData), (err) => {
        });
    }

    public logExport(data: string): void {
        putExport(this.sessionID, data, (err) => {
        });
    }
}
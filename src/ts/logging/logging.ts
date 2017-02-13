import { appVersion } from "../version";

export function guid(): string {
    let s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

export function generateSessionID(): string {
    return guid();
}

export function getClientID(): string {
    let id = window.localStorage.getItem("chartaccnet-clientid");
    if(id == null) {
        id = guid();
        window.localStorage.setItem("chartaccnet-clientid", id);
    }
    return id;
}

export abstract class LoggingService {
    public abstract get clientID(): string;
    public abstract get sessionID(): string;
    public abstract startSession(): void;
    public abstract logAction(timestamp: number, type: string, code: string): void;
    public abstract logExport(data: string, callback: (error: string) => void): void;
}

export class NullLoggingService extends LoggingService {
    private _sessionID: string;
    private _clientID: string;

    public get clientID(): string {
        return this._clientID;
    }
    public get sessionID(): string {
        return this._sessionID;
    }
    public startSession(): void {
        this._sessionID = generateSessionID();
        this._clientID = getClientID();
        console.log("NL.StartSession", this.sessionID);
    }
    public logAction(timestamp: number, type: string, code: string): void {
        console.log("NL.Action", type, code);

    }
    public logExport(data: string, callback: (error: string) => void): void {
        console.log("NL.Export", data);
        callback(null);
    }
}

import { putSession, putExport } from "./azureBlobStorage";

export class AzureStorageLoggingService extends LoggingService {
    private _sessionID: string;
    private _clientID: string;

    private _sendSessionTimer: NodeJS.Timer;

    private _sessionData: {
        appVersion: string;
        clientID: string;
        sessionID: string;
        timeCreated: number;
        userAgent: string;
        windowDimensions: {
            innerSize: [ number, number ];
            outerSize: [ number, number ];
        }
        actions: [ number, string, string ][];
    };

    private _sessionDataToSend: string;

    constructor() {
        super();
        this._clientID = getClientID();
        this._sessionData = null;
        this._sessionDataToSend = null;
        this._sendSessionTimer = null;

        window.addEventListener("beforeunload", () => {
            if(this._sessionData) {
                this.doSendSession();
            }
        });
    }

    public get clientID(): string {
        return this._clientID;
    }

    public get sessionID(): string {
        return this._sessionID;
    }

    public startSession(): void {
        this._sessionID = generateSessionID();
        this._sessionData = {
            appVersion: appVersion,
            clientID: this._clientID,
            sessionID: this._sessionID,
            timeCreated: new Date().getTime(),
            userAgent: navigator.userAgent,
            windowDimensions: {
                innerSize: [ window.innerWidth, window.innerHeight ],
                outerSize: [ window.outerWidth, window.outerHeight ]
            },
            actions: []
        };
        this.doSendSession();
        ga("send", "event", "session", "clientID", this._clientID);
        ga("send", "event", "session", "startSession", this._sessionID);
    }

    public scheduleSendSession() {
        this._sessionDataToSend = JSON.stringify(this._sessionData);

        if(this._sendSessionTimer != null) {
            clearTimeout(this._sendSessionTimer);
            this._sendSessionTimer = null;
        }

        this._sendSessionTimer = setTimeout(() => {
            this._sendSessionTimer = null;
            putSession(this.sessionID, this._sessionDataToSend, (err) => {
                if(err != null) {
                    console.log("Error in putSession: " + err);
                    // Reschedule logging
                    this.scheduleSendSession();
                }
            });
        }, 1000);
    }

    public doSendSession() {
        putSession(this.sessionID, JSON.stringify(this._sessionData), (err) => {
            if(err != null) {
                console.log("Error in putSession: " + err);
                // Reschedule logging
                this.scheduleSendSession();
            }
        });
    }

    public logAction(timestamp: number, type: string, code: string): void {
        this._sessionData.actions.push([ timestamp, type, code ]);
        this.scheduleSendSession();
        let category = type.split("/")[0];
        let action = type.split("/")[1] || "default";
        ga("send", "event", category, action, code);
        console.log("GoogleAnalytics", category, action, code);
    }

    public logExport(data: string, callback: (error: string) => void): void {
        putExport(this.sessionID, data, (err) => {
            if(err) {
                console.log("Error in putExport: " + err);
                callback(err);
            } else {
                callback(null);
            }
        });
    }
}
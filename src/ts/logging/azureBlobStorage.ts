let sha1 = require("sha1");

let sasURLParameters = "sv=2015-12-11&ss=b&srt=o&sp=wc&se=2021-02-06T06:36:05Z&st=2017-02-05T22:36:05Z&spr=https,http&sig=jk%2FWF4kTSXDtHUCYo12t8JYfOY3zsnXks%2BxOUIUArGc%3D";

function encodeJSON(obj: any): string {
    return JSON.stringify(obj);
}

function hashJSONString(json: string): string {
    return sha1(json);
}

function getSessionBlobURL(sessionID: string) {
    return `https://chartaccentdev.blob.core.windows.net/sessions/${sessionID}.json?${sasURLParameters}`;
}

function getExportBlobURL(sessionID: string, blobHash: string) {
    return `https://chartaccentdev.blob.core.windows.net/exports/${sessionID}.${blobHash}.json?${sasURLParameters}`;
}

function putBlob(blobURL: string, data: string, callback: (err: string) => void) {
    var ajaxRequest = new XMLHttpRequest();
    ajaxRequest.onload = () => {
        callback(null);
    }
    ajaxRequest.onerror = () => {
        callback("ERROR");
    }
    ajaxRequest.open('PUT', blobURL, true);
    ajaxRequest.setRequestHeader('x-ms-blob-type', 'BlockBlob');
    ajaxRequest.setRequestHeader('x-ms-blob-content-type', 'text/plain; charset=utf-8');
    ajaxRequest.setRequestHeader('content-type', "text/plain; charset=utf-8");
    ajaxRequest.send(data);
}

export function putSession(sessionID: string, data: string, callback: (err: string) => void) {
    putBlob(getSessionBlobURL(sessionID), data, callback);
}

export function putExport(sessionID: string, data: string, callback: (err: string) => void) {
    putBlob(getExportBlobURL(sessionID, hashJSONString(data)), data, callback);
}
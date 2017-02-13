let sha1 = require("sha1");

let isDevelopmentMode = true;

if(document.location.hostname == "localhost") {
    isDevelopmentMode = true;
}

// Determine the SAS url parameters.
let blobStorageURL = "chartaccentdev.blob.core.windows.net";
let sasURLParameters = "sv=2015-12-11&ss=b&srt=o&sp=wc&se=2021-02-06T06:36:05Z&st=2017-02-05T22:36:05Z&spr=https,http&sig=jk%2FWF4kTSXDtHUCYo12t8JYfOY3zsnXks%2BxOUIUArGc%3D";

function encodeJSON(obj: any): string {
    return JSON.stringify(obj);
}

function hashJSONString(json: string): string {
    return sha1(json);
}

function getBlobURL(container: string, blobName: string) {
    if(isDevelopmentMode) container = "dev-" + container;
    return `https://${blobStorageURL}/${container}/${blobName}?${sasURLParameters}`;
}

function getSessionBlobURL(sessionID: string) {
    return getBlobURL(`sessions`, `${sessionID}.json`);
}

function getExportBlobURL(sessionID: string, blobHash: string) {
    return getBlobURL(`exports`, `${sessionID}.${blobHash}.json`);
}

function putBlob(blobURL: string, data: string, callback?: (err: string) => void) {
    let ajaxRequest = new XMLHttpRequest();
    let didCallback = false;
    ajaxRequest.onreadystatechange = () => {
        if(ajaxRequest.readyState == XMLHttpRequest.DONE) {
            if(ajaxRequest.status == 200 || ajaxRequest.status == 201) {
                if(!didCallback) {
                    didCallback = true;
                    if(callback) callback(null);
                }
            } else {
                if(!didCallback) {
                    didCallback = true;
                    if(callback) callback("could not put blob: " + ajaxRequest.status + " " + ajaxRequest.statusText);
                }
            }
        }
    }
    ajaxRequest.onerror = () => {
        if(!didCallback) {
            didCallback = true;
            if(callback) callback("could not put blob: " + ajaxRequest.statusText);
        }
    }
    ajaxRequest.timeout = 20 * 1000;
    ajaxRequest.open('PUT', blobURL, true);
    ajaxRequest.setRequestHeader('x-ms-blob-type', 'BlockBlob');
    ajaxRequest.setRequestHeader('x-ms-blob-content-type', 'text/plain; charset=utf-8');
    ajaxRequest.setRequestHeader('content-type', "text/plain; charset=utf-8");
    ajaxRequest.send(data);

    console.log("Put Blob", blobURL, JSON.parse(data));
}

export function putSession(sessionID: string, data: string, callback: (err: string) => void) {
    putBlob(getSessionBlobURL(sessionID), data, callback);
}

export function putExport(sessionID: string, data: string, callback: (err: string) => void) {
    putBlob(getExportBlobURL(sessionID, hashJSONString(data)), data, callback);
}
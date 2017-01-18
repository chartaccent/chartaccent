declare function saveAs(file: File, fileName?: string): void;
declare function saveAs(blob: Blob, fileName?: string): void;

declare interface IntroJSInstance {
    start: () => void;
    oncomplete: (handler: () => void) => void;
    onexit: (handler: () => void) => void;
}
declare function introJs(): IntroJSInstance;
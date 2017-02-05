export class ActionLogger {
    protected _lastAction: string;
    protected _lastLabel: string;
    protected _actions: [ string, string ][];
    protected _sendActionsTimer: number;

    constructor() {
        this._lastAction = null;
        this._lastLabel = null;
        this._actions = [];
        this._sendActionsTimer = null;
    }

    protected sendAction(action: string, label: string) {
        // Send action to logging service here.
    }

    public log(action: string, label: string) {
        if(this._lastAction == action && this._lastLabel == label) {
            // De-duplicate state actions
            if(this._lastAction == "annotation/state") {
                return;
            }
        }
        this.sendAction(action, label);
        console.log("Action", action, label);
        this._lastAction = action;
        this._lastLabel = label;
    }
}

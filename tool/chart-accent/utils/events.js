// Make an object capable for accepting events.
// Binding behaviour is similar to d3.
// on("event.handler_name", handler)
// raise("event", arg1, arg2, ...)
var EventManager = function() {
    this.handlers = new WeakMap();
};

EventManager.prototype.on = function(obj, eventname, callback) {
    var split = eventname.split(".");
    if(!split[1]) split[1] = "";
    if(!this.handlers.has(obj)) {
        var handlers = { };
        this.handlers.set(obj, handlers);
    } else {
        var handlers = this.handlers.get(obj);
    }
    if(!handlers[split[0]]) {
        handlers[split[0]] = { };
    }
    if(callback === undefined) {
        return handlers[split[0]][split[1]];
    }
    if(callback === null) {
        delete handlers[split[0]][split[1]];
    } else {
        handlers[split[0]][split[1]] = callback;
    }
};

EventManager.prototype.raise = function(obj, event) {
    if(!this.handlers.has(obj)) return;
    var handlers = this.handlers.get(obj);
    for (var k in handlers[event]) {
        handlers[event][k].apply(obj, Array.prototype.slice.call(arguments, 2));
    }
};

Module.EventManager = EventManager;

var Events = new EventManager();
Module.Events = Events;

EventManager.Test = function(test) {
    var EM = new EventManager();
    var o = { };
    var k1 = null, k2 = null;
    var f1 = function(a, b, c) { k1 = a + b + c; };
    var f2 = function(a, b, c) { k2 = a + b - c; };
    EM.on(o, "test", f1);
    EM.on(o, "test.map", f2);
    EM.raise(o, "test", 1, 2, 3);
    test.ok(k1 == 6 && k2 == 0, "test1");
    test.ok(EM.on(o, "test") == f1, "test2");
    var k1 = null, k2 = null;
    EM.on(o, "test", null);
    EM.raise(o, "test", 1, 2, 3);
    test.ok(k1 === null && k2 == 0, "test3");
    test.done();
};

DependencyManager = function() {
    this.registry = new WeakMap();
};

DependencyManager.prototype._getRegistry = function(obj) {
    if(this.registry.has(obj)) return this.registry.get(obj);
    // As default, initially an object is not valid.
    var item = {
        v: false,        // Is valid.
        u: new Set(),    // Upstreams.
        d: new Set()     // Downstreams.
    };
    this.registry.set(obj, item);
    return item;
};
// Add a dependency.
DependencyManager.prototype.add = function(obj, upstream) {
    this._getRegistry(obj).u.add(upstream);
    this._getRegistry(upstream).d.add(obj);
};
// Remove a dependency.
DependencyManager.prototype.remove = function(obj, upstream) {
    this._getRegistry(obj).u.delete(upstream);
    this._getRegistry(upstream).d.delete(obj);
};
// // Remove an object.
// exclude: function(obj) {
//     if(!this.registry.has(obj)) return;
//     this._getRegistry(obj).u.forEach(item.d.delete, item.d);
//     this.registry.delete(obj);
// },
// Evaluate the value on obj.
DependencyManager.prototype.validate = function(obj) {
    var self = this;
    var reg = this._getRegistry(obj);
    if(reg.v) return;
    reg.u.forEach(function(upstream) {
        self.validate(upstream);
        var reg_upstream  = self._getRegistry(upstream);
        reg_upstream.d.add(obj);
    });
    if(obj.validate) obj.validate();
    reg.v = true;
};
// Invalidate the value on obj.
DependencyManager.prototype.invalidate = function(obj) {
    var self = this;
    var reg = this._getRegistry(obj);
    if(reg.v === true) {
        reg.v = false;
        reg.d.forEach(this.invalidate, this);
        reg.d.clear();
    }
};

var DM = new DependencyManager();

DependencyManager.Test = function(test) {
    var actionlist = [];
    var o1 = { validate: function() { actionlist.push("1"); } }
    var o2 = { validate: function() { actionlist.push("2"); } }
    var o3 = { validate: function() { actionlist.push("3"); } }
    var o4 = { validate: function() { actionlist.push("4"); } }
    DM.add(o1, o2);
    DM.add(o1, o3);
    DM.add(o2, o3);
    DM.add(o3, o4);
    DM.add(o2, o4);

    DM.validate(o1);
    test.ok(actionlist.join(",") == "4,3,2,1");

    actionlist = [];
    DM.invalidate(o3);
    DM.validate(o1);
    test.ok(actionlist.join(",") == "3,2,1");

    actionlist = [];
    DM.remove(o3, o4);
    DM.remove(o2, o4);
    DM.invalidate(o4);
    DM.validate(o1);
    test.ok(actionlist.join(",") == "");
    test.done();
};

Module.DependencyManager = DependencyManager;

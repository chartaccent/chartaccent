Expression.Context = function(properties, parent) {
    this.parent = parent;
    this.properties = properties;
};

Expression.Context.prototype.get = function(name) {
    if(this.properties[name] !== undefined) return this.properties[name];
    if(this.parent !== undefined) {
        var parent_value = this.parent.get(name);
        if(parent_value !== undefined) return parent_value;
    }
    if(Expression.Globals[name]) return Expression.Globals[name];
    return undefined;
};

Expression.Context.prototype.set = function(name, value) {
    this.properties[name] = value;
};


Expression.CreateContext = function(properties, parent) {
    return new Expression.Context(properties, parent);
}

Expression.CreateDataContext = function(dataitem, parent) {
    return new Expression.Context(dataitem, parent);
}

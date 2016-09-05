Expression.Variable = function(name) {
    this.name = name;
};
Expression.Variable.prototype.eval = function(context) {
    var v = context.get(this.name);
    if(v === undefined) throw new Error("'" + this.name + "' is undefined.");
    return v;
};
Expression.Variable.prototype.toString = function() {
    return this.name;
};
Expression.Variable.prototype.clone = function() {
    return new Expression.Variable(this.name);
};

Expression.Subscription = function(data, filter) {
    this.data = data;
    this.filter = filter;
};

Expression.Subscription.prototype.eval = function(context) {
    var data = this.data.eval(context);
    var filter = this.filter;
    var filtered = data.filter(function(d) {
        var dcontext = Expression.CreateDataContext(d, context);
        return filter.eval(dcontext);
    });
    return filtered;
};

Expression.Subscription.prototype.toString = function() {
    return this.data.toString() + "[" + this.filter.toString() + "]";
};

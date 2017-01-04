Expression.Functions = { };

Expression.Function = function(funcitem, args, kwargs) {
    this.funcitem = funcitem;
    this.args = args;
    this.kwargs = kwargs;
};

Expression.Function.prototype.eval = function(context) {
    var action = this.funcitem.eval(context);
    var args_eval = new Array(this.args.length);
    for(var i = 0; i < this.args.length; i++) {
        args_eval[i] = this.args[i].eval(context);
    }
    var kwargs_eval = { };
    for(var key in this.kwargs) {
        kwargs_eval[key] = this.kwargs[key].eval(context);
    }
    return action(args_eval, kwargs_eval);
};

Expression.Function.prototype.toString = function() {
    var args = this.args.map(function(arg) { return arg.toString(); }).join(", ");;
    for(var key in this.kwargs) {
        var s = key + " = " + this.kwargs[key].toString();
        if(args == "") args = s;
        else args += ", " + s;
    }
    return this.funcitem.toString() + "(" + args + ")";
};

Expression.Function.prototype.clone = function() {
    var args = this.args.map(function(d) { return d.clone(); });
    var kwargs = { };
    for(var k in this.kwargs) {
        kwargs[k] = this.kwargs[k].clone();
    }
    return new Expression.Function(this.funcitem.clone(), args, kwargs);
};

Expression.FunctionApply = function(funcitem, args, kwargs) {
    this.funcitem = funcitem;
    this.args = args;
    this.kwargs = kwargs;
};

Expression.FunctionApply.prototype.eval = function(context) {
    var variable_expression = this.args[0];
    if(this.args[1]) {
        var data = this.args[1].eval(context);
    } else {
        var data = context.get("data");
    }
    var args = data.map(function(d) {
        var new_context = Expression.CreateDataContext(d, context);
        return variable_expression.eval(new_context);
    });
    var kwargs_eval = { };
    for(var key in this.kwargs) {
        kwargs_eval[key] = this.kwargs[key].eval(context);
    }
    var action = this.funcitem.eval(context);
    return action(args, kwargs_eval);
};

Expression.FunctionApply.prototype.toString = function() {
    var args = this.args.map(function(arg) { return arg.toString(); }).join(", ");;
    for(var key in this.kwargs) {
        var s = key + " = " + this.kwargs[key].toString();
        if(args == "") args = s;
        else args += ", " + s;
    }
    return this.funcitem.toString() + "@(" + args + ")";
};

Expression.FunctionApply.prototype.clone = function() {
    var args = this.args.map(function(d) { return d.clone(); });
    var kwargs = { };
    for(var k in this.kwargs) {
        kwargs[k] = this.kwargs[k].clone();
    }
    return new Expression.FunctionApply(this.funcitem.clone(), args, kwargs);
};

Expression.Globals.sum = function(args) {
    var s = 0;
    for(var i = 0; i < args.length; i++) {
        s += +args[i];
    }
    return s;
};

Expression.Globals.count = function(args) {
    return args.length;
};

Expression.Globals.mean = function(args) {
    if(args.length == 0) return null;
    var s = 0;
    for(var i = 0; i < args.length; i++) {
        s += +args[i];
    }
    return s / args.length;
};

Expression.Globals.average = Expression.Globals.mean;
Expression.Globals.avg = Expression.Globals.mean;

Expression.Globals.median = function(args) {
    if(args.length == 0) return null;
    args.sort(function(a, b) { return a - b; });
    if(args.length % 2 == 0) {
        return (args[args.length / 2] + args[args.length / 2 - 1]) / 2;
    } else {
        return args[(args.length - 1) / 2];
    }
};

Expression.Globals.percentile = function(args, kwargs) {
    var p = kwargs.p !== undefined ? kwargs.p : 0.5;
    var arr = args.slice().sort(function(a, b) { return a - b; });
    if (p <= 0) return arr[0];
    if (p >= 1) return arr[arr.length - 1];

    var index = arr.length * p,
        lower = Math.floor(index),
        upper = lower + 1,
        weight = index % 1;

    if (upper >= arr.length) return arr[lower];
    return arr[lower] * (1 - weight) + arr[upper] * weight;
};

Expression.Globals.min = function(args) {
    if(args.length == 0) return null;
    var s = args[0];
    for(var i = 1; i < args.length; i++) {
        s = Math.min(s, +args[i]);
    }
    return s;
};

Expression.Globals.max = function(args) {
    if(args.length == 0) return null;
    var s = args[0];
    for(var i = 1; i < args.length; i++) {
        s = Math.max(s, +args[i]);
    }
    return s;
};

Expression.Globals.range = function(args, kwargs) {
    var min = null;
    var max = null;
    var order = null;
    if(args[0] !== null && args[0] !== undefined) min = args[0];
    if(args[1] !== null && args[1] !== undefined) max = args[1];
    if(args[2] !== null && args[2] !== undefined) order = args[2];
    if(kwargs["min"] !== null && kwargs["min"] !== undefined) min = kwargs["min"];
    if(kwargs["max"] !== null && kwargs["max"] !== undefined) max = kwargs["max"];
    if(kwargs["order"] !== null && kwargs["order"] !== undefined) order = kwargs["order"];
    if(order != null) {
        return [ min, max, order ];
    } else {
        return [ min, max ];
    }
};

var my_format = function(fmt) {
    if(fmt == "s") return function(s) { return s.toString(); };
    return d3.format(fmt);
};

Expression.Globals.format = function(args) {
    if(args.length == 0) return null;
    return my_format(args[0])(args[1]);
};

Expression.Globals.formatRange = function(args) {
    if(args.length == 0) return null;
    if(args[1][0] == args[1][1]) {
        return my_format(args[0])(args[1][0]);
    } else {
        return my_format(args[0])(args[1][0]) + " ~ " + my_format(args[0])(args[1][1]);
    }
};


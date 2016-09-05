// Probing functions.
Expression.isNumberValue = function(x) {
    return x instanceof Expression.Number;
};
Expression.isStringValue = function(x) {
    return x instanceof Expression.String;
};
Expression.isBooleanValue = function(x) {
    return x instanceof Expression.Boolean;
};
Expression.isValue = function(x) {
    return Expression.isNumberValue(x) ||
           Expression.isStringValue(x) ||
           Expression.isBooleanValue(x);
};

Expression.isStringExpression = function(x) {
    return x instanceof Expression.StringExpression;
};

Expression.isSimpleFunction = function(expr, funcname) {
    return expr instanceof Expression.Function && expr.funcitem instanceof Expression.Variable && expr.funcitem.name == funcname;
};
Expression.isSimpleFunctionApply = function(expr, funcname) {
    return expr instanceof Expression.FunctionApply && expr.funcitem instanceof Expression.Variable && expr.funcitem.name == funcname;
};

Expression.safeEval = function(expr, context) {
    try {
        return expr.eval(context);
    } catch(e) {
        return "#{Error: " + e.message + "}"
    }
};

Expression.safeEvalAsString = function(expr, context) {
    var r = Expression.safeEval(expr, context);
    // console.log(r, typeof(r));
    if(typeof(r) != "string") {
        // console.log(r, typeof(r));
        if(typeof(r) == "number") {
            r = StripExtraZeros(r);
        }
        return r.toString();
    } else {
        return r;
    }
};

Expression.createNumberRange = function(min, max) {
    return new Expression.Function(new Expression.Variable("range"), [ new Expression.Number(min), new Expression.Number(max) ]);
};

Expression.createStringRange = function(min, max, order) {
    if(order != null) {
        return new Expression.Function(new Expression.Variable("range"), [ new Expression.String(min), new Expression.String(max), new Expression.Object(order) ]);
    } else {
        return new Expression.Function(new Expression.Variable("range"), [ new Expression.String(min), new Expression.String(max) ]);
    }
};

Expression.createRegion = function(range) {
    return new Expression.Function(new Expression.Variable("Region"), [ new Expression.String(min), new Expression.String(max) ]);
};

Expression.toEasyString = function(expression) {
    var text, format;
    if(Expression.isStringValue(expression)) {
        text = expression.value;
    } else if(Expression.isStringExpression(expression)) {
        text = expression.exprs.map(function(d) {
            if(Expression.isStringValue(d)) return d.value;
            format = d;
            return "##";
        }).join("");
        if(!format) format = expression._saved_format_;
    } else {
        format = expression;
        text = "##";
    }
    return {
        text: text,
        format: format
    };

};

Expression.parseEasyString = function(str, format) {
    var txt = str.split("##");
    var exprs = [];
    for(var k = 0; k < txt.length; k++) {
        exprs.push(new Expression.String(txt[k]));
        if(k != txt.length - 1) {
            exprs.push(format);
        }
    }
    var r = new Expression.StringExpression(exprs);
    r._saved_format_ = format;
    return r;
}

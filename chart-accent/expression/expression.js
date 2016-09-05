var Expression = (function() {

var Expression = { };

Expression.Globals = { };

import "context.js";
import "subscription.js";
import "functions.js";
import "operators.js";
import "value.js";
import "variable.js";

(function() {
    import "parser.js";
}).call({ Expression: Expression });

Expression.StringExpression = function(exprs) {
    this.exprs = exprs;
};
Expression.StringExpression.prototype.eval = function(context) {
    return this.exprs.map(function(d) { return d.eval(context).toString(); }).join("");
};
Expression.StringExpression.prototype.toString = function(context) {
    return this.exprs.map(function(d) {
        if(d instanceof Expression.String) return d.value;
        return "{" + d.toString() + "}";
    }).join("");
};
Expression.StringExpression.prototype.clone = function() {
    return new Expression.StringExpression(this.exprs.map(function(d) { return d.clone(); }));
};

Expression.parse = function(expr) {
    return Expression.Parser.parse(expr);
    // parsed_expression.toString = function() { return expr; };
    // return parsed_expression;
};

Expression.parseStringExpression = function(expr) {
    return Expression.Parser.parse(expr, { startRule: "string_start" });
    // parsed_expression.toString = function() { return expr; };
    // return parsed_expression;
};

Expression.toStringExpression = function(expr) {
    if(expr instanceof Expression.StringExpression) {
        return expr.toString();
    } else {
        return "{" + expr.toString() + "}";
    }
};

import "utils.js";

import "test.js";

return Expression;

})();

Module.Expression = Expression;

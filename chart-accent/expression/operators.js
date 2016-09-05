Expression.Operators = { };

var CreateUnaryOperator = function(op, action) {
    var Operator = function(lh) {
        this.op = op;
        this.lh = lh;
    };
    Operator.prototype.eval = function(context) {
        return action(this.lh.eval(context));
    };
    Operator.prototype.toString = function() {
        return this.op + " " + this.lh.toString();
    };
    Operator.prototype.clone = function() {
        return new Operator(this.lh.clone());
    };
    return Operator;
};

var CreateBinaryOperator = function(op, action) {
    var Operator = function(lh, rh) {
        this.op = op;
        this.lh = lh;
        this.rh = rh;
    };
    Operator.prototype.eval = function(context) {
        return action(this.lh.eval(context), this.rh.eval(context));
    };
    Operator.prototype.toString = function() {
        return this.lh.toString() + " " + this.op + " " + this.rh.toString();
    };
    Operator.prototype.clone = function() {
        return new Operator(this.lh.clone(), this.rh.clone());
    };
    return Operator;
};

// Aritmetic operators, expect numeric types.
Expression.Operators["+"] = CreateBinaryOperator("+", function(a, b) { return (+a) + (+b); });
Expression.Operators["-"] = CreateBinaryOperator("-", function(a, b) { return (+a) - (+b); });
Expression.Operators["*"] = CreateBinaryOperator("*", function(a, b) { return (+a) * (+b); });
Expression.Operators["/"] = CreateBinaryOperator("/", function(a, b) { return (+a) / (+b); });
Expression.Operators["^"] = CreateBinaryOperator("^", function(a, b) { return Math.pow(+a, +b); });
Expression.Operators["unary:-"] = CreateUnaryOperator("unary:-", function(x) { return -x; });

// String operators.
Expression.Operators["&"] = CreateBinaryOperator("&", function(a, b) { return a.toString() + b.toString(); });

// Compare operators.
Expression.Operators[">"] = CreateBinaryOperator(">", function(a, b) { return a > b; });
Expression.Operators[">="] = CreateBinaryOperator(">=", function(a, b) { return a >= b; });
Expression.Operators["<"] = CreateBinaryOperator("<", function(a, b) { return a < b; });
Expression.Operators["<="] = CreateBinaryOperator("<=", function(a, b) { return a <= b; });
Expression.Operators["=="] = CreateBinaryOperator("==", function(a, b) { return a == b; });
Expression.Operators["!="] = CreateBinaryOperator("!=", function(a, b) { return a != b; });

// Boolean operators.
Expression.Operators["and"] = CreateBinaryOperator("and", function(a, b) { return a && b; });
Expression.Operators["or"] = CreateBinaryOperator("or", function(a, b) { return a || b; });
Expression.Operators["not"] = CreateUnaryOperator("not", function(a, b) { return !a; });

Expression.Operators["in"] = CreateBinaryOperator("in", function(a, b) {
    if(b instanceof Array) {
        var min = b[0];
        var max = b[1];
        var order = b[2];
        if(order) {
            return order.indexOf(a) >= order.indexOf(min) && order.indexOf(a) <= order.indexOf(max);
        } else {
            return a >= min && a <= max;
        }
    }
    return false;
});

var CreateOperator = function(op, lh, rh) {
    if(Expression.Operators[op]) {
        return new Expression.Operators[op](lh, rh);
    } else {
        throw new Error("Operator " + op + " not found.");
    }
}

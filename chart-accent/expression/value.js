function StripExtraZeros(number) {
    return number.toFixed(8).replace(/\.([0-9]*[1-9])0*$/, ".$1").replace(/\.0*$/, "")
}

// Number value.
Expression.Number = function(value) {
    this.value = value;
};
Expression.Number.prototype.eval = function(context) {
    return this.value;
};
Expression.Number.prototype.toString = function() {
    return StripExtraZeros(this.value);
};
Expression.Number.prototype.clone = function() {
    return new Expression.Number(this.value);
};

// String value.
Expression.String = function(value) {
    this.value = value;
};
Expression.String.prototype.eval = function(context) {
    return this.value;
};
Expression.String.prototype.toString = function() {
    return JSON.stringify(this.value);
};
Expression.String.prototype.clone = function() {
    return new Expression.String(this.value);
};

// Boolean value.
Expression.Boolean = function(value) {
    this.value = value;
};
Expression.Boolean.prototype.eval = function(context) {
    return this.value;
};
Expression.Boolean.prototype.toString = function() {
    return this.value ? "true" : "false"
};
Expression.Boolean.prototype.clone = function() {
    return new Expression.Boolean(this.value);
};

// Object value.
Expression.Object = function(value) {
    this.value = value;
};
Expression.Object.prototype.eval = function(context) {
    return this.value;
};
Expression.Object.prototype.toString = function() {
    return "[object]"
};
Expression.Object.prototype.clone = function() {
    return new Expression.Object(this.value);
};

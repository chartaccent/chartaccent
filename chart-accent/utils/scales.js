// Helper functions for d3.js scale.

var Scales = { };

Scales.getScaleRangeExtent = function(scale) {
    if(scale.rangeExtent) {
        return scale.rangeExtent();
    } else {
        return scale.range();
    }
};
Scales.getScaleInverseClamp = function(scale, position, pair_value) {
    var v = Scales.getScaleInverse(scale, position, pair_value);
    if(scale.rangeExtent) return v;
    var domain = scale.domain();
    var min = Math.min(domain[0], domain[1]);
    var max = Math.max(domain[0], domain[1]);
    if(v < min) v = min;
    if(v > max) v = max;
    return v;
};
Scales.getScaleInverseClampSnap = function(scale, position, pair_value) {
    var v = Scales.getScaleInverse(scale, position, pair_value);
    if(scale.rangeExtent) return v;
    var domain = scale.domain();
    var min = Math.min(domain[0], domain[1]);
    var max = Math.max(domain[0], domain[1]);
    if(v < min) v = min;
    if(v > max) v = max;
    var ticks = scale.ticks();
    var tick_diff = Math.abs(ticks[1] - ticks[0]);
    var dmin = null;
    var tickmin = null;
    for(var k = 0; k < ticks.length; k++) {
        var d = Math.abs(v - ticks[k]);
        if(dmin === null || d < dmin) {
            dmin = d;
            tickmin = ticks[k];
        }
    }
    if(dmin < tick_diff * 0.15) {
        v = tickmin;
    } else {
        var tick_range = Math.ceil(Math.log(Math.abs(ticks[ticks.length - 1] - ticks[0])) / Math.log(10));
        tick_range = Math.pow(10, tick_range);
        v = parseFloat((v / tick_range).toFixed(3)) * tick_range;
    }
    return v;
};
Scales.getNextValue = function(scale, value) {
    if(scale.rangeExtent) {
        if(isObject(value)) return value.min;
        var idx = scale.domain().indexOf(value);
        if(idx < 0) return null;
        return scale.domain()[idx + 1];
    } else {
        return value;
    }
};
Scales.getPreviousValue = function(scale, value) {
    if(scale.rangeExtent) {
        if(isObject(value)) return value.max;
        var idx = scale.domain().indexOf(value);
        if(idx < 0) return null;
        return scale.domain()[idx - 1];
    } else {
        return value;
    }
};
Scales.getScaleInverse = function(scale, position, pair_value) {
    if(scale.rangeExtent) {
        var band = scale.rangeBand();
        var range = scale.range().map(function(v) { return v + band / 2; });
        var spacing = range[1] - range[0];
        var min_d = null;
        var min_i = null;
        if(pair_value === undefined || typeof(pair_value) == "string") {
            for(var i = 0; i < range.length; i++) {
                var d = Math.abs(range[i] - position);
                if(min_d === null || d < min_d) {
                    min_d = d;
                    min_i = i;
                }
            }
        }
        // Extended range.
        var ext_range = [];
        ext_range.push(range[0] - spacing / 2);
        for(var i = 0; i < range.length - 1; i++) {
            ext_range.push((range[i] + range[i + 1]) / 2);
        }
        ext_range.push(range[range.length - 1] + spacing / 2);
        if(pair_value === undefined || typeof(pair_value) == "object") {
            for(var i = 0; i < ext_range.length; i++) {
                var d = Math.abs(ext_range[i] - position);
                if(min_d === null || d < min_d) {
                    min_d = d;
                    min_i = [ i - 1, i ];
                }
            }
        }
        if(min_i === null) return null;
        if(isArray(min_i)) {
            return {
                min: scale.domain()[min_i[0]],
                max: scale.domain()[min_i[1]],
                order: scale.domain(),
                toString: function() {
                    if(this.min && this.max) {
                        return "Between " + this.min + "," + this.max;
                    } else if(this.min) {
                        return "After " + this.min;
                    } else {
                        return "Before " + this.max;
                    }
                },
                toFixed: function() {
                    return this.toString();
                }
            };
        } else {
            return {
                value: scale.domain()[min_i],
                order: scale.domain(),
                toString: function() {
                    return this.value;
                },
                toFixed: function() {
                    return this.toString();
                }
            };
        }
    } else {
        return scale.invert(position);
    }
};

Scales.getScale = function(scale, value) {
    if(isObject(value)) {
        var range = scale.range();
        var spacing = range[1] - range[0];
        if(value.min) {
            return scale(value.min) + (spacing + scale.rangeBand()) / 2;
        } else if(value.max) {
            return scale(value.max) - (spacing - scale.rangeBand()) / 2;
        } else if(value.value) {
            return scale(value.value);
        }
        return [ v, v ];
    } else {
        return scale(value);
    }
};

Scales.compareScaledValue = function(scale, v1, v2) {
    if(scale.rangeExtent) {
        return scale.domain().indexOf(v1) - scale.domain().indexOf(v2);
    } else {
        return v1 - v2;
    }
}

Scales.getScaleValueRange = function(scale, value) {
    if(scale.rangeExtent) {
        var range = scale.range();
        var spacing = range[1] - range[0];
        var margin = (spacing - scale.rangeBand()) / 2 - 2;
        if(!isArray(value)) {
            if(isObject(value)) {
                var v = Scales.getScale(scale, value);
                if(!value.value) {
                    return [ v, v ];
                }
            } else {
                var v = scale(value);
            }
            return [ v - margin, v + scale.rangeBand() + margin ];
        } else {
            var v0 = Scales.getScale(scale, value[0]);
            var v1 = Scales.getScale(scale, value[1]);
            if(v1 >= v0) return [ v0 - margin, v1 + scale.rangeBand() + margin];
            else return [ v0 + scale.rangeBand() - margin, v1 + margin ];
        }
    } else {
        if(!isArray(value)) {
            var v = scale(value);
            return [ v, v ];
        } else {
            return [ scale(value[0]), scale(value[1]) ];
        }
    }
};

Scales.isScaleNumerical = function(scale) {
    return !scale.rangeExtent;
};

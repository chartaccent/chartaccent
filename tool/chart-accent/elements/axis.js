ChartElements.axis = function(owner, info) {
    this.name = info.name;
    this.owner = owner;
    if(info.default_label) {
        this.default_label = info.default_label;
    }
    if(info.default_range_label) {
        this.default_range_label = info.default_range_label;
    }
    if(info.default_format) {
        this.default_format = info.default_format;
    }
};

ChartElements.axis.prototype.setChart = function(chart) {
    this.chart = chart;
};

ChartElements.axis.prototype.setMode = function(value) {
    this.mode = value;
};

ChartElements.axis.prototype.setOrigin = function(value) {
    this.origin = value;
};

ChartElements.axis.prototype.getRangeOrder = function() {
    var scale = this.chart.cartesian_scales[this.mode];
    if(Scales.isScaleNumerical(scale)) return null;
    return scale.domain();
}

ChartElements.axis.prototype.getRangeRect = function(range) {
    if(this.mode == "x") {
        var px = Scales.getScaleValueRange(this.chart.cartesian_scales.x, range);
        var py = Scales.getScaleRangeExtent(this.chart.cartesian_scales.y);
    } else {
        var px = Scales.getScaleRangeExtent(this.chart.cartesian_scales.x);
        var py = Scales.getScaleValueRange(this.chart.cartesian_scales.y, range);
    }
    return {
        x1: px[0], y1: py[0],
        x2: px[1], y2: py[1]
    }
};

ChartElements.axis.prototype.getScale = function() {
    return this.chart.cartesian_scales[this.mode];
};

ChartElements.axis.prototype.select = function(p, always_select, pair_value) {
    var self = this;
    if(this.mode == "x") {
        var range = Scales.getScaleRangeExtent(this.chart.cartesian_scales.x);
        var p1 = new Geometry.Vector(range[0], this.origin);
        var p0 = new Geometry.Vector(range[range.length - 1], this.origin);
    }
    if(this.mode == "y") {
        var range = Scales.getScaleRangeExtent(this.chart.cartesian_scales.y);
        var p0 = new Geometry.Vector(this.origin, range[0]);
        var p1 = new Geometry.Vector(this.origin, range[range.length - 1]);
    }
    var d = Geometry.pointLineSegmentSignedDistance(p, p0, p1);
    var value = null;
    if(d >= 0 && d <= 40 || always_select) {
        d = 0;
        if(this.mode == "x") {
            var value = Scales.getScaleInverseClampSnap(this.chart.cartesian_scales.x, p.x, pair_value);
        }
        if(this.mode == "y") {
            var value = Scales.getScaleInverseClampSnap(this.chart.cartesian_scales.y, p.y, pair_value);
        }
    } else {
        return null;
    }
    return {
        distance: d,
        p0: p0, p1: p1,
        value: value,
        d: null
    }
};

ChartElements.axis.prototype.render = function(g, selection) {
    var p0 = selection.p0;
    var p1 = selection.p1;
    if(selection.value !== null) {
        var path = g.append("path");
        if(this.mode == "x") {
            var px = Scales.getScaleValueRange(this.chart.cartesian_scales.x, selection.value);
            var py = Scales.getScaleRangeExtent(this.chart.cartesian_scales.y);
            path.attr("d", Geometry.Path.rect(px[0], py[0], px[1] - px[0], py[1] - py[0]));
        }
        if(this.mode == "y") {
            var px = Scales.getScaleRangeExtent(this.chart.cartesian_scales.x);
            var py = Scales.getScaleValueRange(this.chart.cartesian_scales.y, selection.value);
            path.attr("d", Geometry.Path.rect(px[0], py[0], px[1] - px[0], py[1] - py[0]));
        }
        path.style({
            "fill": Colors.selection_hint_color,
            "fill-opacity": 0.5,
            "stroke": Colors.selection_hint_color,
            "stroke-width": 2
        });
    }
};

ChartElements.axis.prototype.renderBetween = function(g, selection1, selection2) {
    if(selection1.value !== null && selection2.value !== null) {
        var path = g.append("path");
        if(this.mode == "x") {
            var px1 = Scales.getScaleValueRange(this.chart.cartesian_scales.x, selection1.value);
            var px2 = Scales.getScaleValueRange(this.chart.cartesian_scales.x, selection2.value);
            var py = Scales.getScaleRangeExtent(this.chart.cartesian_scales.y);
            var px_min = Math.min(px1[0], px1[1], px2[0], px2[1]);
            var px_max = Math.max(px1[0], px1[1], px2[0], px2[1]);
            path.attr("d", Geometry.Path.rect(px_min, py[0], px_max - px_min, py[1] - py[0]));
        }
        if(this.mode == "y") {
            var px = Scales.getScaleRangeExtent(this.chart.cartesian_scales.x);
            var py1 = Scales.getScaleValueRange(this.chart.cartesian_scales.y, selection1.value);
            var py2 = Scales.getScaleValueRange(this.chart.cartesian_scales.y, selection2.value);
            var py_min = Math.min(py1[0], py1[1], py2[0], py2[1]);
            var py_max = Math.max(py1[0], py1[1], py2[0], py2[1]);
            path.attr("d", Geometry.Path.rect(px[0], py_min, px[1] - px[0], py_max - py_min));
        }
        path.style({
            "fill": Colors.selection_hint_color,
            "fill-opacity": 0.1,
            "stroke": "none"
        });
    }
};

ChartElements.axis.prototype.renderGuides = function(RC) {
    return;
    // if(!Scales.isScaleNumerical(this.chart.cartesian_scales[this.mode])) return;
    var self = this;
    // Select range between existing ranges.
    var sep_points = [];
    var axis_scale = this.chart.cartesian_scales[this.mode];
    if(Scales.isScaleNumerical(axis_scale)) {
        var range_extent = Scales.getScaleRangeExtent(axis_scale);
        var is_ordinal = false;
        var ScaleValueType = Expression.Number;
    } else {
        // For categorical scales, get the exact extent.
        var range = axis_scale.range();
        var range_extent = [ range[0], range[range.length - 1] + axis_scale.rangeBand() ];
        var is_ordinal = true;
        var ScaleValueType = Expression.String;
    }
    this.owner.annotations.forEach(function(a) {
        if(a.target.type == "range" && a.target.axis == self && !a.target_inherit) {
            var range = a.target.range.eval(RC.context);
            var range_extent = Scales.getScaleValueRange(axis_scale, range);
            if(Expression.isSimpleFunction(a.target.range, "range")) {
                var expr1 = a.target.range.args[0];
                var expr2 = a.target.range.args[1];
            } else {
                var expr1 = a.target.range;
                var expr2 = a.target.range;
            }
            var modevalue = range_extent[0] < range_extent[1] ? 0 : 1;
            if(is_ordinal) {
                var processed_expr1 = new ScaleValueType(Scales.getPreviousValue(axis_scale, expr1.eval(RC.context)));
                var processed_expr2 = new ScaleValueType(Scales.getNextValue(axis_scale, expr2.eval(RC.context)));
            } else {
                var processed_expr1 = expr1;
                var processed_expr2 = expr2;
            }
            if(!isArray(range)) {
                sep_points.push({
                    pos: range_extent[0],
                    mode: modevalue,
                    expression: processed_expr1,
                    parent: a
                });
                sep_points.push({
                    pos: range_extent[1],
                    mode: 1 - modevalue,
                    expression: processed_expr2,
                    parent: a
                });
            } else {
                sep_points.push({
                    pos: range_extent[0],
                    mode: modevalue,
                    expression: processed_expr1,
                    parent: null
                });
                sep_points.push({
                    pos: range_extent[1],
                    mode: 1 - modevalue,
                    expression: processed_expr2,
                    parent: null
                });
            }
        }
    });
    sep_points.sort(function(a, b) {
        if(a.pos == b.pos) return a.mode - b.mode;
        return a.pos - b.pos;
    });
    // We need to have something.
    var sep_ranges = [];
    if(sep_points.length > 0) {
        var is_in_range = 0;
        if(range_extent[0] < range_extent[1]) {
            var previous_pos = range_extent[0];
            var previous_expr = new ScaleValueType(axis_scale.domain()[0]);
            var previous_parent = null;
        } else {
            var previous_pos = range_extent[1];
            var previous_expr = new ScaleValueType(axis_scale.domain()[axis_scale.domain().length - 1]);
            var previous_parent = null;
        }

        var make_result = function(previous_pos, pos, previous_expr, expr, previous_parent, parent) {
            var r = { range_expression: null, value: null, range_position: [ previous_pos, pos ], parents: [ previous_parent, parent ] };
            if(is_ordinal) {
                var order = new Expression.Object(self.getRangeOrder());
                if(range_extent[0] < range_extent[1]) {
                    r.range_expression = new Expression.Function(new Expression.Variable("range"), [ previous_expr, expr, order ], { });
                } else {
                    r.range_expression = new Expression.Function(new Expression.Variable("range"), [ expr, previous_expr, order ], { });
                }
            } else {
                if(range_extent[0] < range_extent[1]) {
                    r.range_expression = new Expression.Function(new Expression.Variable("range"), [ previous_expr, expr ], { });
                } else {
                    r.range_expression = new Expression.Function(new Expression.Variable("range"), [ expr, previous_expr ], { });
                }
            }
            r.value = r.range_expression.eval(RC.context);
            sep_ranges.push(r);
        };

        for(var i = 0; i < sep_points.length; i++) {
            var pos = sep_points[i].pos;
            var expr = sep_points[i].expression;
            var parent = sep_points[i].parent;
            if(is_in_range == 0 && pos > previous_pos + 5) {
                make_result(previous_pos, pos, previous_expr, expr, previous_parent, parent);
            }
            previous_pos = pos;
            previous_expr = expr;
            var previous_parent = parent;
            if(sep_points[i].mode == 0) is_in_range += 1;
            if(sep_points[i].mode == 1) is_in_range -= 1;
        }
        if(range_extent[0] < range_extent[1]) {
            var pos = range_extent[1];
            var expr = new ScaleValueType(axis_scale.domain()[axis_scale.domain().length - 1]);
        } else {
            var pos = range_extent[0];
            var expr = new ScaleValueType(axis_scale.domain()[0]);
        }
        if(is_in_range == 0 && pos > previous_pos + 5) {
            make_result(previous_pos, pos, previous_expr, expr, previous_parent, null);
        }
    }
    var g_ranges = RC.layers.add("fg", this, "g", "ranges");
    g_ranges.classed("chartaccent-edit-widget", true);
    if(this.mode == "y") {
        g_ranges.attr("transform", "translate(" + Scales.getScaleRangeExtent(this.chart.cartesian_scales.x)[1] + ",0)");
    } else {
        g_ranges.attr("transform", "translate(0," + (Scales.getScaleRangeExtent(this.chart.cartesian_scales.y)[1]) + ")");
    }

    var tabs = g_ranges.selectAll("g.tab").data(sep_ranges);
    tabs.enter().append("g").attr("class", "tab");
    tabs.call(Widgets.RangeTab({
        orientation: this.mode == "y" ? "vertical" : "horizontal",
        t1: function(d) { return d.range_position[0] },
        t2: function(d) { return d.range_position[1] },
        buttons: [ "more" ],
        onClick: function(d, button) {
            var sel = d.range_expression;
            if(self.default_format) {
                var text = Expression.parse('formatRange("' + self.default_format + '", value)');
            } else {
                var text = Expression.parse('formatRange("s", value)');
            }
            var annotation = new Annotation({
                target: {
                    type: "range",
                    axis: self,
                    range: sel
                },
                components: [
                    {
                        type: "label",
                        text: text, anchor: self.mode == "x" ? "m,t" : "r,t",
                        style: Styles.createDefault("label")
                    },
                    {
                        type: "range",
                        style: Styles.createDefault("range")
                    }
                ]
            });
            var min_parent_index = undefined;
            for(var p in d.parents) {
                if(d.parents[p] !== null) {
                    var idx = self.owner.getAnnotationPosition(d.parents[p]);
                    if(min_parent_index === undefined || min_parent_index > idx) {
                        min_parent_index = idx;
                    }
                }
            }
            self.owner.addAnnotation(annotation, min_parent_index);
        }
    }));
};

ChartElements.axis.prototype.beginCreation = function(layer_hint, selection, callback) {
    var self = this;
    var hint0 = layer_hint.append("g");
    var hint1 = layer_hint.append("g");
    var hint2 = layer_hint.append("g");

    var axis_scale = this.chart.cartesian_scales[this.mode];

    var context = { };
    var value = selection.value;

    this.render(hint1, selection);

    if(value === null || value === undefined) return context;
    var value2 = null;
    context.mousemove = function(pt) {
        hint2.selectAll("*").remove();
        hint0.selectAll("*").remove();
        var sel = this.select(pt, true, value);
        if(sel && sel.value !== null) {
            value2 = sel.value;
        } else {
            value2 = null;
        }
        this.renderBetween(hint0, selection, sel);
        this.render(hint2, sel);
    }.bind(this);
    context.mouseup = function() {
        var is_range = false;
        if(Scales.isScaleNumerical(axis_scale)) {
            // Numerical scale.
            if(value2 !== null) {
                is_range = true;
                if(value < value2) {
                    var sel = Expression.createNumberRange(value, value2);
                } else {
                    var sel = Expression.createNumberRange(value2, value);
                }
                if(this.default_range_label) {
                    var text = Expression.parse(this.default_range_label);
                } else if(this.default_format) {
                    var text = Expression.parse('formatRange("' + this.default_format + '", value)');
                } else {
                    var text = Expression.parse('formatRange("s", value)');
                }
            } else {
                is_range = false;
                var sel = new Expression.Number(value);
                if(this.default_label) {
                    var text = Expression.parse(this.default_label);
                } else if(this.default_format) {
                    var text = Expression.parse('format("' + this.default_format + '", value)');
                } else {
                    var text = Expression.parse('format("s", value)');
                }
            }
        } else {
            // Categorical scale.
            if(value2 !== null && !(isObject(value) && value.min && value.min == value2.min && value.max == value2.max) && !(isObject(value) && value.value && value.value == value2.value)) {
                is_range = true;
                var order = this.getRangeOrder();
                var vmin = null;
                var vmax = null;
                var id1, id2;
                if(value.value) {
                    id1 = order.indexOf(value.value);
                } else {
                    id1 = order.indexOf(value.min) + 0.5;
                }
                if(value2.value) {
                    id2 = order.indexOf(value2.value);
                } else {
                    id2 = order.indexOf(value2.min) + 0.5;
                }
                if(id1 < id2) {
                    vmin = order[Math.ceil(id1)];
                    vmax = order[Math.floor(id2)];
                } else {
                    vmin = order[Math.ceil(id2)];
                    vmax = order[Math.floor(id1)];
                }
                var sel = Expression.createStringRange(vmin, vmax, self.getRangeOrder());
                if(this.default_range_label) {
                    var text = Expression.parse(this.default_range_label);
                } else if(this.default_format) {
                    var text = Expression.parse('formatRange("' + this.default_format + '", value)');
                } else {
                    var text = Expression.parse('formatRange("s", value)');
                }
            } else {
                if(value.value) {
                    is_range = true;
                    var sel = Expression.createStringRange(value.value, value.value, self.getRangeOrder());
                    if(this.default_range_label) {
                        var text = Expression.parse(this.default_range_label);
                    } else if(this.default_format) {
                        var text = Expression.parse('formatRange("' + this.default_format + '", value)');
                    } else {
                        var text = Expression.parse('formatRange("s", value)');
                    }
                } else {
                    is_range = false;
                    var sel = new Expression.String(value);
                    if(this.default_label) {
                        var text = Expression.parse(this.default_label);
                    } else {
                        var text = Expression.parse('format("s", value)');
                    }
                }
            }
        }
        var display_as_range = is_range || (!Scales.isScaleNumerical(this.getScale()) && !isObject(value));
        var annotation = new Annotation({
            target: {
                type: "range",
                axis: this,
                range: sel
            },
            components: [
                {
                    type: "label",
                    text: text,
                    anchor: this.mode == "x" ? (!display_as_range ? "r,tt" : "m,tt") : (display_as_range ? "r,t": "r,tt"),
                    style: Styles.createDefault("label")
                },
                {
                    type: display_as_range ? "range" : "range-line",
                    style: display_as_range ? Styles.createDefault("range") : Styles.createDefault("range-line")
                }
            ]
        });
        callback(annotation);
    }.bind(this);
    return context;
};

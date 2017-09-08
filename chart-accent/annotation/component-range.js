var MakeFGPath = function(RC2, owner, fgpathclass, mode, x1, y1, x2, y2, draggable, mousemove, click) {
    var fgpath = RC2.addElement("fg", "path", fgpathclass + getObjectUniqueID(owner));
    fgpath.attr("d", Geometry.Path.rect(x1, y1, x2 - x1, y2 - y1));
    if(x1 == x2 || y1 == y2) {
        fgpath.classed("chartaccent-draghandle-line", true);
    }
    fgpath.classed("chartaccent-draghandle-range", true);
    fgpath.style({
        "stroke": "none",
        "fill": "none",
        "stroke-width": 5,
        "stroke-linejoin": "round",
        "pointer-events": "all",
        "cursor": draggable ? (fgpathclass == "vr" ? "move": (mode == "x" ? "ew-resize" : "ns-resize")) : "pointer"
    });
    if(x1 == x2 || y1 == y2) {
        fgpath.on("mousedown", function() {
            var px0 = d3.event.pageX;
            var py0 = d3.event.pageY;
            var mouse_moved = false;
            click();
            setupDragHandlers({
                mousemove: function() {
                    var px1 = d3.event.pageX;
                    var py1 = d3.event.pageY;
                    mouse_moved = true;
                    if(mousemove) mousemove(px1 - px0, py1 - py0);
                },
                mouseup: function() {
                    click();
                    // if(!mouse_moved) {
                    //     if(click) click();
                    // }
                }
            });
        });
    } else {
        fgpath.style("pointer-events", "none");
        RC2.RC.addBubbleCursorItems(fgpath, { cursor: "move", layer: -1 }, function() {
            var px0 = d3.event.pageX;
            var py0 = d3.event.pageY;
            var mouse_moved = false;
            click();
            setupDragHandlers({
                mousemove: function() {
                    var px1 = d3.event.pageX;
                    var py1 = d3.event.pageY;
                    mouse_moved = true;
                    mousemove(px1 - px0, py1 - py0);
                },
                mouseup: function() {
                    click();
                    // if(!mouse_moved) {
                    //     if(click) click();
                    // }
                }
            });
        });
    }
};

Annotation.prototype.renderComponentRange = function(RC, RC2, component) {
    var doStartPopout = function() {
        RC2.startPopoutEditor();
    }
    if(this.target.type == "range") {
        if(RC2.axis && RC2.range_rect) {
            var range = RC2.range;
            var axis = RC2.axis;
            var range_rect = RC2.range_rect;
            var width = range_rect.x2 - range_rect.x1;
            var height = range_rect.y2 - range_rect.y1;
            if(width == 0 || height == 0) {
                var path = RC2.addElement("fg", "path", getObjectUniqueID(component));
            } else {
                var path = RC2.addElement("bg", "path", getObjectUniqueID(component));
                var path2 = RC2.addElement("fg", "path", getObjectUniqueID(component) + "_lines");
            }
            path.attr("d", Geometry.Path.rect(
                range_rect.x1, range_rect.y1,
                width, height
            ));
            if(path2) {
                if(RC2.axis.mode == "y") {
                    path2.attr("d", Geometry.Path.commands(
                        [ "M", range_rect.x1, range_rect.y1 ],
                        [ "L", range_rect.x2, range_rect.y1 ],
                        [ "M", range_rect.x1, range_rect.y2 ],
                        [ "L", range_rect.x2, range_rect.y2 ]
                    ));
                } else {
                    path2.attr("d", Geometry.Path.commands(
                        [ "M", range_rect.x1, range_rect.y1 ],
                        [ "L", range_rect.x1, range_rect.y2 ],
                        [ "M", range_rect.x2, range_rect.y1 ],
                        [ "L", range_rect.x2, range_rect.y2 ]
                    ));
                }
            }
            if(component.mode == "line" && !Scales.isScaleNumerical(RC2.axis.getScale())) {
                path.remove();
                var scale = RC2.axis.getScale();
                var i0 = scale.domain().indexOf(range[0]);
                var i1 = scale.domain().indexOf(range[1]);
                var commands = [];
                for(var i = i0; i <= i1; i++) {
                    var vrange = scale(scale.domain()[i]) + scale.rangeBand() / 2.0;
                    if(RC2.axis.mode == "x") {
                        var extent = Scales.getScaleRangeExtent(RC.owner.cartesian_scales.y);
                        commands.push([ "M", vrange, extent[0] ]);
                        commands.push([ "L", vrange, extent[1] ]);
                    } else {
                        var extent = Scales.getScaleRangeExtent(RC.owner.cartesian_scales.x);
                        commands.push([ "M", extent[0], vrange ]);
                        commands.push([ "L", extent[1], vrange ]);
                    }
                }
                path2.attr("d", Geometry.Path.commands.apply(null, commands));
            }

            var color = component.color ? Expression.safeEval(component.color, RC2.context) : Colors.default_color;
            if(width == 0 || height == 0) {
                path.style({
                    "fill": "none",
                    "stroke": component.style.stroke !== null ? component.style.stroke : "none",
                    "stroke-width": component.style.stroke_width
                });
            } else {
                path.style({
                    "fill": component.style.fill !== null ? component.style.fill : "none",
                    "stroke": "none"
                });
                path2.style({
                    "fill": "none",
                    "stroke": component.style.stroke !== null ? component.style.stroke : "none",
                    "stroke-width": component.style.stroke_width
                });
            }

            if(component.visible && this.visible) {
                path.style("visibility", "visible");
                if(path2) path2.style("visibility", "visible");
            } else {
                path.style("visibility", "hidden");
                if(path2) path2.style("visibility", "hidden");
            }

            if(RC.isEditing) {
                // Differentiate x and y axis.
                if(RC2.axis.mode == "x") {
                    var processValue = function(dx, dy, v0) {
                        var v = Scales.getScaleInverseClampSnap(axis.chart.cartesian_scales.x, Scales.getScale(axis.chart.cartesian_scales.x, v0) + dx, v0);
                        if(isObject(v)) {
                            if(v.value) return v.value;
                            return v;
                        } else {
                            return v;
                        }
                    };
                    var compareValue = function(v1, v2) {
                        return Scales.compareScaledValue(axis.chart.cartesian_scales.x, v1, v2);
                    };
                    var x1_r = range_rect.x1; var x1_0 = range_rect.x1; var x1_1 = range_rect.x2;
                    var y1_r = range_rect.y1; var y1_0 = range_rect.y1; var y1_1 = range_rect.y1;
                    var x2_r = range_rect.x2; var x2_0 = range_rect.x1; var x2_1 = range_rect.x2;
                    var y2_r = range_rect.y2; var y2_0 = range_rect.y2; var y2_1 = range_rect.y2;
                }
                if(RC2.axis.mode == "y") {
                    var processValue = function(dx, dy, v0) {
                        var v = Scales.getScaleInverseClampSnap(axis.chart.cartesian_scales.y, Scales.getScale(axis.chart.cartesian_scales.y, v0) + dy, v0);
                        if(isObject(v)) {
                            if(v.value) return v.value;
                            return v;
                        } else {
                            return v;
                        }
                    };
                    var compareValue = function(v1, v2) {
                        return Scales.compareScaledValue(axis.chart.cartesian_scales.y, v1, v2);
                    };
                    var x1_r = range_rect.x1; var x1_0 = range_rect.x1; var x1_1 = range_rect.x1;
                    var y1_r = range_rect.y1; var y1_0 = range_rect.y1; var y1_1 = range_rect.y2;
                    var x2_r = range_rect.x2; var x2_0 = range_rect.x2; var x2_1 = range_rect.x2;
                    var y2_r = range_rect.y2; var y2_0 = range_rect.y1; var y2_1 = range_rect.y2;
                }
                // Render move handlers.
                if(Expression.isSimpleFunction(this.target.range, "range")) {
                    var v0 = Expression.isValue(this.target.range.args[0]) ? this.target.range.args[0].value : undefined;
                    var v1 = Expression.isValue(this.target.range.args[1]) ? this.target.range.args[1].value : undefined;
                    var expr0 = this.target.range.args[0];
                    var expr1 = this.target.range.args[1];

                    MakeFGPath(RC2, this, "vr", axis.mode, x1_r, y1_r, x2_r, y2_r, (v0 !== undefined || v1 !== undefined), function(dx, dy) {
                        if(v0 !== undefined) {
                            expr0.value = processValue(dx, dy, v0);
                        }
                        if(v1 !== undefined) {
                            expr1.value = processValue(dx, dy, v1);
                        }
                        if(compareValue(expr0.eval(RC2.context), expr1.eval(RC2.context)) < 0) {
                            this.target.range.args[0] = expr0;
                            this.target.range.args[1] = expr1;
                        } else {
                            this.target.range.args[0] = expr1;
                            this.target.range.args[1] = expr0;
                        }
                        DM.invalidate(this);
                        RC.validate();
                    }.bind(this), doStartPopout);
                    MakeFGPath(RC2, this, "v0", axis.mode, x1_0, y1_0, x2_0, y2_0, v0 !== undefined, function(dx, dy) {
                        if(v0 !== undefined) {
                            expr0.value = processValue(dx, dy, v0);
                            if(compareValue(expr0.eval(RC2.context), expr1.eval(RC2.context)) < 0) {
                                this.target.range.args[0] = expr0;
                                this.target.range.args[1] = expr1;
                            } else {
                                this.target.range.args[0] = expr1;
                                this.target.range.args[1] = expr0;
                            }
                            DM.invalidate(this);
                        }
                        RC.validate();
                    }.bind(this), doStartPopout);
                    MakeFGPath(RC2, this, "v1", axis.mode, x1_1, y1_1, x2_1, y2_1, v1 !== undefined, function(dx, dy) {
                        if(v1 !== undefined) {
                            expr1.value = processValue(dx, dy, v1);
                            if(compareValue(expr0.eval(RC2.context), expr1.eval(RC2.context)) < 0) {
                                this.target.range.args[0] = expr0;
                                this.target.range.args[1] = expr1;
                            } else {
                                this.target.range.args[0] = expr1;
                                this.target.range.args[1] = expr0;
                            }
                            DM.invalidate(this);
                        }
                        RC.validate();
                    }.bind(this), doStartPopout);
                } else {
                    if(Expression.isValue(this.target.range)) {
                        var v0 = this.target.range.value, y0 = axis.chart.cartesian_scales.y(v0);
                        MakeFGPath(RC2, this, "v0", axis.mode, x1_r, y1_r, x2_r, y2_r, true, function(dx, dy) {
                            this.target.range.value = processValue(dx, dy, v0);
                            DM.invalidate(this);
                            RC.validate();
                        }.bind(this), doStartPopout);
                    } else {
                        MakeFGPath(RC2, this, "v0", axis.mode, x1_r, y1_r, x2_r, y2_r, false, null, doStartPopout);
                    }
                }
                return;
                // Render range tabs.
                var handle_tab_button = function(d, button, button_element) {
                    if(button == "more") {
                        doStartPopout();
                    }
                    if(button == "eye") {
                        this.visible = !this.visible;
                        // this.components.forEach(function(d) {
                        //     if(d.type == "label") d.visible = component.visible;
                        // });
                        DM.invalidate(this);
                        RC.validate();
                    }
                    if(button == "bars") {
                        if(RC.owner.annotations.some(function(d) { return d.target == this.target && d != this; }.bind(this))) {
                            var is_something_selected = RC.owner.annotations.some(function(d) {
                                if(d.target == this.target && d != this) {
                                    if(d.visible) return true;
                                } else {
                                    return false;
                                }
                            }.bind(this));
                            if(is_something_selected) {
                                RC.owner.annotations.forEach(function(d) {
                                    if(d.target == this.target && d != this) {
                                        d.visible = false;
                                        DM.invalidate(d);
                                    }
                                }.bind(this));
                            } else {
                                RC.owner.annotations.forEach(function(d) {
                                    if(d.target == this.target && d != this) {
                                        d.visible = true;
                                        DM.invalidate(d);
                                    }
                                }.bind(this));
                            }
                        } else {
                            this.startSelectRangeItems(RC, d3.select(button_element), null);
                        }
                        // var highlights = this.components.filter(function(d) { return d.type == "highlight"; });
                        // if(highlights.every(function(d) { return d.visible; })) {
                        //     highlights.forEach(function(d) { d.visible = false; });
                        // } else {
                        //     highlights.forEach(function(d) { d.visible = true; });
                        // }
                        // DM.invalidate(this);
                        RC.validate();
                    }
                }.bind(this);

                var buttons = [ "more" ];

                if(RC2.axis.mode == "y") {
                    var tabs = RC2.addElement("fg2", "g", getObjectUniqueID(component));
                    tabs.classed("chartaccent-edit-widget", true);
                    tabs.attr("transform", "translate(" + range_rect.x2 + ",0)");
                    tabs.call(Widgets.RangeTab({
                        orientation: "vertical",
                        t1: function() { return range_rect.y1 },
                        t2: function() { return range_rect.y2 },
                        buttons: buttons,
                        buttonActive: function(d, button) {
                            if(button == "eye") {
                                return this.visible;
                            }
                            if(button == "bars") {
                                return RC.owner.annotations.some(function(d) {
                                    if(d.target == this.target && d != this) {
                                        if(d.visible) return true;
                                    } else {
                                        return false;
                                    }
                                }.bind(this));
                            }
                        }.bind(this),
                        onClick: handle_tab_button
                    }));
                }
                if(RC2.axis.mode == "x") {
                    var tabs = RC2.addElement("fg2", "g", getObjectUniqueID(component));
                    tabs.attr("transform", "translate(0, " + range_rect.y2 + ")");
                    tabs.classed("chartaccent-edit-widget", true);
                    tabs.call(Widgets.RangeTab({
                        orientation: "horizontal",
                        t1: function() { return range_rect.x1 },
                        t2: function() { return range_rect.x2 },
                        buttons: buttons,
                        buttonActive: function(d, button) {
                            if(button == "eye") {
                                return this.visible;
                            }
                            if(button == "bars") {
                                var highlights = this.components.filter(function(d) { return d.type == "highlight"; });
                                return highlights.every(function(d) { return d.visible; });
                            }
                        }.bind(this),
                        onClick: handle_tab_button
                    }));
                }
                tabs.classed("edit-widget", true);
            }
        }
    }
};

ChartElements.series = function(owner, info) {
    this.owner = owner;
    this.name = info.name;
    this.elements = [];
    this.item2element = new WeakMap();
    this.has_line = false;

    if(info.default_label) {
        // Default item label.
        this.default_label = info.default_label;
    }
    if(info.getAxisValue) {
        // Function to determine is an item in a range.
        this.getAxisValue = info.getAxisValue;
    }
    if(info.getValue) {
        this.getValue = info.getValue;
    }
    if(info.getColor) {
        this.getColor = info.getColor;
    }
    if(info.itemToString) {
        this.item_to_string = info.itemToString;
    }
    if(info.bubbleset) {
        this.bubbleset = info.bubbleset;
    }
};

// [ "rect", p1, p2, p3, p4 ], [ "circle", center, radius ]
ChartElements.series.prototype.setItems = function(data, elements, points) {
    this.elements = [];
    this.item2element = new WeakMap();
    this.has_line = points ? true : false;
    for(var i = 0; i < elements.length; i++) {
        this.elements[i] = {
            datum: data[i],
            point: points ? points[i] : null,
            element: elements[i]
        };
        this.item2element.set(data[i], this.elements[i]);
    }
};

ChartElements.series.prototype.itemToString = function(item) {
    if(this.item_to_string) {
        return this.item_to_string(item);
    } else {
        return JSON.stringify(item);
    }
};

ChartElements.series.prototype.pointElementDistance = function(p, element) {
    if(element[0] == "rect") {
        return Geometry.pointRectDistance(p, element[1], element[2], element[4], element[3]);
    }
    if(element[0] == "circle") {
        var d = Geometry.pointPointDistance(p, element[1]);
        var d_border = Math.max(0, d - element[2]);
        return d_border;
    }
    return null;
};

ChartElements.series.prototype.isElementInsideLasso = function(lasso, element) {
    if(element[0] == "rect") {
        return Geometry.isPolygonIntersect([element[1], element[2], element[4], element[3]], lasso);
    }
    if(element[0] == "circle") {
        return Geometry.pointInsidePolygon(element[1], lasso)
    }
    return false;
};

ChartElements.series.prototype.getElementExtent = function(element) {
    if(element[0] == "rect") {
        return {
            type: "polyline",
            polyline: {
                closed: true,
                points: [element[1], element[2], element[4], element[3]]
            }
        };
    }
    if(element[0] == "circle") {
        return {
            type: "rect",
            rect: {
                x1: element[1].x - element[2],
                y1: element[1].y - element[2],
                x2: element[1].x + element[2],
                y2: element[1].y + element[2]
            }
        };
    }
};

ChartElements.series.prototype.getElementColor = function(element) {
    if(element[0] == "rect") {
        return element[5];
    }
    if(element[0] == "circle") {
        return element[3];
    }
};

ChartElements.series.prototype.getItemColor = function(item) {
    var element = this.item2element.get(item);
    if(element) {
        return this.getElementColor(element.element);
    } else {
        return null;
    }
};

ChartElements.series.prototype.getItemExtent = function(item) {
    var element = this.item2element.get(item);
    if(element) {
        return this.getElementExtent(element.element);
    } else {
        return null;
    }
};

ChartElements.series.prototype.selectAll = function() {
    return {
        elements: this,
        items: this.elements.map(function(d) { return d.datum; })
    };
};

ChartElements.series.prototype.select = function(p) {
    var min_distance = null;
    var min_element = null;
    this.elements.forEach(function(element) {
        var d = this.pointElementDistance(p, element.element);
        if(d === null) return;
        if(min_distance === null || min_distance > d) {
            min_element = element;
            min_distance = d;
        }
    }.bind(this));

    var min_segment_distance = null;
    var min_p1p2 = null;

    if(this.has_line) {
        for(var i = 0; i < this.elements.length - 1; i++) {
            var j = i + 1;
            var p1 = this.elements[i];
            var p2 = this.elements[j];
            var d = Geometry.pointLineSegmentDistance(p, p1.point, p2.point);
            if(min_segment_distance === null || min_segment_distance > d) {
                min_p1p2 = [p1, p2];
                min_segment_distance = d;
            }
        }
    }
    if (min_element && min_distance < 10) {
        return {
            distance: min_distance,
            element: min_element
        };
    } else if(min_p1p2 !== null && min_segment_distance < 10) {
        return {
            distance: min_segment_distance,
            segment: min_p1p2
        };
    } else if(min_p1p2 !== null && min_segment_distance < 40) {
        return {
            distance: min_segment_distance,
            is_whole_series: true,
            segment: [ this.elements[0], this.elements[this.elements.length - 1] ]
        };
    } else {
        return null;
    }
};

ChartElements.series.prototype.lassoSelect = function(lasso) {
    var selected_elements = this.elements.filter(function(element) {
        return this.isElementInsideLasso(lasso, element.element);
    }.bind(this));
    if(selected_elements.length != 0) {
        return {
            elements: selected_elements,
            is_lasso: true
        };
    }
};

ChartElements.series.prototype.getItemsWithLasso = function(lasso_selection) {
    return lasso_selection.elements.map(function(item) { return item.datum; });
};

ChartElements.series.prototype.render = function(g, selection) {
    var self = this;
    var elements = [];
    if(selection) {
        if(selection.elements) elements = selection.elements;
        if(selection.element) elements = [ selection.element ];
    }
    var sel_elements = g.selectAll(".element").data(elements);
    sel_elements.enter().append(function(d) {
        if(d.element[0] == "rect") {
            return document.createElementNS("http://www.w3.org/2000/svg", "path");
        }
        if(d.element[0] == "circle") {
            return document.createElementNS("http://www.w3.org/2000/svg", "circle");
        }
    }).attr("class", "element");
    sel_elements.exit().remove();
    sel_elements.each(function(d) {
        var sel_element = d3.select(this);
        if(d.element[0] == "rect") {
            sel_element.attr("d",
               "M" + d.element[1].x + "," + d.element[1].y +
               "L" + d.element[2].x + "," + d.element[2].y +
               "L" + d.element[4].x + "," + d.element[4].y +
               "L" + d.element[3].x + "," + d.element[3].y + "Z"
            );
        }
        if(d.element[0] == "circle") {
            sel_element.attr("cx", d.element[1].x);
            sel_element.attr("cy", d.element[1].y);
            sel_element.attr("r", d.element[2]);
        }
    });
    sel_elements.style({
        "fill": Colors.selection_hint_fill_color,
        "fill-opacity": 0.5,
        "stroke": Colors.selection_hint_color,
        "stroke-width": 2
    });
    if(this.itemToString) {
        var sel_elements_label = g.selectAll(".element-label").data(elements.length == 1 && !selection.is_lasso ? elements : []);
        var sel_elements_label_enter = sel_elements_label.enter().append("g").classed("element-label", true);
        sel_elements_label_enter.append("rect");
        sel_elements_label_enter.append("text");
        sel_elements_label.exit().remove();
        var yoffset = 10;
        var paddingx = 5, paddingy = 2;
        sel_elements_label.select("text").text(function(d) {
            return self.itemToString(d.datum);
        }).style({
            "fill": Colors.selection_hint_color,
            "stroke": "none",
            "font-size": "14",
            "text-anchor": "middle"
        });
        sel_elements_label.select("rect").style({
            "stroke": Colors.selection_hint_color,
            "fill": chroma.mix(Colors.selection_hint_color.toString(), "white", 0.9),
            "stroke-width": 1
        });
        sel_elements_label.each(function(d) {
            var sel_element = d3.select(this).select("text");
            if(d.element[0] == "rect") {
                sel_element.attr("x", (d.element[1].x + d.element[2].x + d.element[3].x + d.element[4].x) / 4);
                sel_element.attr("y", Math.min(d.element[1].y, d.element[2].y, d.element[3].y, d.element[4].y) - yoffset);
            }
            if(d.element[0] == "circle") {
                sel_element.attr("x", d.element[1].x);
                sel_element.attr("y", d.element[1].y - d.element[2] - yoffset);
            }
            var sel_element_bg = d3.select(this).select("rect");
            var bbox = sel_element.node().getBBox();
            sel_element_bg.attr({
                x: bbox.x - paddingx,
                y: bbox.y - paddingy,
                width: bbox.width + paddingx * 2,
                height: bbox.height + paddingy * 2
            });
        });

    }

    var segment_items = [];
    if(selection) {
        if(selection.segment) {
            var i1 = this.elements.indexOf(selection.segment[0]);
            var i2 = this.elements.indexOf(selection.segment[1]);
            segment_items = this.elements.slice(i1, i2 + 1);
            var path = g.append("path");
            path.attr("d", Geometry.Path.polyline.apply(null, segment_items.map(function(d) { return d.point; })));
            path.style({
                "fill": "none",
                "stroke": Colors.selection_hint_color,
                "stroke-width": 2
            });
        }
    }
};

ChartElements.series.prototype.getRangeItems = function(range, axis, mode) {
    if(!this.getAxisValue) return null;
    var getAxisValue = this.getAxisValue;
    var elements = this.elements.filter(function(element) {
        var value = getAxisValue(element.datum, axis.mode);
        if(!isArray(range) && isObject(range)) {
            // Categorical range.
            // the "between" mode for categorical scale.
            var order = range.order;
            if(mode == "above") return order.indexOf(value) >= order.indexOf(range.max);
            if(mode == "below") return order.indexOf(value) <= order.indexOf(range.min);
            if(mode == "above-or-equal") return order.indexOf(value) >= order.indexOf(range.max);
            if(mode == "below-or-equal") return order.indexOf(value) <= order.indexOf(range.min);
        }
        // Numeric range.
        var rmin = range[0];
        var rmax = range[1];
        if(range[2]) {
            value = range[2].indexOf(value);
            rmin = range[2].indexOf(range[0]);
            rmax = range[2].indexOf(range[1]);
        }
        if(mode == "within-or-equal") return value >= rmin && value <= rmax;
        if(mode == "without-or-equal") return value <= rmin || value >= rmax;
        if(mode == "above-or-equal") return value >= range;
        if(mode == "below-or-equal") return value <= range;
        if(mode == "within") return value > rmin && value < rmax;
        if(mode == "without") return value < rmin || value > rmax;
        if(mode == "above") return value > range;
        if(mode == "below") return value < range;
    });
    return elements.map(function(d) { return d.datum; });
};

ChartElements.series.prototype.createLineHighlightOverlay = function(g, items, style) {
    var self = this;
    if(!isArray(items)) items = [ items ];
    var items = items.map(function(item) { return this.item2element.get(item); }.bind(this));

    if(this.has_line) {
        var lines = [];
        var current_idx = null;
        var current_line = null;
        var sorted_items = items.sort(function(a, b) {
            return self.elements.indexOf(a) - self.elements.indexOf(b);
        });
        for(var i = 0; i < sorted_items.length; i++) {
            var idx = this.elements.indexOf(sorted_items[i]);
            if(current_line === null) {
                current_line = [ sorted_items[i] ];
                current_idx = idx;
            } else {
                if(idx != current_idx + 1) {
                    lines.push(current_line);
                    current_line = [ sorted_items[i] ];
                    current_idx = idx;
                } else {
                    current_line.push(sorted_items[i]);
                    current_idx = idx;
                }
            }
        }
        if(current_line !== null) {
            lines.push(current_line);
        }
        var sel_lines = g.selectAll(".line-element").data(lines);
        sel_lines.enter().append("path").attr("class", "line-element");
        sel_lines.exit().remove();
        sel_lines.attr("d", function(d) {
            return Geometry.Path.polyline.apply(null, d.map(function(x) { return x.point; }));
        });
        sel_lines.style({
            "stroke": Styles.prepareHighlightColor(style.line_stroke, items.length > 0 ? self.getElementColor(items[0].element) : new RGBColor(0, 0, 0, 0)),
            "stroke-width": style.line_stroke_width,
            "fill": "none",
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
            "pointer-events": "stroke"
        });
    }
    return g.selectAll("*");
};

ChartElements.series.prototype.createHighlightOverlay = function(g, items, style) {
    var self = this;
    if(!isArray(items)) items = [ items ];
    var items = items.map(function(item) { return this.item2element.get(item); }.bind(this));

    var sel_elements = g.selectAll(".element").data(items);
    sel_elements.enter().append(function(d) {
        if(d.element[0] == "rect") {
            return document.createElementNS("http://www.w3.org/2000/svg", "path");
        }
        if(d.element[0] == "circle") {
            return document.createElementNS("http://www.w3.org/2000/svg", "circle");
        }
    }).attr("class", "element");
    sel_elements.exit().remove();
    sel_elements.each(function(d) {
        var sel_element = d3.select(this);
        if(d.element[0] == "rect") {
            sel_element.attr("d",
               "M" + d.element[1].x + "," + d.element[1].y +
               "L" + d.element[2].x + "," + d.element[2].y +
               "L" + d.element[4].x + "," + d.element[4].y +
               "L" + d.element[3].x + "," + d.element[3].y + "Z"
            );
        }
        if(d.element[0] == "circle") {
            sel_element.attr("cx", d.element[1].x);
            sel_element.attr("cy", d.element[1].y);
            sel_element.attr("r", d.element[2]);
        }
    });
    if(style) {
        sel_elements.style({
            "fill": function(d) {
                return Styles.prepareHighlightColor(style.fill, self.getElementColor(d.element));
            },
            "stroke": function(d) {
                return Styles.prepareHighlightColor(style.stroke, self.getElementColor(d.element));
            },
            "stroke-width": style.stroke_width,
            "pointer-events": "all"
        });
        // Styles.applyStyle(style, sel_elements);
    }
    return g.selectAll("*");
};

ChartElements.series.prototype.createRangeHighlightOverlay = function(g, range, axis, mode, style) {
    return this.createHighlightOverlay(g, this.getRangeItems(range, axis, mode), style);
};
ChartElements.series.prototype.createRangeLineHighlightOverlay = function(g, range, axis, mode, style) {
    return this.createLineHighlightOverlay(g, this.getRangeItems(range, axis, mode), style);
};

ChartElements.series.prototype.beginCreation = function(layer_hint, selection, callback) {
    return {
        isClickOnly: true,
        mouseup: function() {
            if(selection.element) {
                var items = [ selection.element.datum ];
            } else if(selection.segment) {
                var i1 = this.elements.indexOf(selection.segment[0]);
                var i2 = this.elements.indexOf(selection.segment[1]);
                segment_items = this.elements.slice(i1, i2 + 1);
                var items = segment_items.map(function(d) { return d.datum; });
            } else {
                var items = [];
            }
            if((d3.event.ctrlKey || d3.event.shiftKey) && this.owner.addItemsToCurrentAnnotation([{ elements: this, items: items }])) {
                // Successfully added, do nothing and return.
                return;
            } else {
                callback(new Annotation({
                    target: {
                        type: "items",
                        items: [ {
                            elements: this,
                            items: items
                        } ]
                    },
                    components: [
                        {
                            visible: selection.is_whole_series ? false: true,
                            type: "item-label",
                            text: Expression.parse(this.default_label ? this.default_label : '"[edit]"'),
                            anchor: "m,tt",
                            style: Styles.createDefault("item-label")
                        },
                        {
                            type: "highlight",
                            style: Styles.createDefault("highlight"),
                            segment: selection.segment
                        }
                    ]
                }));
            }
        }.bind(this)
    };
};

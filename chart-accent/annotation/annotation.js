var Annotation = function(info) {
    this.target = info.target;
    this.target_inherit = info.target_inherit;
    this.components = info.components;

    if(this.components === undefined) this.components = [];
    for(var i = 0; i < this.components.length; i++) {
        var component = this.components[i];
        if(component.visible === undefined) component.visible = true;
    }
    this.visible = info.visible;
    if(this.visible === undefined) this.visible = true;

    // Ugly stuff 1: If trendline-able, then add a trendline element.
    if((this.target.type == "items") || (this.target.type == "range" && this.target_inherit)) {
        this.components.push({
            visible: false,
            type: "trendline",
            style: Styles.createDefault("trendline")
        });
    }
    // Ugly stuff 2: If there is a highlight, add a highlight-line before it.
    var self = this;
    var index_to_highlight = null;
    this.components.forEach(function(d, i) {
        if(d.type == "highlight") {
            index_to_highlight = i;
        }
    });
    if(index_to_highlight !== null) {
        if(self.target.type == "items") {
            var should_add_highlight_line = self.target.items.some(function(d) { return d.elements.has_line; });
        }
        if(should_add_highlight_line) {
            self.components.splice(index_to_highlight, 0, {
                type: "highlight-line",
                style: this.components[index_to_highlight].style,
                visible: true
            });
        }
    }
};

import "component-range.js";
import "component-label.js";
import "component-item-label.js";
import "component-highlight.js";
import "component-trendline.js";
import "component-bubbleset.js";
import "component-shapes.js";

import "popout-editor.js";

Annotation.prototype.renderComponent = function(RC, RC2, component) {
    if(component.type == "range") this.renderComponentRange(RC, RC2, component);
    if(component.type == "range-line") this.renderComponentRange(RC, RC2, component);
    if(component.type == "label") this.renderComponentLabel(RC, RC2, component);
    if(component.type == "item-label") this.renderComponentItemLabel(RC, RC2, component);
    if(component.type == "highlight") this.renderComponentHighlight(RC, RC2, component);
    if(component.type == "highlight-line") this.renderComponentHighlightLine(RC, RC2, component);
    if(component.type == "trendline") this.renderComponentTrendline(RC, RC2, component);
    if(component.type == "bubbleset") this.renderComponentBubbleset(RC, RC2, component);
    if(component.type.substr(0, 6) == "shape.") this.renderComponentShape(RC, RC2, component);
};

// Only for "items" target type.
Annotation.prototype.getHighlightElementsExtent = function() {
    var bounding_extent_rect = null;
    var descs = this.target.items;
    this.components.forEach(function(c) {
        if(c.type == "highlight") {
            descs.forEach(function(desc) {
                var items = desc.items;
                var elements = desc.elements;
                items.forEach(function(item) {
                    var extent = elements.getItemExtent(item);
                    if(extent.polyline) {
                        extent.rect = {
                            x1: d3.min(extent.polyline.points, function(d) { return d.x; }),
                            y1: d3.min(extent.polyline.points, function(d) { return d.y; }),
                            x2: d3.max(extent.polyline.points, function(d) { return d.x; }),
                            y2: d3.max(extent.polyline.points, function(d) { return d.y; })
                        };
                    }
                    if(!bounding_extent_rect) {
                        bounding_extent_rect = extent.rect;
                    } else {
                        bounding_extent_rect.x1 = Math.min(bounding_extent_rect.x1, extent.rect.x1);
                        bounding_extent_rect.y1 = Math.min(bounding_extent_rect.y1, extent.rect.y1);
                        bounding_extent_rect.x2 = Math.max(bounding_extent_rect.x2, extent.rect.x2);
                        bounding_extent_rect.y2 = Math.max(bounding_extent_rect.y2, extent.rect.y2);
                    }
                });
            });
        }
    });
    if(bounding_extent_rect) {
        return {
            "type": "rect",
            rect: bounding_extent_rect
        };
    } else {
        return null;
    }
};

Annotation.prototype.toString = function() {
    if(this.target.type == "range") {
        var rangeToString = function(range) {
            if(Expression.isSimpleFunction(range, "range")) {
                return "range(" + range.args.slice(0, 2).map(function(x) {
                    if(isObject(x)) {
                        return x.value;
                    } else {
                        return x.toString();
                    }
                }).join(", ") + ")";
            } else {
                if(Expression.isStringValue(range)) {
                    return range.value.toString();
                } else {
                    return range.toString();
                }
            }
        };
        if(this.target_inherit) {
            var mode_string = {
                "within": "within",
                "without": "outside",
                "above": ">",
                "below": "<",
                "within-or-equal": "within or equal",
                "without-or-equal": "outside or equal",
                "above-or-equal": ">=",
                "below-or-equal": "<="
            };
            var axis = this.target.axis.mode == "x" ? "X" : "Y";
            return axis + " " + mode_string[this.target_inherit.mode] + " " + rangeToString(this.target.range);
        } else {
            var axis = this.target.axis.mode == "x" ? "X" : "Y";
            return axis + ": " + rangeToString(this.target.range);
        }
    }
    if(this.target.type == "items") {
        var serieses = { };
        this.target.items.forEach(function(desc) {
            var items = desc.items;
            var elements = desc.elements;
            items.forEach(function(item) {
                if(!serieses[elements.name]) serieses[elements.name] = new Set();
                serieses[elements.name].add(elements.itemToString(item));
            });
        });
        var series_names = getObjectKeys(serieses).sort();
        var itemnames = series_names.map(function(x) {
            return x + ": " + Array.from(serieses[x]).sort().join(", ");
        }).join("; ");
        if(this.target_inherit == "trendline") {
            return "Trendline: " + itemnames;
        } else {
            return itemnames;
        }
    }
    return "TODO: Description";
};

Annotation.prototype.summarize = function() {
    var target = "unknown";
    if(this.target.type == "range") {
        var rangeToString = function(range) {
            if(Expression.isSimpleFunction(range, "range")) {
                return "range";
            } else {
                if(range instanceof Expression.FunctionApply) {
                    return "@" + range.funcitem.name;
                }
                return "value";
            }
        };
        if(this.target_inherit) {
            var mode_string = {
                "within": "within",
                "without": "outside",
                "above": ">",
                "below": "<",
                "within-or-equal": "within or equal",
                "without-or-equal": "outside or equal",
                "above-or-equal": ">=",
                "below-or-equal": "<="
            };
            var axis = this.target.axis.mode == "x" ? "X" : "Y";
            target = axis + ":" + mode_string[this.target_inherit.mode] + "," + rangeToString(this.target.range);
        } else {
            var axis = this.target.axis.mode == "x" ? "X" : "Y";
            target = axis + ":" + rangeToString(this.target.range);
        }
    }
    if(this.target.type == "items") {
        var total_items = 0;
        this.target.items.forEach(function(desc) {
            total_items += desc.items.length;
        });
        target = "series:" + this.target.items.length + "," + total_items;
    }
    var visibles = this.components.filter(function(d) { return d.visible; }).map(function(d) { return d.type; }).join(",");
    return target + "|" + visibles;
}

Annotation.prototype.getAllItems = function() {
    var data_items = new Set();
    this.target.items.forEach(function(desc) {
        var items = desc.items;
        var elements = desc.elements;
        items.forEach(function(item) { data_items.add(item); });
    });
    return Array.from(data_items);
};

Annotation.prototype.render = function(RC) {
    var RC2 = { RC: RC };
    var attached_values = { };

    RC2.annotation = this;
    var added_elements = new Set();
    RC2.addElement = function(layer, element, classname, unique_id) {
        var elem = RC.layers.add(layer, this.annotation, element, classname, unique_id);
        added_elements.add(elem.node());
        return elem;
    };

    if(this.target.type == "range") {
        var range = this.target.range.eval(RC.context);
        RC2.range = range;

        attached_values.value = range;

        if(this.target.axis) {
            RC2.axis = this.target.axis;
            RC2.range_rect = RC2.axis.getRangeRect(range);
            RC2.extent = {
                type: "rect",
                rect: RC2.range_rect
            };
        }
    }

    if(this.target.type == "items") {
        attached_values["items"] = this.getAllItems();
        RC2.extent = this.getHighlightElementsExtent();
    }

    if(this.target.type == "freeform") {
        if(this.target.point) {
            RC2.extent = {
                type: "rect",
                rect: {
                    x1: this.target.point.x, y1: this.target.point.y,
                    x2: this.target.point.x, y2: this.target.point.y
                }
            };
        }
        if(this.target.rect) {
            RC2.extent = {
                type: "rect",
                rect: {
                    x1: this.target.rect.x1, y1: this.target.rect.y1,
                    x2: this.target.rect.x2, y2: this.target.rect.y2
                }
            };
        }
        if(this.target.line) {
            RC2.extent = {
                type: "rect",
                rect: {
                    x1: this.target.line[0].x, y1: this.target.line[0].y,
                    x2: this.target.line[1].x, y2: this.target.line[1].y
                }
            };
        }
    }

    RC2.context = Expression.CreateContext(attached_values, RC.context);

    RC2.startPopoutEditor = function() {
        RC.owner.setEditingAnnotation(RC2.annotation);
    };

    if(this.components) {
        for(var i = 0; i < this.components.length; i++) {
            this.renderComponent(RC, RC2, this.components[i]);
        }
    }

    // Cleanup extra elements.
    ["fg", "fg2", "bg"].forEach(function(layer) {
        var sel = RC.layers.getAll(layer, RC2.annotation);
        if(!sel) return;
        sel.each(function() {
            if(!added_elements.has(this)) {
                d3.select(this).remove();
            }
        });
    });
};

function CloneAnnotations(annotations) {
    var target_map = new WeakMap();

    function clone_target(target) {
        if(target.type == "items") {
            return {
                type: target.type,
                items: target.items.map(function(d) {
                    return {
                        elements: d.elements,
                        items: d.items.slice()
                    };
                })
            };
        }
        if(target.type == "range") {
            return {
                type: target.type,
                axis: target.axis,
                range: target.range.clone()
            };
        }
        if(target.type == "freeform") {
            return shallow_clone_object(target);
        }
        return target;
    }

    // function clone_target_inherit(target_inherit) {
    //     console.log(target_inherit);
    //     return target_inherit;
    // }

    function shallow_clone_object(obj) {
        if(obj === null || obj === undefined || typeof(obj) != "object") return obj;
        if(obj.constructor !== Object) {
            if(obj.clone) {
                return obj.clone();
            } else {
                console.log("Warning: incorrect type", obj, obj.constructor);
                return obj;
            }
        }
        var new_obj = { };
        for(var key in obj) {
            if(obj.hasOwnProperty(key)) {
                if(obj[key] instanceof Array) {
                    new_obj[key] = obj[key].map(function(d) { return shallow_clone_object(d); });
                } else {
                    new_obj[key] = shallow_clone_object(obj[key]);
                }
            }
        }
        return new_obj;
    }

    annotations.forEach(function(a) {
        target_map.set(a.target, clone_target(a.target));
    });

    return annotations.map(function(annotation) {
        var o = Object.create(Annotation.prototype);
        o.target = target_map.get(annotation.target);
        o.target_inherit = shallow_clone_object(annotation.target_inherit);
        o.components = annotation.components.map(shallow_clone_object);
        o.visible = annotation.visible;
        o.id = annotation.id;
        return o;
    });
};

Module.Annotation = Annotation;


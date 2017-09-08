Annotation.prototype.forEachElementsItem = function(RC, callback) {
    var annotation = this;
    if(annotation.target.type == "items") {
        annotation.target.items.forEach(function(desc) {
            var elements = desc.elements;
            desc.items.forEach(function(item) {
                callback(elements, item);
            });
        });
    }
    if(annotation.target.type == "range") {
        if(annotation.target_inherit) {
            annotation.target_inherit.serieses.forEach(function(elements) {
                if(!elements.getRangeItems) return;
                var items = elements.getRangeItems(annotation.target.range.eval(RC.context), annotation.target.axis, annotation.target_inherit.mode);
                items.forEach(function(item) {
                    callback(elements, item);
                });
            });
        }
    }
    if(annotation.target.type == "serieses") {
        annotation.target.serieses.forEach(function(elements) {
            if(!elements.getItems) return;
            elements.getItems().forEach(function(item) {
                callback(elements, item);
            });
        });
    }
};

Annotation.prototype.renderComponentItemLabel = function(RC, RC2, component) {
    if(!component.visible || !this.visible) return;

    var annotation = this;

    var doStartPopout = function() {
        RC2.startPopoutEditor();
    }

    annotation.forEachElementsItem(RC, function(elements, item) {
        var context_object = { };
        for(var key in item) {
            if(item.hasOwnProperty(key)) {
                context_object[key] = item[key];
            }
        }
        if(elements.getValue) {
            context_object['value'] = elements.getValue(item);
        }
        var context = Expression.CreateContext(context_object, RC2.context);
        var text = Expression.safeEvalAsString(component.text, context);
        var anchor = component.anchor;
        var label_id = getObjectUniqueID(elements) + getObjectUniqueID(item);
        var extent = elements.getItemExtent(item);

        if(component.line) {
            var label_line = RC2.addElement("fg2", "path", undefined, label_id);
        }

        var label2 = RC2.addElement("fg2", "text", undefined, label_id + "_1");
        var label = RC2.addElement("fg2", "text", undefined, label_id);
        label2.text(text);
        label.text(text);
        label2.call(function() { Styles.applyStyle(component.style, this); })
        label.call(function() { Styles.applyStyle(component.style, this); })
        label2.style({
            "font-family": component.style.font_family,
            "font-size": component.style.font_size,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "cursor": "move",
            "pointer-events": "all"
        });
        label.style({
            "font-family": component.style.font_family,
            "font-size": component.style.font_size,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "cursor": "move",
            "pointer-events": "all"
        });
        label2.style({ "fill": "none" });
        label.style({ "stroke": "none" });

        var textHeight = component.style.font_size;
        var dyMiddle = textHeight / 2 - textHeight * 0.15;
        var dyTop = textHeight - textHeight * 0.15;
        var dyBottom = -textHeight * 0.15;

        if(extent) {
            if(extent.type == "polyline") {
                var x1 = d3.min(extent.polyline.points, function(d) { return d.x; });
                var x2 = d3.max(extent.polyline.points, function(d) { return d.x; });
                var y1 = d3.min(extent.polyline.points, function(d) { return d.y; });
                var y2 = d3.max(extent.polyline.points, function(d) { return d.y; });
                extent = {
                    type: "rect",
                    rect: {
                        x1: x1, y1: y1,
                        x2: x2, y2: y2
                    }
                }
            }
            if(extent.type == "rect") {
                var align = component.anchor ? component.anchor.split(",") : ["m", "m"]
                var align_x = align[0];
                var align_y = align[1];

                var margin = 3;

                var dx = 0;
                var dy = 0;
                if(component.anchor_offset) {
                    dx = component.anchor_offset.x;
                    dy = component.anchor_offset.y;
                }

                var anchor_x = 0, anchor_y = 0;

                if(align_x == "rr") {
                    anchor_x = Math.max(extent.rect.x1, extent.rect.x2)
                    label.attr("x", dx + Math.max(extent.rect.x1, extent.rect.x2) + margin);
                    label.style("text-anchor", "start");
                    label2.attr("x", dx + Math.max(extent.rect.x1, extent.rect.x2) + margin);
                    label2.style("text-anchor", "start");
                }
                if(align_x == "r") {
                    anchor_x = Math.max(extent.rect.x1, extent.rect.x2)
                    label.attr("x", dx + Math.max(extent.rect.x1, extent.rect.x2) - margin);
                    label.style("text-anchor", "end");
                    label2.attr("x", dx + Math.max(extent.rect.x1, extent.rect.x2) - margin);
                    label2.style("text-anchor", "end");
                }
                if(align_x == "m") {
                    anchor_x = (extent.rect.x1 + extent.rect.x2) / 2;
                    label.attr("x", dx + (extent.rect.x1 + extent.rect.x2) / 2);
                    label.style("text-anchor", "middle");
                    label2.attr("x", dx + (extent.rect.x1 + extent.rect.x2) / 2);
                    label2.style("text-anchor", "middle");
                }
                if(align_x == "l") {
                    anchor_x = Math.min(extent.rect.x1, extent.rect.x2);
                    label.attr("x", dx + Math.min(extent.rect.x1, extent.rect.x2) + margin);
                    label.style("text-anchor", "start");
                    label2.attr("x", dx + Math.min(extent.rect.x1, extent.rect.x2) + margin);
                    label2.style("text-anchor", "start");
                }
                if(align_x == "ll") {
                    anchor_x = Math.min(extent.rect.x1, extent.rect.x2);
                    label.attr("x", dx + Math.min(extent.rect.x1, extent.rect.x2) - margin);
                    label.style("text-anchor", "end");
                    label2.attr("x", dx + Math.min(extent.rect.x1, extent.rect.x2) - margin);
                    label2.style("text-anchor", "end");
                }
                if(align_y == "bb") {
                    anchor_y = Math.max(extent.rect.y1, extent.rect.y2);
                    label.attr("y", dy + Math.max(extent.rect.y1, extent.rect.y2) + margin + dyTop);
                    label2.attr("y", dy + Math.max(extent.rect.y1, extent.rect.y2) + margin + dyTop);
                    // label.style("dominant-baseline", "text-before-edge");
                    // label2.style("dominant-baseline", "text-before-edge");
                }
                if(align_y == "b") {
                    anchor_y = Math.max(extent.rect.y1, extent.rect.y2);
                    label.attr("y", dy + Math.max(extent.rect.y1, extent.rect.y2) - margin + dyBottom);
                    label2.attr("y", dy + Math.max(extent.rect.y1, extent.rect.y2) - margin + dyBottom);
                    // label.style("dominant-baseline", "text-after-edge");
                    // label2.style("dominant-baseline", "text-after-edge");
                }
                if(align_y == "m") {
                    anchor_y = (extent.rect.y1 + extent.rect.y2) / 2;
                    label.attr("y", dy + (extent.rect.y1 + extent.rect.y2) / 2 + dyMiddle);
                    label2.attr("y", dy + (extent.rect.y1 + extent.rect.y2) / 2 + dyMiddle);
                    // label.style("dominant-baseline", "middle");
                    // label2.style("dominant-baseline", "middle");
                }
                if(align_y == "t") {
                    anchor_y = Math.min(extent.rect.y1, extent.rect.y2);
                    label.attr("y", dy + Math.min(extent.rect.y1, extent.rect.y2) + margin + dyTop);
                    label2.attr("y", dy + Math.min(extent.rect.y1, extent.rect.y2) + margin + dyTop);
                    // label.style("dominant-baseline", "text-before-edge");
                    // label2.style("dominant-baseline", "text-before-edge");
                }
                if(align_y == "tt") {
                    anchor_y = Math.min(extent.rect.y1, extent.rect.y2);
                    label.attr("y", dy + Math.min(extent.rect.y1, extent.rect.y2) - margin + dyBottom);
                    label2.attr("y", dy + Math.min(extent.rect.y1, extent.rect.y2) - margin + dyBottom);
                    // label.style("dominant-baseline", "text-after-edge");
                    // label2.style("dominant-baseline", "text-after-edge");
                }
            }
        } else {
            console.log("TODO: Unable to draw label without extent.");
            label.remove();
            label2.remove();
            // TODO...
        }

        if(label_line) {
            var commands = [];
            var bbox = label.node().getBBox();
            var y_line = bbox.y + bbox.height;
            if(anchor_y < bbox.y) {
                y_line = bbox.y;
            }
            commands.push(["M", anchor_x, anchor_y]);
            commands.push(["L", Math.max(bbox.x, Math.min(bbox.x + bbox.width, anchor_x)), y_line]);
            commands.push(["M", bbox.x, y_line]);
            commands.push(["L", bbox.x + bbox.width, y_line]);
            // console.log(points);
            label_line.attr("d", Geometry.Path.commands.apply(null, commands));
            label_line.style({
                "fill": "none",
                "stroke": component.style.fill,
                "stroke-linejoin": "round"
            });
        }


        if(RC.isEditing) {
            label.on("mousedown", function() {
                doStartPopout();

                var is_moved = false;
                var x0 = d3.event.pageX;
                var y0 = d3.event.pageY;
                var dx0 = 0;
                var dy0 = 0;
                if(component.anchor_offset) {
                    dx0 = component.anchor_offset.x;
                    dy0 = component.anchor_offset.y;
                }
                setupDragHandlers({
                    mousemove: function() {
                        is_moved = true;
                        var mdx = d3.event.pageX - x0;
                        var mdy = d3.event.pageY - y0;
                        component.anchor_offset = {
                            x: dx0 + mdx,
                            y: dy0 + mdy
                        };
                        DM.invalidate(annotation);
                        RC.validate();
                    },
                    mouseup: function() {
                        if(!is_moved) {
                            setupEasyExpressionEditor({
                                anchor: label.node(),
                                expression: component.text,
                                is_string_expression: true,
                                change: function(expr) {
                                    component.text = expr;
                                    DM.invalidate(annotation);
                                    RC.validate();
                                }
                            });
                        }
                        doStartPopout();
                    }
                });
            });
        }
    });
};

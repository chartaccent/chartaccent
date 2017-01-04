function MakeRectResizer(RC2, visible, uid, rect, onresize, onclick, is_back_layer) {
    var rect_bg = RC2.addElement("fg", "rect", "chartaccent-draghandle-range", uid + "-resize-bg");
    rect_bg.style({
        "stroke": "none",
        "fill": "none",
        "stroke-width": 5,
        "pointer-events": "none",
        "cursor": "move"
    });
    rect_bg.attr("x", Math.min(rect.x1, rect.x2));
    rect_bg.attr("y", Math.min(rect.y1, rect.y2));
    rect_bg.attr("width", Math.abs(rect.x1 - rect.x2));
    rect_bg.attr("height", Math.abs(rect.y1 - rect.y2));
    RC2.RC.addBubbleCursorItems(rect_bg, { cursor: "move", layer: is_back_layer ? -2 : 1 }, function() {
        onclick();
        var px0 = d3.event.pageX;
        var py0 = d3.event.pageY;
        setupDragHandlers({
            mousemove: function() {
                var px1 = d3.event.pageX;
                var py1 = d3.event.pageY;
                var dx = px1 - px0;
                var dy = py1 - py0;
                mouse_moved = true;
                onresize({
                    x1: rect.x1 + dx,
                    y1: rect.y1 + dy,
                    x2: rect.x2 + dx,
                    y2: rect.y2 + dy
                });
            },
            mouseup: function() {
                onclick();
            }
        });
    });

    var edges = [ [ [ 1, 1 ], [ 1, 2 ] ], [ [ 2, 2 ], [ 1, 2 ] ], [ [ 1, 2 ], [ 1, 1 ] ], [ [ 1, 2 ], [ 2, 2 ] ] ];
    var corners = [ [ 1, 1 ], [ 1, 2 ], [ 2, 1 ], [ 2, 2 ] ];
    var g_edges = RC2.addElement("fg", "g", undefined, uid + "-resize-edges");
    var g_corners = RC2.addElement("fg", "g", undefined, uid + "-resize-corners");
    var s_edges = g_edges.selectAll("line").data(edges);
    s_edges.enter().append("line");
    s_edges.attr("x1", function(d) { return rect["x" + d[0][0]]; })
           .attr("y1", function(d) { return rect["y" + d[1][0]]; })
           .attr("x2", function(d) { return rect["x" + d[0][1]]; })
           .attr("y2", function(d) { return rect["y" + d[1][1]]; })
           .classed("chartaccent-draghandle-line", true).style({
                "stroke": "none",
                "fill": "none",
                "stroke-width": 5,
                "pointer-events": "all",
                "cursor": function(d) { return d[0][0] != d[0][1] ? "ns-resize" : "ew-resize"; }
            })
           .on("mousedown", function(d) {
                onclick();
                var px0 = d3.event.pageX;
                var py0 = d3.event.pageY;
                setupDragHandlers({
                    mousemove: function() {
                        var px1 = d3.event.pageX;
                        var py1 = d3.event.pageY;
                        var dx = px1 - px0;
                        var dy = py1 - py0;
                        mouse_moved = true;
                        onresize({
                            x1: rect.x1 + ((d[0][0] == 1 && d[0][1] == 1) ? dx : 0),
                            y1: rect.y1 + ((d[1][0] == 1 && d[1][1] == 1) ? dy : 0),
                            x2: rect.x2 + ((d[0][0] == 2 && d[0][1] == 2) ? dx : 0),
                            y2: rect.y2 + ((d[1][0] == 2 && d[1][1] == 2) ? dy : 0)
                        });
                    },
                    mouseup: function() {
                        onclick();
                    }
                });
           });
    var s_corners = g_corners.selectAll("circle").data(corners);
    s_corners.enter().append("circle");
    s_corners
           .attr("cx", function(d) { return rect["x" + d[0]]; })
           .attr("cy", function(d) { return rect["y" + d[1]]; })
           .attr("r", 10)
           .classed("chartaccent-draghandle-range", true).style({
                "stroke": "none",
                "fill": "none",
                "pointer-events": "all",
                "cursor": function(d) {
                    function xor(a, b) {
                        return a ? !b : b;
                    }
                    var judge = xor(xor(rect.x1 < rect.x2, rect.y1 < rect.y2), xor(d[0] == 1, d[1] == 1));
                    return judge ? "nesw-resize" : "nwse-resize";
                }
            })
           .on("mousedown", function(d) {
                onclick();
                var px0 = d3.event.pageX;
                var py0 = d3.event.pageY;
                setupDragHandlers({
                    mousemove: function() {
                        var px1 = d3.event.pageX;
                        var py1 = d3.event.pageY;
                        var dx = px1 - px0;
                        var dy = py1 - py0;
                        mouse_moved = true;
                        onresize({
                            x1: rect.x1 + (d[0] == 1 ? dx : 0),
                            y1: rect.y1 + (d[1] == 1 ? dy : 0),
                            x2: rect.x2 + (d[0] == 2 ? dx : 0),
                            y2: rect.y2 + (d[1] == 2 ? dy : 0)
                        });
                    },
                    mouseup: function() {
                        onclick();
                    }
                });
           });
    if(visible) {
        s_corners.attr("r", 4);
        s_corners.style({
            "stroke": Colors.selection_hint_color,
            "stroke-width": 2,
            "fill": "none"
        });
    }
};

function MakeLineResizer(RC2, visible, uid, line, onresize, onclick) {
    var rect_bg = RC2.addElement("fg", "line", "chartaccent-draghandle-line", uid + "-resize-bg");
    rect_bg.style({
        "stroke": "none",
        "fill": "none",
        "stroke-width": 5,
        "pointer-events": "all",
        "cursor": "move"
    });
    rect_bg.attr("x1", line[0].x);
    rect_bg.attr("y1", line[0].y);
    rect_bg.attr("x2", line[1].x);
    rect_bg.attr("y2", line[1].y);
    rect_bg.on("mousedown", function() {
        onclick();
        var px0 = d3.event.pageX;
        var py0 = d3.event.pageY;
        setupDragHandlers({
            mousemove: function() {
                var px1 = d3.event.pageX;
                var py1 = d3.event.pageY;
                var dx = px1 - px0;
                var dy = py1 - py0;
                mouse_moved = true;
                onresize([
                    { x: line[0].x + dx, y: line[0].y + dy },
                    { x: line[1].x + dx, y: line[1].y + dy }
                ]);
            },
            mouseup: function() {
                onclick();
            }
        });
    });
    var corners = [ [ 0, 0 ], [ 1, 1 ] ];
    var g_corners = RC2.addElement("fg", "g", undefined, uid + "-resize-corners");
    var s_corners = g_corners.selectAll("circle").data(corners);
    s_corners.enter().append("circle");
    s_corners
           .attr("cx", function(d) { return line[d[0]].x; })
           .attr("cy", function(d) { return line[d[0]].y; })
           .attr("r", 10)
           .classed("chartaccent-draghandle-range", true).style({
                "stroke": "none",
                "fill": "none",
                "pointer-events": "all",
                "cursor": function(d) {
                    function xor(a, b) {
                        return a ? !b : b;
                    }
                    var judge = xor(xor(line[0].x < line[1].x, line[0].y < line[1].y), xor(d[0] == 1, d[1] == 1));
                    return judge ? "nesw-resize" : "nwse-resize";
                }
            })
           .on("mousedown", function(d) {
                onclick();
                var px0 = d3.event.pageX;
                var py0 = d3.event.pageY;
                setupDragHandlers({
                    mousemove: function() {
                        var px1 = d3.event.pageX;
                        var py1 = d3.event.pageY;
                        var dx = px1 - px0;
                        var dy = py1 - py0;
                        mouse_moved = true;
                        onresize(line.map(function(p, i) {
                            return {
                                x: d[0] == i ? p.x + dx : p.x,
                                y: d[1] == i ? p.y + dy : p.y
                            };
                        }));
                    },
                    mouseup: function() {
                        onclick();
                    }
                });
           });
    if(visible) {
        s_corners.attr("r", 4);
        s_corners.style({
            "stroke": Colors.selection_hint_color,
            "stroke-width": 2,
            "fill": "none"
        });
    }
};

Annotation.prototype.renderComponentShape = function(RC, RC2, component) {
    if(!this.visible || !component.visible) return;
    var self = this;
    if(component.type == "shape.rect") {
        var rect = RC2.addElement("fg", "rect", undefined, getObjectUniqueID(component));
        rect.attr("x", Math.min(this.target.rect.x1, this.target.rect.x2));
        rect.attr("y", Math.min(this.target.rect.y1, this.target.rect.y2));
        rect.attr("width", Math.abs(this.target.rect.x1 - this.target.rect.x2));
        rect.attr("height", Math.abs(this.target.rect.y1 - this.target.rect.y2));
        rect.style("pointer-events", "none");
        rect.call(function() { Styles.applyStyle(component.style, this); })

        if(RC.isEditing) {
            MakeRectResizer(RC2, RC.isSelected(this), getObjectUniqueID(component), this.target.rect, function(newrect) {
                self.target.rect = newrect;
                DM.invalidate(self);
                RC.validate();
            }, RC2.startPopoutEditor.bind(RC2));
        }
    }
    if(component.type == "shape.oval") {
        var rect = RC2.addElement("fg", "ellipse", undefined, getObjectUniqueID(component));
        rect.attr("cx", (this.target.rect.x1 + this.target.rect.x2) / 2);
        rect.attr("cy", (this.target.rect.y1 + this.target.rect.y2) / 2);
        rect.attr("rx", Math.abs(this.target.rect.x1 - this.target.rect.x2) / 2);
        rect.attr("ry", Math.abs(this.target.rect.y1 - this.target.rect.y2) / 2);
        rect.style("pointer-events", "none");
        rect.call(function() { Styles.applyStyle(component.style, this); })

        if(RC.isEditing) {
            MakeRectResizer(RC2, RC.isSelected(this), getObjectUniqueID(component), this.target.rect, function(newrect) {
                self.target.rect = newrect;
                DM.invalidate(self);
                RC.validate();
            }, RC2.startPopoutEditor.bind(RC2));
        }
    }
    if(component.type == "shape.image") {
        var image = RC2.addElement("bg2", "image", undefined, getObjectUniqueID(component));
        image.attr("x", Math.min(this.target.rect.x1, this.target.rect.x2));
        image.attr("y", Math.min(this.target.rect.y1, this.target.rect.y2));
        image.attr("width", Math.abs(this.target.rect.x1 - this.target.rect.x2));
        image.attr("height", Math.abs(this.target.rect.y1 - this.target.rect.y2));
        image.style("pointer-events", "none");
        if(image.attr("xlink:href") != component.image) {
            image.attr("xlink:href", component.image);
        }
        if(component.meet_or_slice == "slice") {
            image.attr("preserveAspectRatio", "xMidYMid slice");
        } else {
            image.attr("preserveAspectRatio", "xMidYMid meet");
        }
        image.style("opacity", component.opacity);
        if(RC.isEditing) {
            MakeRectResizer(RC2, RC.isSelected(this), getObjectUniqueID(component), this.target.rect, function(newrect) {
                self.target.rect = newrect;
                DM.invalidate(self);
                RC.validate();
            }, RC2.startPopoutEditor.bind(RC2), true);
        }
    }
    if(component.type == "shape.line") {
        var line = RC2.addElement("fg", "line", undefined, getObjectUniqueID(component));
        line.attr("x1", this.target.line[0].x);
        line.attr("y1", this.target.line[0].y);
        line.attr("x2", this.target.line[1].x);
        line.attr("y2", this.target.line[1].y);
        line.call(function() { Styles.applyStyle(component.style, this); })
        line.style({
            "stroke-linecap": "round"
        });
        if(component.arrow.indexOf(">") >= 0) {
            var arrowhead = RC2.addElement("fg", "path", undefined, getObjectUniqueID(component) + "-arrow-1");
            var p1 = new Geometry.Vector(this.target.line[0].x, this.target.line[0].y);
            var p2 = new Geometry.Vector(this.target.line[1].x, this.target.line[1].y);
            var p1_p2 = p1.sub(p2);
            var arrow_size = component.style.stroke_width * component.arrow_size;
            arrowhead.attr("d", Geometry.Path.arrow(arrow_size, p1, p2));
            var adjusted_p2 = p2.add(p1_p2.scale((arrow_size - 1) / p1_p2.length()));
            line.attr("x2", adjusted_p2.x);
            line.attr("y2", adjusted_p2.y);
            arrowhead.style({
                "fill": component.style.stroke != null ? component.style.stroke : "none",
                "stroke": "none"
            });
        }
        if(component.arrow.indexOf("<") >= 0) {
            var arrowhead = RC2.addElement("fg", "path", undefined, getObjectUniqueID(component) + "-arrow-2");
            var p1 = new Geometry.Vector(this.target.line[0].x, this.target.line[0].y);
            var p2 = new Geometry.Vector(this.target.line[1].x, this.target.line[1].y);
            var p2_p1 = p2.sub(p1);
            var arrow_size = component.style.stroke_width * component.arrow_size;
            arrowhead.attr("d", Geometry.Path.arrow(arrow_size, p2, p1));
            var adjusted_p1 = p1.add(p2_p1.scale((arrow_size - 1) / p2_p1.length()));
            line.attr("x1", adjusted_p1.x);
            line.attr("y1", adjusted_p1.y);
            arrowhead.style({
                "fill": component.style.stroke != null ? component.style.stroke : "none",
                "stroke": "none"
            });
        }
        if(RC.isEditing) {
            MakeLineResizer(RC2, RC.isSelected(this), getObjectUniqueID(component), this.target.line, function(newline) {
                self.target.line = newline;
                DM.invalidate(self);
                RC.validate();
            }, RC2.startPopoutEditor.bind(RC2));
        }
    }
}

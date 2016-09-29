import "elements/elements.js";
import "bubblecursor.js";

var ChartRepresentation = function(owner, info) {
    var self = this;

    this.owner = owner;

    this.undo_history = [];
    this.redo_history = [];

    this.layer_annotation = owner.layer_annotation.append("g")
    .attr("transform", "translate(" + info.bounds.origin_x + "," + info.bounds.origin_y + ")");

    this.layer_background = owner.layer_background.append("g")
    .attr("transform", "translate(" + info.bounds.origin_x + "," + info.bounds.origin_y + ")");

    if(owner.panel) {
        if(owner.toolbar) {
            this.toolbar = owner.toolbar.append("chartaccent-toolbar");
        } else {
            this.toolbar = owner.panel.append("chartaccent-toolbar");
        }
        this.panel = owner.panel.append("chartaccent-panel");

        this.panel_controls_tree = appendTreeOnce(this.toolbar.append("span"), [
            [ "span", { classed: { "group": true } }, [
                [ "span.btn", { $: "btn_undo", classed: { "btn-toggle": true, "chartaccent-export-button": true } }, [ IconFont.iconDesc("undo"), [ "span", { text: " Undo" } ] ] ],
                [ "span", { text: " " } ],
                [ "span.btn", { $: "btn_redo", classed: { "btn-toggle": true, "chartaccent-export-button": true } }, [ IconFont.iconDesc("redo"), [ "span", { text: " Redo" } ] ] ]
                // [ "span", { text: " " } ],
                // [ "span.btn", { $: "btn_reset", classed: { "btn-toggle": true, "chartaccent-export-button": true }, text: "Reset" } ]
            ]]
        ]);

        this.toolbar.append("span").classed("sep", true);

        this.panel_shapes_tree = appendTreeOnce(this.toolbar.append("span"), [
            [ "span", { classed: { "group": true } }, [
                [ "span.btn", { $: "add_line", classed: { "btn-toggle": true } }, [ IconFont.iconDesc("shape-line") ] ],
                [ "span", { text: " " } ],
                [ "span.btn", { $: "add_arrow", classed: { "btn-toggle": true } }, [ IconFont.iconDesc("shape-arrow") ] ],
                [ "span", { text: " " } ],
                [ "span.btn", { $: "add_oval", classed: { "btn-toggle": true } }, [ IconFont.iconDesc("shape-oval") ] ],
                [ "span", { text: " " } ],
                [ "span.btn", { $: "add_rect", classed: { "btn-toggle": true } }, [ IconFont.iconDesc("shape-rect") ] ],
                [ "span", { text: " " } ],
                [ "span.btn", { $: "add_text", classed: { "btn-toggle": true } }, [ IconFont.iconDesc("shape-label") ] ],
                [ "span", { text: " " } ],
                [ "span.btn", { $: "add_image", classed: { "btn-toggle": true } }, [ IconFont.iconDesc("shape-image") ] ],
                [ "span", { text: " " } ],
                [ "input", { $: "input_file", attr: { type: "file" }, style: { display: "none" } } ]
                // [ "span.btn", { $: "export_image", classed: { "btn-toggle": true, "chartaccent-export-button": true }, text: "Export" } ]
                // [ "span.btn", { $: "export_image_svg", classed: { "btn-toggle": true, "chartaccent-export-button": true }, text: "ExportSVG" } ]
            ]]
        ]);
        var input_file_node = this.panel_shapes_tree.input_file.node();

        self.panel_controls_tree["btn_undo"].on("click", function() {
            self.undo();
        });
        self.panel_controls_tree["btn_redo"].on("click", function() {
            self.redo();
        });
        if(self.panel_controls_tree["btn_reset"]) {
            self.panel_controls_tree["btn_reset"].on("click", function() {
                self.reset();
            });
        }

        ["line", "text", "arrow", "rect", "oval", "image"].forEach(function(type) {
            self.panel_shapes_tree["add_" + type].on("click", function(d) {
                if(type == "image") {
                    input_file_node.value = "";
                    input_file_node.onchange = function() {
                        var file = input_file_node.files[0];
                        if(!file) return;
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            var content = e.target.result;
                            self.current_creating_image = content;
                            self.current_creating_shape = "image";
                            self.rect_interaction.style("cursor", "crosshair");
                            self.panel_shapes_tree["add_" + type].classed("active", true);
                        }
                        reader.readAsDataURL(file);
                    };
                    input_file_node.click();
                } else {
                    self.current_creating_shape = type;
                    self.rect_interaction.style("cursor", "crosshair");
                    self.panel_shapes_tree["add_" + type].classed("active", true);
                }
            });
        });

        if(this.panel_shapes_tree.export_image) {
            this.panel_shapes_tree.export_image.on("click", function() {
                self.owner.getImageDataURL("image/png", 4, function(url) {
                    var a = d3.select("body").append("a").attr("href", url).attr("target", "_blank").attr("download", self.owner.export_name ? self.owner.export_name : "chart-accent.png");
                    a.node().click();
                    a.remove();
                });
            });
        }
        // this.panel_shapes_tree.export_image_svg.on("click", function() {
        //     var url = self.owner.getSVGDataURL();
        //     var a = d3.select("body").append("a").attr("href", url).attr("target", "_blank").attr("download", self.owner.export_name ? self.owner.export_name : "chart-accent.png");
        //     a.node().click();
        //     a.remove();
        // });
        // MakeSingleSelectButton(this.panel_shapes_tree.add_shape, "Add Shape", [
        //     { name: "Arrow", value: "arrow" },
        //     { name: "Rectangle", value: "rect" },
        //     { name: "Image", value: "image" }
        // ], function(value) {
        //     self.current_creating_shape = value;
        //     self.panel_shapes_tree.add_shape.select("span.btn").classed("active", true);
        // }, null);


        this.panel.append("header").call(IconFont.addIcon("annotation")).append("span").text(" Annotations");
        this.panel_annotations = this.panel.append("section").classed("annotations", true);
        this.panel.append("header").call(IconFont.addIcon("edit")).append("span").text(" Editor");
        this.panel_editor = this.panel.append("section").classed("editor", true);
    }

    this.createSVGDefs(this.layer_annotation);

    if(info.palette) {
        this.palette = info.palette.map(function(d) { return new RGBColor(d); });
    }

    var rect_interaction = this.layer_annotation.append("rect")
    .attr({
        x: info.bounds.x - info.bounds.origin_x,
        y: info.bounds.y - info.bounds.origin_y,
        width: info.bounds.width,
        height: info.bounds.height
    })
    .style({
        "fill": "none",
        // "stroke": "#CCC",
        "stroke-width": "1",
        "pointer-events": "all"
    });

    this.rect_interaction = rect_interaction;

    rect_interaction
    .on("mousemove", function() {
        if(!self.is_creating) {
            self._RenderHint(d3.event.clientX, d3.event.clientY);
        }
        // d3.select(this).style("stroke-width", 3);
    })
    // .on("mouseover", function() {
    //     if(!self.is_creating) {
    //         self._RenderHint(d3.event.clientX, d3.event.clientY);
    //     }
    // })
    .on("mouseout", function() {
        if(!self.is_creating) {
            self._RenderHint();
        }
        // d3.select(this).style("stroke-width", 1);
    })
    .on("mousedown", function() {
        self._BeginCreation(d3.event.clientX, d3.event.clientY);
    });

    this.layers = {
        bg2: this.layer_background.append("g"),
        bg: this.layer_background.append("g"),
        fg: this.layer_annotation.append("g"),
        fg2: this.layer_annotation.append("g"),
        owner2id: new Map(),
        add: function(layer, owner, type, classname, unique_id) {
            var make_last_child = function(sel) {
                sel.node().parentNode.appendChild(sel.node());
                return sel;
            }
            var id = getObjectUniqueID(owner);
            this.owner2id.set(owner, id);
            if(!unique_id) {
                if(!classname) {
                    var sel = this[layer].select(type + "." + id);
                    if(!sel.empty()) return make_last_child(sel);
                    return this[layer].append(type).classed(id, true);
                } else {
                    var sel = this[layer].select(type + "." + id + "." + classname);
                    if(!sel.empty()) return make_last_child(sel);
                    return this[layer].append(type).classed(id, true).classed(classname, true);
                }
            } else {
                if(!classname) {
                    var sel = this[layer].select(type + "." + id + '[data-cauid="' + unique_id + '"]');
                    if(!sel.empty()) return make_last_child(sel);
                    return this[layer].append(type).classed(id, true).attr("data-cauid", unique_id);
                } else {
                    var sel = this[layer].select(type + "." + id + "." + classname + '[data-cauid="' + unique_id + '"]');
                    if(!sel.empty()) return make_last_child(sel);
                    return this[layer].append(type).classed(id, true).classed(classname, true).attr("data-cauid", unique_id);
                }
            }
        },
        getAll: function(layer, owner) {
            var id = this.owner2id.get(owner);
            if(id) {
                return this[layer].selectAll("." + id);
            } else {
                return null;
            }
        },
        cleanup: function(owners) {
            var set = new Set(owners);
            this.owner2id.forEach(function(id, obj) {
                if(!set.has(obj)) {
                    this.bg2.selectAll("." + id).remove();
                    this.bg.selectAll("." + id).remove();
                    this.fg.selectAll("." + id).remove();
                    this.fg2.selectAll("." + id).remove();
                    this.owner2id.delete(obj);
                }
            }.bind(this));
        }
    };

    this.layer_hint = this.layer_annotation.append("g")
        .style({
            "pointer-events": "none"
        });

    this.bounds = info.bounds;
    this.default_lasso_label = info.default_lasso_label == "per-item" ? "item-label" : "label";
    this.default_lasso_label_expression = info.default_lasso_label_expression;

    this.default_lasso_label = "item-label";
    this.default_lasso_label_expression = 'value';

    var context_items = { };
    if(info.tables) {
        info.tables.forEach(function(table) {
            context_items[table.name] = table.data;
            if(table.isDefault) context_items["data"] = table.data;
        });
    }

    // Chart specific functions.
    context_items.annotation = function(args, kwargs) {
        var a = self.getAnnotationByID(args[0]);
        return a;
    };

    this.context = Expression.CreateContext(context_items);

    if(info.cartesian_scales) {
        this.cartesian_scales = info.cartesian_scales;
        this.coordinate_system = "cartesian";
    }

    if(info.selection_mode) {
        this.selection_mode = info.selection_mode;
    } else {
        this.selection_mode = "marquee";
    }

    this.rendered_annotations = {
        validate: function() {
            self._RenderAnnotations();
        }
    };
    this.render_context = {
        owner: this,
        context: self.context,
        layers: self.layers,
        isEditing: true,
        validate: function() {
            DM.validate(self.rendered_annotations);
        },
        removeAnnotation: function(annotation) {
            self.removeAnnotation(annotation)
        },
        hasSelection: function() {
            return !!self.editing_annotation;
        },
        isSelected: function(annotation) {
            return self.editing_annotation == annotation;
        },
        isSelectionInAnnotation: function(annotation) {
            if(!self.editing_annotation) return false;
            if(self.editing_annotation == annotation) return true;
            function getItems(annotation) {
                var result = new Set();
                annotation.forEachElementsItem(self.render_context, function(elements, item) {
                    result.add(item);
                });
                return result;
            }
            var editing_items = getItems(self.editing_annotation);
            var annotation_items = getItems(annotation);
            // console.log(editing_items, annotation_items);
            return Array.from(editing_items).every(function(item) {
                return annotation_items.has(item);
            });
        },
        addBubbleCursorItems: function(selection, cursor, onmousedown) {
            self._addBubbleCursorItems(selection, cursor, onmousedown);
        }
    };

    this.tables = info.tables;
    this.annotations = [];
    this.annotations_idmap = new Map();
    this.chart_elements = [];
    this.bubble_cursor_items = new BubbleCursorManager(this.owner.svg, this.layer_annotation.node());

    this.setEditingAnnotation(null);
    this._RenderAnnotations();
};

ChartRepresentation.prototype.CreateSVGPoint = function(x, y) {
    var p = this.owner.svg.createSVGPoint();
    p.x = x; p.y = y;
    return p;
};

ChartRepresentation.prototype._clearBubbleCursorItems = function() {
    this.bubble_cursor_items.clear();
};
ChartRepresentation.prototype._addBubbleCursorItems = function(selection, cursor, onmousedown) {
    this.bubble_cursor_items.add(selection, cursor, onmousedown);
};

ChartRepresentation.prototype._RenderHint = function(x, y) {
    this.layer_hint.selectAll("*").remove();
    if(x === undefined || y === undefined) return;
    if(this.current_creating_shape) {
        return;
    }

    var root_matrix = this.layer_annotation.node().getScreenCTM();
    var root_matrix_inverse = root_matrix.inverse();
    var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);

    var min_s = null;
    this.chart_elements.forEach(function(content) {
        var s = content.select(pt);
        if(s) {
            if(min_s === null || min_s.selection.distance > s.distance) {
                min_s = { content: content, selection: s };
            }
        }
    });

    var min_b = this.bubble_cursor_items.find(pt);
    if(min_s && min_b) {
        if(min_b.distance < min_s.selection.distance || min_b.distance == min_s.selection.distance && min_b.layer > 0) {
            min_s = null;
        } else {
            min_b = null;
        }
    }

    if(min_s) {
        min_s.content.render(this.layer_hint, min_s.selection)
        this.current_selection = min_s;
        this.rect_interaction.style("cursor", "pointer");
    } else {
        this.current_selection = null;
        this.rect_interaction.style("cursor", "default");
    }
    if(min_b) {
        this.current_selection = null;
        this.rect_interaction.style("cursor", min_b.cursor ? min_b.cursor : "default");
    }
};

ChartRepresentation.prototype._BeginCreationShape = function(shape, x, y) {
    var self = this;
    var root_matrix = this.layer_annotation.node().getScreenCTM();
    var root_matrix_inverse = root_matrix.inverse();
    var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);
    var pt0 = pt;

    if(shape == "text") {
        var render_hint = function(p1, p2) {
            appendOnlyOnce(self.layer_hint, "rect")
                .attr("x", Math.min(p1.x, p2.x)).attr("y", Math.min(p1.y, p2.y))
                .attr("width", Math.abs(p1.x - p2.x)).attr("height", Math.abs(p1.y - p2.y))
                .style({
                    "stroke-width": 2,
                    "stroke": Colors.selection_hint_color,
                    "fill": Colors.selection_hint_color,
                    "fill-opacity": 0.2
                });
        };
        var do_create = function(p1, p2, is_moved) {
            if(!is_moved) {
                self.addAnnotation(new Annotation({
                    target: {
                        type: "freeform",
                        point: { x: p2.x, y: p2.y }
                    },
                    components: [
                        { type: "label",
                          _show_expression_editor: true,
                          anchor: "m,m",
                          text: Expression.parseStringExpression("Text"),
                          style: Styles.createDefault("label")
                        }
                    ]
                }));
            } else {
                self.addAnnotation(new Annotation({
                    target: {
                        type: "freeform",
                        rect: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
                    },
                    components: [
                        { visible: true,
                          _show_expression_editor: true,
                          type: "label",
                          anchor: "m,m",
                          text: Expression.parseStringExpression("Text"),
                          style: Styles.createDefault("label")
                        },
                        { type: "shape.rect",
                          style: Styles.createDefault("shape.rect")
                        }
                    ]
                }));
            }
        };
    }
    if(shape == "rect" || shape == "oval" || shape == "image") {
        var render_hint = function(p1, p2) {
            if(shape == "oval") {
                appendOnlyOnce(self.layer_hint, "ellipse")
                    .attr("cx", (p1.x + p2.x) / 2).attr("cy", (p1.y + p2.y) / 2)
                    .attr("rx", Math.abs(p1.x - p2.x) / 2).attr("ry", Math.abs(p1.y - p2.y) / 2)
                    .style({
                        "stroke-width": 2,
                        "stroke": Colors.selection_hint_color,
                        "fill": Colors.selection_hint_color,
                        "fill-opacity": 0.2
                    });
            } else {
                appendOnlyOnce(self.layer_hint, "rect")
                    .attr("x", Math.min(p1.x, p2.x)).attr("y", Math.min(p1.y, p2.y))
                    .attr("width", Math.abs(p1.x - p2.x)).attr("height", Math.abs(p1.y - p2.y))
                    .style({
                        "stroke-width": 2,
                        "stroke": Colors.selection_hint_color,
                        "fill": Colors.selection_hint_color,
                        "fill-opacity": 0.2
                    });
            }
        };
        var do_create = function(p1, p2) {
            if(shape == "rect") {
                self.addAnnotation(new Annotation({
                    target: {
                        type: "freeform",
                        rect: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
                    },
                    components: [
                        { visible: false,
                          type: "label",
                          anchor: "m,m",
                          text: Expression.parseStringExpression("Text"),
                          style: Styles.createDefault("label")
                        },
                        { type: "shape.rect",
                          style: Styles.createDefault("shape.rect")
                        }
                    ]
                }));
            }
            if(shape == "oval") {
                self.addAnnotation(new Annotation({
                    target: {
                        type: "freeform",
                        rect: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
                    },
                    components: [
                        { visible: false,
                          type: "label",
                          anchor: "m,m",
                          text: Expression.parseStringExpression("Text"),
                          style: Styles.createDefault("label")
                        },
                        { type: "shape.oval",
                          style: Styles.createDefault("shape.oval")
                        }
                    ]
                }));
            }
            if(shape == "image") {
                self.addAnnotation(new Annotation({
                    target: {
                        type: "freeform",
                        rect: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
                    },
                    components: [
                        { visible: false,
                          type: "label",
                          anchor: "m,m",
                          text: Expression.parseStringExpression("Text"),
                          style: Styles.createDefault("label")
                        },
                        { type: "shape.image",
                          image: self.current_creating_image,
                          opacity: 1.0
                        }
                    ]
                }));
            }
        };
    }
    if(shape == "arrow" || shape == "line") {
        var render_hint = function(p1, p2) {
            appendOnlyOnce(self.layer_hint, "line")
                .attr("x1", p1.x).attr("y1", p1.y)
                .attr("x2", p2.x).attr("y2", p2.y)
                .style({
                    "stroke-width": 2,
                    "stroke": Colors.selection_hint_color,
                    "fill": "none"
                });
        };
        var do_create = function(p1, p2) {
            if(!p1 || !p2 || (p1.x == p2.x && p1.y == p2.y)) return;
            self.addAnnotation(new Annotation({
                target: {
                    type: "freeform",
                    line: [
                        { x: p1.x, y: p1.y },
                        { x: p2.x, y: p2.y }
                    ]
                },
                components: [
                    { type: "shape.line",
                      style: Styles.createDefault("shape.line"),
                      arrow: shape == "line" ? "" : ">",
                      arrow_size: 5
                    }
                ]
            }));
        };
    }

    this.is_creating = true;
    var is_moved = false;
    setupDragHandlers({
        mousemove: function() {
            var x = d3.event.clientX;
            var y = d3.event.clientY;
            var root_matrix = this.layer_annotation.node().getScreenCTM();
            var root_matrix_inverse = root_matrix.inverse();
            var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);
            is_moved = true;
            render_hint(pt0, pt);
        }.bind(this),
        mouseup: function() {
            var x = d3.event.clientX;
            var y = d3.event.clientY;
            var root_matrix = this.layer_annotation.node().getScreenCTM();
            var root_matrix_inverse = root_matrix.inverse();
            var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);
            this.is_creating = false;
            this.layer_hint.selectAll("*").remove();
            this.panel_shapes_tree.add_text.classed("active", false);
            this.panel_shapes_tree.add_rect.classed("active", false);
            this.panel_shapes_tree.add_oval.classed("active", false);
            this.panel_shapes_tree.add_line.classed("active", false);
            this.panel_shapes_tree.add_arrow.classed("active", false);
            this.panel_shapes_tree.add_image.classed("active", false);
            do_create(pt0, pt, is_moved);
        }.bind(this)
    });
};

ChartRepresentation.prototype._BeginCreation = function(x, y) {
    this.layer_hint.selectAll("*").remove();
    if(x === undefined || y === undefined) return;

    if(this.current_creating_shape) {
        var shape = this.current_creating_shape;
        this.current_creating_shape = undefined;
        return this._BeginCreationShape(shape, x, y);
    }

    var root_matrix = this.layer_annotation.node().getScreenCTM();
    var root_matrix_inverse = root_matrix.inverse();
    var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);
    var pt0 = pt;

    var min_s = null;
    this.chart_elements.forEach(function(content) {
        var s = content.select(pt);
        if(s) {
            if(min_s === null || min_s.selection.distance > s.distance) {
                min_s = { content: content, selection: s };
            }
        }
    });
    var min_b = this.bubble_cursor_items.find(pt);
    if(min_s && min_b) {
        if(min_b.distance < min_s.selection.distance || min_b.distance == min_s.selection.distance && min_b.layer > 0) {
            min_s = null;
        } else {
            min_b = null;
        }
    }
    if(min_s && min_s.content.beginCreation) {
        var context = min_s.content.beginCreation(this.layer_hint, min_s.selection, function(annotation) {
            this.addAnnotationIfFoundSelect(annotation);
        }.bind(this));
    } else {
        var lasso = [ pt0 ];
    }
    if(min_b) {
        min_b.onmousedown();
        return;
    }


    // var lasso_enforce_rectangle = this.selection_mode == "marquee";
    var lasso_enforce_rectangle = !d3.event.altKey;

    var lasso_path = null;
    var lasso_g = null;
    var render_lasso = function() {
        if(lasso.length >= 2) {
            if(!lasso_path) {
                lasso_g = this.layer_hint.append("g");
                lasso_path = this.layer_hint.append("path");
            }
            lasso_path.style({
                "stroke": Colors.selection_hint_color,
                "fill": Colors.selection_hint_color,
                "fill-opacity": 0.1,
                "stroke-width": 2,
                "stroke-linejoin": "round"
            });
            var lasso_shape = lasso;
            if(lasso_enforce_rectangle) {
                var l = lasso.length - 1;
                lasso_shape = [
                    new Geometry.Vector(lasso[0].x, lasso[0].y),
                    new Geometry.Vector(lasso[0].x, lasso[l].y),
                    new Geometry.Vector(lasso[l].x, lasso[l].y),
                    new Geometry.Vector(lasso[l].x, lasso[0].y)
                ];
            }
            lasso_path.attr("d", Geometry.Path.polylineClosed.apply(Geometry.Path, lasso_shape));
            this.chart_elements.forEach(function(elements) {
                if(elements.lassoSelect) {
                    var selection = elements.lassoSelect(lasso_shape);
                    var sel = lasso_g.selectAll("g." + getObjectUniqueID(elements)).data(selection ? [ 0 ] : []);
                    sel.enter().append("g").attr("class", getObjectUniqueID(elements));
                    sel.exit().remove();
                    if(selection) {
                        elements.render(sel, selection);
                    }
                }
            }.bind(this));
        }
    }.bind(this);

    var lasso_selection = function() {
        var lasso_shape = lasso;
        if(lasso_enforce_rectangle) {
            var l = lasso.length - 1;
            lasso_shape = [
                new Geometry.Vector(lasso[0].x, lasso[0].y),
                new Geometry.Vector(lasso[0].x, lasso[l].y),
                new Geometry.Vector(lasso[l].x, lasso[l].y),
                new Geometry.Vector(lasso[l].x, lasso[0].y)
            ];
        }
        var target_items = [];
        this.chart_elements.forEach(function(elements) {
            if(elements.lassoSelect) {
                var selection = elements.lassoSelect(lasso_shape);
                if(selection && elements.getItemsWithLasso) {
                    var items = elements.getItemsWithLasso(selection);
                    if(items.length > 0) {
                        target_items.push({
                            elements: elements,
                            items: items
                        });
                    }
                }
            }
        }.bind(this));
        if(target_items.length > 0) {
            if(this.addItemsToCurrentAnnotation(target_items)) {
                return;
            }
            if(target_items.length == 1 && target_items[0].items.length == 1) {
                var new_annotation = new Annotation({
                    target: {
                        type: "items",
                        items: target_items
                    },
                    components: [
                        {
                            type: "item-label",
                            text: Expression.parse(this.default_lasso_label_expression ? this.default_lasso_label_expression : "value"),
                            anchor: "m,tt",
                            style: Styles.createDefault("item-label")
                        },
                        {
                            type: "highlight",
                            style: Styles.createDefault("highlight")
                        }
                    ]
                });
            } else {
                var bubbleset_enabled = target_items.every(function(d) {
                    return d.elements.bubbleset !== undefined;
                });
                var bubbleset_on = bubbleset_enabled && target_items.some(function(d) {
                    return d.elements.bubbleset == "default-on";
                });
                var components = [
                    {
                        type: this.default_lasso_label,
                        text: this.default_lasso_label == "label" ? Expression.parse('"Group"') : Expression.parse(this.default_lasso_label_expression ? this.default_lasso_label_expression : "value"),
                        anchor: "m,tt",
                        style: Styles.createDefault(this.default_lasso_label)
                    },
                    {
                        type: "highlight",
                        style: Styles.createDefault("highlight")
                    }
                ];
                if(bubbleset_enabled) {
                    components.push({
                        visible: false,
                        type: "bubbleset",
                        style: Styles.createDefault("bubbleset")
                    });
                }
                var new_annotation = new Annotation({
                    target: {
                        type: "items",
                        items: target_items
                    },
                    components: components
                });
            }
            this.addAnnotationIfFoundSelect(new_annotation);
        }
    }.bind(this);

    this.is_creating = true;
    setupDragHandlers({
        mousemove: function() {
            var x = d3.event.clientX;
            var y = d3.event.clientY;
            var root_matrix = this.layer_annotation.node().getScreenCTM();
            var root_matrix_inverse = root_matrix.inverse();
            var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);
            if(!lasso && context && context.isClickOnly) {
                // Mouse moved but context only accept clicks, switch to lasso.
                lasso = [ pt0 ];
                context = null;
            }
            if(context) {
                if(context.mousemove) context.mousemove(pt);
            }
            if(lasso) {
                lasso.push(pt);
                render_lasso();
            }
        }.bind(this),
        mouseup: function() {
            var x = d3.event.clientX;
            var y = d3.event.clientY;
            var root_matrix = this.layer_annotation.node().getScreenCTM();
            var root_matrix_inverse = root_matrix.inverse();
            var pt = this.CreateSVGPoint(x, y).matrixTransform(root_matrix_inverse);
            if(context) {
                if(context.mouseup) context.mouseup(pt);
            }
            if(lasso) {
                lasso_selection();
                if(lasso_path) lasso_path.remove();
                if(lasso_g) lasso_g.remove();
            }
            this.is_creating = false;
            this.layer_hint.selectAll("*").remove();
        }.bind(this)
    });
};

ChartRepresentation.prototype._RenderAnnotations = function() {
    var self = this;
    this._clearBubbleCursorItems();
    self.layers.cleanup(this.annotations);

    this.annotations.forEach(function(annotation) {
        try {
            annotation.render(self.render_context);
        } catch(e) {
            console.log(e.stack);
        }
    });

    this.chart_elements.forEach(function(element) {
        if(element.renderGuides) element.renderGuides(self.render_context);
    });

    this._RenderAnnotationList();

    this.saveStateForUndo();
};
ChartRepresentation.prototype._RenderAnnotationList = function() {
    var self = this;
    var non_freeform_annotations = this.annotations.filter(function(d) {
        return d.target.type != "freeform";
    });

    if(!this.panel) return;

    var sel_nothing = this.panel_annotations.selectAll("p.nothing").data(non_freeform_annotations.length == 0 ? [ 0 ] : []);
    sel_nothing.enter().append("p").attr("class", "nothing").text("(none)");
    sel_nothing.exit().remove();


    var divs = appendOnlyOnce(this.panel_annotations, "div").selectAll("div.annotation").data(non_freeform_annotations);
    divs.enter().append("div").attr("class", "annotation");
    divs.exit().remove();

    divs.on("mousedown", function(my_annotation, my_index) {
        self.setEditingAnnotation(my_annotation);
        var existing_list = self.annotations.slice();
        var bounds = [];
        divs.each(function(annotation, index) {
            var rect = this.getBoundingClientRect();
            bounds.push([ annotation, rect.top, rect.bottom ]);
        });
        setupDragHandlers({
            mousemove: function() {
                var dist_min = null, index_min = null;
                var index_min = null;
                var y_cursor = d3.event.clientY;
                bounds.forEach(function(d, index) {
                    if(dist_min === null || Math.abs(y_cursor - d[1]) < dist_min) {
                        dist_min = Math.abs(y_cursor - d[1]);
                        index_min = index;
                    }
                    if(dist_min === null || Math.abs(y_cursor - d[2]) < dist_min) {
                        dist_min = Math.abs(y_cursor - d[2]);
                        index_min = index + 1;
                    }
                });

                if(index_min !== null && index_min != my_index && index_min != my_index + 1) {
                    var index = index_min;
                    self.annotations = existing_list.slice();
                    var idx_remove = self.annotations.indexOf(my_annotation);
                    self.annotations.splice(index, 0, my_annotation);
                    if(index < idx_remove) idx_remove += 1;
                    self.annotations.splice(idx_remove, 1);
                    DM.invalidate(self.rendered_annotations);
                    DM.validate(self.rendered_annotations);
                } else {
                    self.annotations = existing_list.slice();
                    DM.invalidate(self.rendered_annotations);
                    DM.validate(self.rendered_annotations);
                }
            },
            mouseup: function() {

            }
        });
    });
    divs.classed("active", function(d) { return self.editing_annotation == d; });
    var left = appendOnlyOnce(divs, "div", "left");
    var btn_eye = appendOnlyOnce(left, "span", "btn").call(IconFont.addIconOnce(function(d) {
        return d.visible ? "correct" : "blank";
    }));
    var right = appendOnlyOnce(divs, "div", "right");
    var btn_remove = appendOnlyOnce(right, "span", "btn").classed("btn-danger", false).call(IconFont.addIconOnce("cross"));
    var label = appendOnlyOnce(divs, "label");
    appendOnlyOnce(left, "span", "icon").call(IconFont.addIconOnce("edit")).style("display", function(d) {
        return self.editing_annotation == d ? null : "none";
    });
    appendOnlyOnce(label, "span", "text").text(function(d) {
        return " " + d.toString();
    });
    btn_eye.classed("active", function(d) { return d.visible; });
    btn_eye.on("mousedown", function(d) {
        d3.event.stopPropagation();
    });
    btn_eye.on("click", function(d) {
        d3.event.stopPropagation();
        d.visible = !d.visible;
        DM.invalidate(d);
        DM.validate(self.rendered_annotations);
    });
    btn_remove.on("mousedown", function(d) {
        d3.event.stopPropagation();
    });
    btn_remove.on("click", function(d) {
        d3.event.stopPropagation();
        self.removeAnnotation(d);
    });
    // divs.on("click", function(d) {
    //     self.setEditingAnnotation(d);
    // });

    if(this.editing_annotation) {
        this.editing_annotation.startPopoutEditor(this.render_context);
    } else {
        d3.select("body .chartaccent-selection-box").remove();
        this.panel_editor.selectAll("*").remove();
        this.panel_editor.append("p").classed("nothing", true).text("(select an annotation to edit)");
    }
};
ChartRepresentation.prototype.setEditingAnnotation = function(annotation) {
    var self = this;

    if(!annotation) {
        this.editing_annotation = undefined;
    } else {
        this.editing_annotation = annotation;
    }
    this._should_ignore_undo_log = true;
    this._RenderAnnotations();
    this._should_ignore_undo_log = false;

    var is_event_target_in_panel_or_editing_widget = function(target) {
        var result = false;
        var item = target;
        while(item && item != document.body && item != document) {
            if(item == self.panel.node()) {
                result = true;
                break;
            }
            if(d3.select(item).classed("chartaccent-edit-widget")) {
                result = true;
                break;
            }
            if(item.tagName == "CHARTACCENT-POPOUT") {
                result = true;
                break;
            }
            item = item.parentNode;
        }
        return result;
    }

    if(!annotation) {
        d3.select(window).on("mouseup.selection-box-remove", null);
        d3.select(window).on("keydown.chartaccent-selection", null);
    } else {
        d3.select(window).on("mousedown.selection-box-remove", function() {
            if(!is_event_target_in_panel_or_editing_widget(d3.event.target)) {
                if(!(d3.event.shiftKey || d3.event.ctrlKey)) {
                    self.setEditingAnnotation(null);
                    d3.select(window).on("mouseup.selection-box-remove", null);
                }
            }
        });
        d3.select(window).on("keydown.chartaccent-selection", function() {
            var is_in_wrapper = is_event_target_in_panel_or_editing_widget(d3.event.target);
            if(!is_in_wrapper && (d3.event.keyCode == 8 || d3.event.keyCode == 46)) {
                self.removeAnnotation(annotation);
                d3.event.stopPropagation();
                d3.event.preventDefault();
            }
            if(!is_in_wrapper && d3.event.keyCode == 27) {
                self.setEditingAnnotation(null);
                d3.select(window).on("keydown.chartaccent-selection", null);
            }
            if(!is_in_wrapper) {
                if(d3.event.ctrlKey && d3.event.keyCode == 'U'.charCodeAt(0)) {
                    // De-select.
                    annotation.components.forEach(function(c) {
                        if(c.type == "highlight" || c.type == "highlight-line") {
                            c.style.fill = {
                                mode: "brighter-darker",
                                value: 0.8
                            }
                            c.style.stroke = null;
                            c.style.line_stroke = {
                                mode: "brighter-darker",
                                value: 0.8
                            }
                        } else {
                            c.visible = false;
                        }
                    });
                    DM.invalidate(annotation);
                    DM.validate(self.rendered_annotations);
                }
            }
        });
    }
    d3.select(window).on("keydown.chartaccent-select-all", function() {
        var is_in_wrapper = is_event_target_in_panel_or_editing_widget(d3.event.target);
        if(!is_in_wrapper && d3.event.keyCode == "A".charCodeAt(0) && d3.event.ctrlKey) {
            var target_items = [];
            self.chart_elements.forEach(function(elements) {
                if(elements.selectAll) {
                    var selection = elements.selectAll();
                    if(selection) target_items.push(selection);
                };
            });
            if(target_items.length > 0) {
                if(self.addItemsToCurrentAnnotation(target_items)) {
                    return;
                }
                var bubbleset_enabled = target_items.every(function(d) {
                    return d.elements.bubbleset !== undefined;
                });
                var bubbleset_on = bubbleset_enabled && target_items.some(function(d) {
                    return d.elements.bubbleset == "default-on";
                });
                var components = [
                    {
                        type: self.default_lasso_label,
                        text: self.default_lasso_label == "label" ? Expression.parse('"Group"') : Expression.parse(self.default_lasso_label_expression ? self.default_lasso_label_expression : "value"),
                        anchor: "m,tt",
                        style: Styles.createDefault(self.default_lasso_label),
                        visible: false
                    },
                    {
                        type: "highlight",
                        style: Styles.createDefault("highlight-all")
                    }
                ];
                if(bubbleset_enabled) {
                    components.push({
                        visible: false,
                        type: "bubbleset",
                        style: Styles.createDefault("bubbleset")
                    });
                }
                var new_annotation = new Annotation({
                    target: {
                        type: "items",
                        items: target_items
                    },
                    components: components
                });
                self.addAnnotationIfFoundSelect(new_annotation);
            }
        }
        if(!is_in_wrapper) {
            if(d3.event.ctrlKey && d3.event.keyCode == 'Z'.charCodeAt(0)) {
                self.undo();
            }
            if(d3.event.ctrlKey && d3.event.keyCode == 'Y'.charCodeAt(0)) {
                self.redo();
            }
        }
    });
};

ChartRepresentation.prototype.getAnnotationPosition = function(annotation) {
    return this.annotations.indexOf(annotation);
};
ChartRepresentation.prototype.addItemsToCurrentAnnotation = function(items) {
    var self = this;
    if(this.editing_annotation) {
        var target = this.editing_annotation.target;
        if(target.items) {
            items.forEach(function(item) {
                var elements = item.elements;
                var eitems = item.items;
                for(var i = 0; i < target.items.length; i++) {
                    if(target.items[i].elements == elements) {
                        eitems.forEach(function(item) {
                            if(target.items[i].items.indexOf(item) < 0) {
                                target.items[i].items.push(item);
                            }
                        });
                        return;
                    }
                }
                target.items.push({
                    elements: elements,
                    items: eitems.slice()
                });
            });
            self.editing_annotation.components.forEach(function(c) {
                if(c.type == "bubbleset") {
                    c.style.fill = new RGBColor(192, 192, 192, 1);
                }
            });
            DM.invalidate(this.editing_annotation);
            DM.validate(this.rendered_annotations);
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};
ChartRepresentation.prototype.addAnnotationIfFoundSelect = function(annotation) {
    var existing_annotation = null;
    for(var i = 0; i < this.annotations.length; i++) {
        if(this.annotations[i].target_inherit) continue;
        if(deepEquals(this.annotations[i].target, annotation.target)) {
            existing_annotation = this.annotations[i];
        }
    }
    if(existing_annotation) {
        this.setEditingAnnotation(existing_annotation);
    } else {
        this.addAnnotation(annotation);
    }
};
ChartRepresentation.prototype.addAnnotation = function(annotation, position) {
    if(position === undefined) {
        this.annotations.push(annotation);
    } else {
        this.annotations.splice(position, 0, annotation);
    }

    if(this._current_annotation_id === undefined) this._current_annotation_id = 1;
    else this._current_annotation_id += 1;
    annotation.id = "#A" + this._current_annotation_id;
    this.annotations_idmap.set(annotation.id, annotation);

    DM.add(this.rendered_annotations, annotation);
    DM.invalidate(this.rendered_annotations);
    DM.validate(this.rendered_annotations);

    this.setEditingAnnotation(annotation);
};
ChartRepresentation.prototype.getAnnotationByID = function(id) {
    return this.annotations_idmap.get(id);
};
ChartRepresentation.prototype.removeAnnotation = function(annotation) {
    var idx = this.annotations.indexOf(annotation);
    if(idx >= 0) {
        this.annotations_idmap.delete(annotation.id, annotation);
        DM.remove(this.rendered_annotations, annotation);
        this.annotations.splice(idx, 1);
        DM.invalidate(this.rendered_annotations);
    }
    if(this.editing_annotation == annotation) {
        this.setEditingAnnotation(null);
    }
    DM.validate(this.rendered_annotations);
};

ChartRepresentation.prototype.addAxis = function(info) {
    var axis = ChartElements.Create(this, "axis", info);
    axis.setChart(this);
    if(info.axis == "x") {
        axis.setMode("x");
        axis.setOrigin(info.origin_y);
        this.axis_x = axis;
    }
    if(info.axis == "y") {
        axis.setMode("y");
        axis.setOrigin(info.origin_x);
        this.axis_y = axis;
    }
    this.chart_elements.push(axis);
};

ChartRepresentation.prototype.addSeriesFromD3Selection = function(info) {
    var self = this;
    var root_matrix = this.layer_annotation.node().getScreenCTM();
    var root_matrix_inverse = root_matrix.inverse();

    if(!info.selection.node()) return; // selection is empty.

    var content = ChartElements.Create(this, "series", info);

    var elements = [];
    var data = [];
    var points = null;

    info.selection.each(function(d) {
        var tag = this.tagName;
        if(tag == "rect") {
            var matrix = this.getScreenCTM();
            matrix = root_matrix_inverse.multiply(matrix);
            var x = parseFloat(this.getAttribute("x"));
            var y = parseFloat(this.getAttribute("y"));
            var w = parseFloat(this.getAttribute("width"));
            var h = parseFloat(this.getAttribute("height"));
            var p00 = self.CreateSVGPoint(x, y).matrixTransform(matrix);
            var p01 = self.CreateSVGPoint(x, y + h).matrixTransform(matrix);
            var p10 = self.CreateSVGPoint(x + w, y).matrixTransform(matrix);
            var p11 = self.CreateSVGPoint(x + w, y + h).matrixTransform(matrix);
            var color = new RGBColor(this.style.fill);
            data.push(d);
            elements.push(["rect", p00, p01, p10, p11, color]);
        }
        if(tag == "circle") {
            var matrix = this.getScreenCTM();
            matrix = root_matrix_inverse.multiply(matrix);
            var cx = parseFloat(this.getAttribute("cx"));
            var cy = parseFloat(this.getAttribute("cy"));
            var r = parseFloat(this.getAttribute("r"));
            var center = self.CreateSVGPoint(cx, cy).matrixTransform(matrix);
            var radius = matrix.a * r;
            var color = new RGBColor(this.style.fill);
            data.push(d);
            elements.push(["circle", center, radius, color]);
        }
    });
    if(info.path) {
        var path_element = info.path.node();
        var matrix = path_element.getScreenCTM();
        matrix = root_matrix_inverse.multiply(matrix);
        // For simplicity we assume the path is a polyline.
        var d = path_element.getAttribute("d");
        d = d.split(/\s*[ml]\s*/i).map(function(x) { return x.trim().split(/\s*,\s*/).map(function(y) { return parseFloat(y.trim()); }); }).filter(function(x) { return x.length == 2; });
        points = d.map(function(p) { return new Geometry.Vector(p[0], p[1]); });
    }

    content.setItems(data, elements, points);

    this.chart_elements.push(content);
};

ChartRepresentation.prototype.addLegend = function(info) {
    var self = this;
    var root_matrix = this.layer_annotation.node().getScreenCTM();
    var root_matrix_inverse = root_matrix.inverse();

    var rects = [];
    var selections = [];
    var items = info.items.map(function(legend) {
        var matrix = legend.selection.node().getScreenCTM();
        matrix = root_matrix_inverse.multiply(matrix);
        var bbox = legend.selection.node().getBBox();
        var margin_x = 3;
        var margin_y = 1;
        var p00 = self.CreateSVGPoint(bbox.x - margin_x, bbox.y - margin_y).matrixTransform(matrix);
        var p01 = self.CreateSVGPoint(bbox.x - margin_x, bbox.y + margin_y * 2 + bbox.height).matrixTransform(matrix);
        var p10 = self.CreateSVGPoint(bbox.x + margin_x * 2 + bbox.width, bbox.y - margin_y).matrixTransform(matrix);
        var p11 = self.CreateSVGPoint(bbox.x + margin_x * 2 + bbox.width, bbox.y + margin_y * 2 + bbox.height).matrixTransform(matrix);
        return {
            items: legend.items,
            name: legend.name,
            rect: [ p00, p01, p10, p11 ],
            color: legend.color ? new RGBColor(legend.color) : null
        };
    });
    var content = ChartElements.Create(this, "legend", info);
    content.setItems(items);
    this.chart_elements.push(content);
};

ChartRepresentation.prototype.createSVGDefs = function(layer) {
    var defs = layer.append("defs");
    // Drop shadow effect.
    var filter = defs.append("filter")
        .attr("id", "chartaccent-drop-shadow")
        .attr("height", "200%")
        .attr("width", "200%");
    filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 1);
    filter.append("feOffset")
        .attr("dx", 0)
        .attr("dy", 2);
    filter.append("feComponentTransfer")
        .append("feFuncA")
            .attr("type", "linear")
            .attr("slope", 0.2)
    var feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode");
    feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");
};

ChartRepresentation.prototype.emptyState = function() {
    return {
        annotations: []
    };
};

ChartRepresentation.prototype.saveState = function() {
    var state = {
        annotations: CloneAnnotations(this.annotations)
    };
    return state;
};

ChartRepresentation.prototype.loadState = function(state) {
    this._should_ignore_undo_log = true;
    this.layers.cleanup();

    for(var i = 0; i < this.annotations.length; i++) {
        DM.remove(this.rendered_annotations, this.annotations[i]);
    }

    this.annotations = state.annotations.slice();
    this.annotations_idmap = new Map();

    for(var i = 0; i < this.annotations.length; i++) {
        DM.add(this.rendered_annotations, this.annotations[i]);
        DM.invalidate(this.annotations[i]);
        this.annotations_idmap.set(this.annotations[i].id, this.annotations[i]);
    }

    this.editing_annotation = null;

    DM.invalidate(this.rendered_annotations);
    DM.validate(this.rendered_annotations);
    this._should_ignore_undo_log = false;
};

ChartRepresentation.prototype.saveStateForUndo = function() {
    if(this._should_ignore_undo_log) return;
    var current_time = new Date().getTime() / 1000.0;
    var action = {
        timestamp: current_time,
        state: this.saveState()
    }
    // Action grouping.
    if(this.undo_history.length > 0 && this.undo_history[this.undo_history.length - 1].timestamp > current_time - 0.1) {
        this.undo_history[this.undo_history.length - 1] = action;
    } else {
        this.undo_history.push(action);
    }
    this.redo_history = [];
};

ChartRepresentation.prototype.undo = function() {
    if(this.undo_history.length > 0) {
        var action = this.undo_history.splice(this.undo_history.length - 1, 1)[0];
        var previous_state = this.emptyState();
        if(this.undo_history.length > 0) {
            previous_state = this.undo_history[this.undo_history.length - 1].state;
        }
        this.loadState(previous_state);
        this.redo_history.push(action);
    }
};

ChartRepresentation.prototype.reset = function() {
    this.setEditingAnnotation(null);
    this.annotations = [];
    DM.invalidate(this.rendered_annotations);
    DM.validate(this.rendered_annotations);
};

ChartRepresentation.prototype.redo = function() {
    if(this.redo_history.length > 0) {
        var action = this.redo_history.splice(this.redo_history.length - 1, 1)[0];
        this.loadState(action.state);
        this.undo_history.push(action);
    }
};

ChartRepresentation.prototype.getImageDataURL = function(svg, scale, callback) {
    var img = new Image();
    img.onload = function() {
        // Now that the image has loaded, put the image into a canvas element.
        var canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = "#FFF";
        ctx.scale(scale, scale);
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);
        callback(canvas);
    };
    img.src = svg;
};

ChartRepresentation.prototype.makeAnimation = function(callback) {
    var self = this;
    var currentState = this.saveState();
    var svgs = [];
    this.undo_history.forEach(function(state) {
        self.loadState(state.state);
        svgs.push(self.owner.getSVGDataURL());
    });
    self.loadState(currentState);
    svgs.push(self.owner.getSVGDataURL());
    var dataurls = [];
    var gif = new GIF({
        workers: 2,
        workerScript: "js/gif.worker.js",
        quality: 10
    });
    gif.on('finished', function(blob) {
        console.log(blob);
        callback(blob);
    });
    function convertCanvasIndex(i) {
        if(i == svgs.length) {
            gif.render();
        } else {
            self.getImageDataURL(svgs[i], 2, function(canvas) {
                gif.addFrame(canvas);
                convertCanvasIndex(i + 1);
            });
        }
    }
    convertCanvasIndex(0);
}

ChartRepresentation.Create = function(owner, info) {
    return new ChartRepresentation(owner, info);
};



Annotation.prototype.getBoundingRect = function(RC) {
    if(this.target.type == "freeform") return false;

    var layers = [ "fg", "fg2", "bg" ];

    var body_rect = RC.svg.node().getBoundingClientRect();
    var current_rect = null;

    function doExtend() {
        if(d3.select(this).classed("edit-widget")) return;
        var srect = this.getBoundingClientRect();
        if(srect.width == 0 && srect.height == 0) return;
        var rect = {
            x1: srect.left, y1: srect.top,
            x2: srect.left + srect.width,
            y2: srect.top + srect.height
        };
        if(current_rect == null) {
            current_rect = rect;
        } else {
            current_rect.x1 = Math.min(current_rect.x1, rect.x1);
            current_rect.y1 = Math.min(current_rect.y1, rect.y1);
            current_rect.x2 = Math.max(current_rect.x2, rect.x2);
            current_rect.y2 = Math.max(current_rect.y2, rect.y2);
        }
    };

    layers.forEach(function(layer) {
        var sel = RC.layers.getAll(layer, this);
        if(sel) sel.each(doExtend);
    }.bind(this));

    if(current_rect) {
        current_rect.x1 -= body_rect.left;
        current_rect.x2 -= body_rect.left;
        current_rect.y1 -= body_rect.top;
        current_rect.y2 -= body_rect.top;
        return current_rect;
    } else {
        return null;
    }
};

var ComponentsEditor = function(info) {
    var self = this;
    this.info = info;
    this.container = info.container;
    var tree = appendTreeOnce(this.container, [
        [ "section", { $: "section" } ]
    ]);
    this.item_container = tree.section;
    this.renderItems();
};

var ToggleStateManager = function() {
    this.components = new WeakMap();
};
ToggleStateManager.prototype.getState = function(component, name, defaultstate) {
    if(this.components.has(component)) {
        var o = this.components.get(component);
        if(o[name] === undefined) {
            o[name] = defaultstate;
            return defaultstate;
        } else {
            return o[name];
        }
    } else {
        var o = { };
        o[name] = defaultstate;
        this.components.set(component, o);
        return defaultstate;
    }
};
ToggleStateManager.prototype.setState = function(component, name, state) {
    if(this.components.has(component)) {
        this.components.get(component)[name] = state ? true : false;
    } else {
        var o = { };
        o[name] = state ? true : false;
        this.components.set(component, o);
    }
};
var toggle_state_manager = new ToggleStateManager();

ComponentsEditor.prototype.renderItems = function() {
    var info = this.info;
    var items = info.getItems();
    // Make sure the DOM element always maps to the right item.
    var div_items = this.item_container.selectAll("div.arrayeditor-container").data(items, getObjectUniqueID);
    div_items.exit().remove();

    var div_items_enter = div_items.enter().append("div").attr("class", "arrayeditor-container");

    var header = div_items_enter.append("h2").classed("subsections", true);

    header.style("cursor", function(d) { return info.canToggle(d) ? "pointer" : "default"});
    var header_left = header.append("span").style("float", "left");
    header_left.append("span")
        .attr("class", "btn btn-toggle")
        .call(IconFont.addIcon("eye"))
        .classed("active", info.getVisibility.bind(info))
        .on("click", function(d) {
            info.setVisibility(d, !info.getVisibility(d));
            if(info.getVisibility(d)) {
                toggle_state_manager.setState(d, "main", true);
                render_toggle_states();
            }
            d3.select(this).classed("active", info.getVisibility(d));
            d3.event.stopPropagation();
        });
    // header.append("span").call(IconFont.addIconOnce("arrow-down")).classed("toggle-icon", true).style({
    //     "display": "inline-block",
    //     "height": "24px",
    //     "margin-left": "3px",
    //     "vertical-align": "top",
    //     "line-height": "24px",
    //     "text-align": "center",
    //     "font-size": "11px"
    // });
    header.append("span").text(" ").style("margin-left", "5px");
    header.append("span").call(IconFont.addIcon(function(d) {
        return info.headerIcon(d);
    }));
    header.append("span").text(function(d) { return info.header(d); }).style("margin-left", "5px");

    header.on("click", function(d) {
        if(!info.canToggle(d)) return;
        toggle_state_manager.setState(d, "main", !toggle_state_manager.getState(d, "main", info.defaultOpen(d)));
        render_toggle_states();
    });

    var render_toggle_states = function() {
        div_items.select("h2 .btn-toggle").classed("active", info.getVisibility).call(IconFont.addIconOnce(function(d) {
            return info.getVisibility(d) ? "correct" : "blank";
        }));
        div_items.select(".content").style("display", function(d) {
            var main = d3.select(this.parentNode);
            var r = toggle_state_manager.getState(d, "main", info.defaultOpen(d));
            if(r) {
                main.select("h2.subsections .toggle-icon").selectAll("*").remove();
                main.select("h2.subsections .toggle-icon").call(IconFont.addIconOnce("arrow-down"));
                return "block";
            } else {
                main.select("h2.subsections .toggle-icon").selectAll("*").remove();
                main.select("h2.subsections .toggle-icon").call(IconFont.addIconOnce("arrow-right"));
                return "none";
            }
        });
        if(d3.event) d3.event.stopPropagation();
    };

    div_items_enter.append("div").classed("content", true);

    div_items.each(function(item) {
        var div_item = d3.select(this);
        info.renderItem(div_item.select(".content"), item);
    });

    var div_none = this.item_container.selectAll("div.arrayeditor-none").data(items.length == 0 ? [ 0 ] : []);
    div_none.enter().append("div").attr("class", "arrayeditor-none").append("i").text("(none)");
    div_none.exit().remove();

    render_toggle_states();
};

var CreateSimpleStyleEditor = function(container, style, validate_and_update, clickout_handlers) {
    var tree = appendTreeOnce(container, [
        [ "span", { text: "Color " } ],
        [ "span", { $: "fill_color" } ],
        [ "span", { text: " " } ],
        [ "span", { text: " Outline " } ],
        [ "span", { $: "stroke_color" } ],
        [ "span", { text: " " } ],
        [ "span", { $: "stroke_width" } ],
        [ "span", { text: " px" } ]
    ]);
    MakeColorPicker(tree.fill_color, style.fill, function(color) {
        style.fill = color;
        validate_and_update();
    }, clickout_handlers);
    MakeStrokeColorPicker(tree.stroke_color, style.stroke, function(color) {
        style.stroke = color;
        validate_and_update();
    }, clickout_handlers);
    MakeNumberInputUpDown(tree.stroke_width, style.stroke_width, 1, [0, 100], function(value) {
        style.stroke_width = value;
        validate_and_update();
    });
};

var CreateSimpleLabelStyleEditor = function(container, style, validate_and_update, clickout_handlers) {
    var tree = appendTreeOnce(container, [
        [ "span", { text: "Color " } ],
        [ "span", { $: "fill_color" } ],
        [ "span", { text: " " } ],
        [ "span", { text: " Outline " } ],
        [ "span", { $: "stroke_color" } ],
        [ "span", { text: " " } ],
        [ "span", { $: "stroke_width" } ],
        [ "span", { text: " px" } ]
    ]);
    MakeColorPicker(tree.fill_color, style.fill, function(color) {
        style.fill = color;
        validate_and_update();
    }, clickout_handlers);
    MakeStrokeColorPicker(tree.stroke_color, style.stroke, function(color) {
        style.stroke = color;
        validate_and_update();
    }, clickout_handlers);
    MakeNumberInputUpDown(tree.stroke_width, style.stroke_width, 1, [0, 100], function(value) {
        style.stroke_width = value;
        validate_and_update();
    });
};


var CreateSimpleFillStyleEditor = function(container, style, validate_and_update, clickout_handlers) {
    var tree = appendTreeOnce(container, [
        [ "span", { text: "Color " } ],
        [ "span", { $: "fill_color" } ]
    ]);
    MakeColorPicker(tree.fill_color, style.fill, function(color) {
        style.fill = color;
        validate_and_update();
    }, clickout_handlers);
};

var CreateSimpleStrokeStyleEditor = function(container, style, validate_and_update, clickout_handlers) {
    var tree = appendTreeOnce(container, [
        [ "span", { text: " Color " } ],
        [ "span", { $: "stroke_color" } ],
        [ "span", { text: " " } ],
        [ "span", { $: "stroke_width" } ],
        [ "span", { text: " px" } ]
    ]);
    MakeStrokeColorPicker(tree.stroke_color, style.stroke, function(color) {
        style.stroke = color;
        validate_and_update();
    }, clickout_handlers);
    MakeNumberInputUpDown(tree.stroke_width, style.stroke_width, 1, [0, 100], function(value) {
        style.stroke_width = value;
        validate_and_update();
    });
};

var CreateHighlightColorEditor = function(container, color, stroke_width, onchange, onchange_strokewidth, clickout_handlers, series_colors) {
    // Cleanup if it's not the same object.
    if(container.node().__color__ !== color) {
        container.selectAll("*").remove();
        container.node().__color__ = color;
    }
    var type_choices = [
        { name: "New Color", value: "color" },
        { name: "Original Color", value: "brighter-darker" },
        { name: "None", value: "none" }
    ];
    var current_type;
    // if(color === null) {
    //     current_type = "none";
    //     var tree = appendTreeOnce(container, [
    //         [ "span", { $: "type" } ]
    //     ]);
    if(color instanceof RGBColor || color === null) {
        if(color === null) current_type = "none";
        else current_type = "color";
        var tree = appendTreeOnce(container, [
            [ "span", { $: "type" } ],
            [ "span", { text: " " } ],
            [ "span", { $: "color" } ],
            [ "span", { text: " " } ],
            [ "span", { $: "stroke_width" } ]
        ]);
        if(stroke_width === undefined) {
            MakeColorPicker(tree.color, color, function(newval) {
                onchange(newval);
            }, clickout_handlers)
        } else {
            MakeStrokeColorPicker(tree.color, color, function(newval) {
                onchange(newval);
            }, clickout_handlers)
        }
    } else {
        var mode = color.mode;
        current_type = mode;
        var tree = appendTreeOnce(container, [
            [ "span", { $: "type" } ],
            [ "span", { text: " " } ],
            // [ "span", { style: { display: "inline-block", "background": "#FFF", "width": "10px", "height": "10px", "box-shadow": "0 0 2px gray", "border-radius": "5px" } } ],
            [ "span", { $: "slider" } ],
            // [ "span", { style: { display: "inline-block", "background": "#000", "width": "10px", "height": "10px", "box-shadow": "0 0 2px gray", "border-radius": "5px" } } ],
            [ "span", { text: " " } ],
            [ "span", { $: "stroke_width" } ]
        ]);
        // var series_colors = ["#99A2E8", "#6FDD44", "#EB84C9"].map(function(d) { return new RGBColor(d); });

        MakeColorfulSlider(tree.slider, -color.value, [-0.8, 1], series_colors, function(newval) {
            color.value = -newval;
            onchange(color);
        }, clickout_handlers);
    }
    if(tree.stroke_width && stroke_width !== undefined) {
        MakeNumberInputUpDown(tree.stroke_width, stroke_width, 1, [0, 100], function(value) {
            onchange_strokewidth(value);
        });
    }
    MakeSelectButton(tree.type, current_type, type_choices, function(newval) {
        if(newval == current_type) return;
        if(newval == "color") {
            onchange(new RGBColor("#5CA3D1", 1));
        }
        if(newval == "brighter-darker") onchange({
            mode: newval,
            value: 0.2
        });
        if(newval == "none") {
            onchange(null);
        }
    }, clickout_handlers);
};

var CreateHighlightStyleEditor = function(container, style, validate_and_update, clickout_handlers, series_colors) {
    var tree = appendTreeOnce(container, [
        [ "dt", { text: "Color" } ],
        [ "dd", { $: "fill_editor" } ],
        [ "dt", { text: "Outline" } ],
        [ "dd", { $: "stroke_editor" } ]
    ]);
    CreateHighlightColorEditor(tree.fill_editor, style.fill, undefined, function(newvalue) {
        style.fill = newvalue;
        validate_and_update();
    }, undefined, clickout_handlers, series_colors);
    CreateHighlightColorEditor(tree.stroke_editor, style.stroke, style.stroke_width, function(newvalue) {
        style.stroke = newvalue;
        validate_and_update();
    }, function(newwidth) {
        style.stroke_width = newwidth;
        validate_and_update();
    }, clickout_handlers, series_colors);
};

var CreateHighlightLineStyleEditor = function(container, style, validate_and_update, clickout_handlers, series_colors) {
    var tree = appendTreeOnce(container, [
        [ "dt", { text: "Line" } ],
        [ "dd", { $: "line_stroke_editor" } ]
    ]);
    CreateHighlightColorEditor(tree.line_stroke_editor, style.line_stroke, style.line_stroke_width, function(newvalue) {
        style.line_stroke = newvalue;
        validate_and_update();
    }, function(newwidth) {
        style.line_stroke_width = newwidth;
        validate_and_update();
    }, clickout_handlers, series_colors);
};

Annotation.prototype.startSelectRangeItems = function(RC, anchor, clickout_handlers) {
    var all_elements = RC.owner.chart_elements.filter(function(d) {
        return d.createHighlightOverlay;
    });
    var show_include_equal = true;
    var range_value = this.target.range.eval(RC.context);
    var is_categorical_scale = !Scales.isScaleNumerical(this.target.axis.getScale());
    if(is_categorical_scale) {
        show_include_equal = false;
    }
    var select = CreateEditorPopup("SelectItems", {
        anchor: anchor.node(),
        parent_clickout_handlers: clickout_handlers,
        serieses: all_elements.map(function(d) { return d.name; }),
        default_include_equal: true,
        show_include_equal: show_include_equal,
        modes: (isArray(range_value) ?
            [
                { name: "Within", value: "within", icon: "range-within" },
                { name: "Outside", value: "without", icon: "range-without" }
            ] : [
                { name: "Below", value: "below", icon: "line-below" },
                { name: "Above", value: "above", icon: "line-above" }
            ]
        ),
        default_mode: isArray(range_value) ? "within" : "above"
    });
    anchor.classed("active", true);
    Events.on(select, "remove", function() {
        anchor.classed("active", false);
    });
    Events.on(select, "selected", function(mode, serieses) {
        anchor.classed("active", false);

        if(is_categorical_scale) {
            if(mode == "within") mode = "within-or-equal";
            if(mode == "without-or-equal") mode = "without";
            if(mode == "above") mode = "above-or-equal";
            if(mode == "below") mode = "below-or-equal";
        }

        var related_annotations = RC.owner.annotations.filter(function(a) {
            return a.target_inherit && a.target === this.target && a.target_inherit.mode == mode;
        }.bind(this));

        if(related_annotations.length > 0) {
            RC.owner.setEditingAnnotation(related_annotations[0]);
            return;
        }

        var label_text = Expression.parse(all_elements[0].default_label);

        var newannotation = new Annotation({
            target: this.target,
            target_inherit: {
                mode: mode,
                serieses: serieses.map(function(d) {
                    for(var i = 0; i < all_elements.length; i++) {
                        if(all_elements[i].name == d) {
                            return all_elements[i];
                        }
                    }
                })
            },
            components: [
                { type: "item-label", anchor: "m,tt", text: label_text, style: Styles.createDefault("item-label"), visible: true },
                { type: "highlight", style: Styles.createDefault("highlight"), visible: true }
            ]
        });
        RC.owner.addAnnotation(newannotation, isArray(range_value) ? undefined : RC.owner.annotations.indexOf(this));
    }.bind(this));
};

Annotation.prototype.renderSelectionBoxHint = function(RC) {
    var bounding_rect = this.getBoundingRect(RC);
    var selection_box = appendOnlyOnce(RC.svg.parent(), "div", "chartaccent-selection-hint");
    if(bounding_rect) {
        selection_box.style({
            "width": (bounding_rect.x2 - bounding_rect.x1) + "px",
            "height": (bounding_rect.y2 - bounding_rect.y1) + "px",
            "left": (bounding_rect.x1 - 4) + "px",
            "top": (bounding_rect.y1 - 4) + "px",
        });
    } else {
        selection_box.remove();
    }
};
Annotation.prototype.removeSelectionBoxHint = function(RC) {
    var selection_box = appendOnlyOnce(RC.svg.parent(), "div", "chartaccent-selection-hint");
    selection_box.remove();
};

Annotation.prototype.startPopoutEditor = function(RC) {
    var self = this;

    var bounding_rect = this.getBoundingRect(RC);

    var selection_box = appendOnlyOnce(RC.svg.parent(), "div", "chartaccent-selection-box");
    if(bounding_rect) {
        selection_box.style({
            "width": (bounding_rect.x2 - bounding_rect.x1) + "px",
            "height": (bounding_rect.y2 - bounding_rect.y1) + "px",
            "left": (bounding_rect.x1 - 4) + "px",
            "top": (bounding_rect.y1 - 4) + "px",
        });
        var cross_button = appendOnlyOnce(selection_box, "span", "cross-button");
        cross_button.html('<svg width="12" height="12"><line x1="3" y1="3" x2="9" y2="9" style="stroke: black;" /><line x1="3" y1="9" x2="9" y2="3" style="stroke: black;" /></svg>');
        cross_button.on("mousedown", function() {
            RC.owner.removeAnnotation(self);
            d3.event.stopPropagation();
        });
    } else {
        selection_box.remove();
    }

    RC.owner.panel_editor.selectAll(".nothing").remove();
    if(RC.owner.panel_editor._current_annotation != this) {
        RC.owner.panel_editor._current_annotation = this;
        appendOnlyOnce(RC.owner.panel_editor, "chartaccent-popout").remove();
    }
    var wrapper = appendOnlyOnce(RC.owner.panel_editor, "chartaccent-popout");

    function validate_and_update() {
        DM.invalidate(self);
        RC.validate();
        var bounding_rect = self.getBoundingRect(RC);
        if(bounding_rect) {
            selection_box.style({
                "width": (bounding_rect.x2 - bounding_rect.x1) + "px",
                "height": (bounding_rect.y2 - bounding_rect.y1) + "px",
                "left": (bounding_rect.x1 - 4) + "px",
                "top": (bounding_rect.y1 - 4) + "px"
            });
        }
    };

    var clickout_handlers = null;

    var tree_wrapper = appendTreeOnce(wrapper, [
        [ "div.target-section", [
            [ "h2", { $: "target_text", text: "Target" } ],
            [ "div.section", { $: "target_section" } ],
            [ "div", { $: "select_items" } ]
        ] ],
        [ "div", { $: "components" } ]
    ]);


    if(tree_wrapper.target_section.attr("data-target-type") != this.target.type) {
        tree_wrapper.target_section.selectAll("*").remove();
        tree_wrapper.target_section.attr("data-target-type", this.target.type);
    }

    if(this.target.type == "items") {
        if(this.target_inherit) {
            tree_wrapper.target_text.text("Target (inherited)");
        } else {
            tree_wrapper.target_text.text("Items");
        }
        // var p = appendOnlyOnce(tree_wrapper.target_section, "p").text("" + d3.sum(this.target.items, function(d) { return d.items.length; }) + " manually selected item(s).");
        var str = this.toString();
        if(str.length > 100) str = str.substr(0, 100) + "...";
        var p = appendOnlyOnce(tree_wrapper.target_section, "p").text(str);
    }
    if(this.target.type == "range") {
        if(this.target_inherit) {
            if(Expression.isSimpleFunction(this.target.range, "range")) {
                tree_wrapper.target_text.text("Items " + this.target_inherit.mode.replace("-or-equal", "") + " Range");
            } else {
                tree_wrapper.target_text.text("Items " + this.target_inherit.mode.replace("-or-equal", "") + " Line");
            }
        } else {
            if(Expression.isSimpleFunction(this.target.range, "range")) {
                tree_wrapper.target_text.text("Range");
            } else {
                tree_wrapper.target_text.text("Line");
            }
        }
        if(Expression.isSimpleFunction(this.target.range, "range")) {
            var tree = appendTreeOnce(tree_wrapper.target_section, [
                [ "dl", [
                    [ "dt", { text: this.target.axis.mode.toUpperCase() + " min" } ],
                    [ "dd", [ [ "span", { $: "target_1" } ] ] ],
                    [ "dt", { text: this.target.axis.mode.toUpperCase() + " max" } ],
                    [ "dd", [ [ "span", { $: "target_2" } ] ] ]
                    // [ "dt", { $: "list_dt", text: "Series" } ],
                    // [ "dd", { $: "list_dd" }, [ [ "ul", { $: "list" } ] ] ]
                ]]
            ]);
            MakeExpressionInput(tree.target_1, this.target.range.args[0], function(expr) {
                self.target.range.args[0] = expr;
                if(Expression.isSimpleFunctionApply(expr, "avg")) {
                    self.components.forEach(function(d) {
                        if(d.type == "label") d.text = Expression.parse('format(".1f", value)');
                    });
                }
                validate_and_update();
            }, RC.context);
            MakeExpressionInput(tree.target_2, this.target.range.args[1], function(expr) {
                self.target.range.args[1] = expr;
                if(Expression.isSimpleFunctionApply(expr, "avg")) {
                    self.components.forEach(function(d) {
                        if(d.type == "label") d.text = Expression.parse('format(".1f", value)');
                    });
                }
                validate_and_update();
            }, RC.context);
        } else {
            var tree = appendTreeOnce(tree_wrapper.target_section, [
                [ "dl", [
                    [ "dt", { text: this.target.axis.mode.toUpperCase() } ],
                    [ "dd", [ [ "span", { $: "target" } ] ] ]
                ]]
            ]);
            MakeExpressionInput(tree.target, this.target.range, function(expr) {
                self.target.range = expr;
                if(Expression.isSimpleFunctionApply(expr, "avg")) {
                    self.components.forEach(function(d) {
                        if(d.type == "label") d.text = Expression.parse('format(".1f", value)');
                    });
                }
                validate_and_update();
            }, RC.context);
        }
        // if(self.target_inherit) {
        //     var all_elements = RC.owner.chart_elements.filter(function(d) {
        //         return d.createHighlightOverlay;
        //     });
        //     MakeCheckboxList(tree.list, {
        //         items: all_elements,
        //         name: function(d) { return d.name; },
        //         isChecked: function(d) {
        //             return self.target_inherit.serieses.indexOf(d) >= 0;
        //         },
        //         onToggle: function(d) {
        //             var idx = self.target_inherit.serieses.indexOf(d);
        //             if(idx >= 0) {
        //                 self.target_inherit.serieses.splice(idx, 1);
        //             } else {
        //                 self.target_inherit.serieses.push(d);
        //             }
        //             validate_and_update();
        //             return true;
        //         }
        //     });
        // } else {
        //     tree.list_dt.remove();
        //     tree.list_dd.remove();
        // }
    }
    if(this.target.type == "freeform") {
        tree_wrapper.target_text.remove();
    }

    var on_edit_make_visible = function(c) {
        return function() {
            c.visible = true;
            validate_and_update();
        };
    };

    // Section: Labels
    var editor = new ComponentsEditor({
        annotation: this,
        container: tree_wrapper["components"],
        text: "Components",
        clickout_handlers: clickout_handlers,
        getItems: function(d) {
            return self.components.slice();
        },
        getVisibility: function(d) {
            return d.visible;
        },
        setVisibility: function(d, value) {
            d.visible = value;
            validate_and_update();
        },
        renderItem_Label: function(sel, component) {
            var tree = appendTreeOnce(sel, [
                [ "dl", { $: "dl" }, [
                    [ "dt", { text: "Text" } ],
                    [ "dd", [
                        [ "span", { $: "input_label_text" } ]
                    ]],
                    [ "dt", { text: "Font" } ],
                    [ "dd", [
                        [ "span", { $: "input_label_font_family" } ],
                        [ "span", { text: " " } ],
                        [ "span", { $: "input_label_font_size" } ]
                    ]],
                    [ "dt", { text: "Style" } ],
                    [ "dd", { $: "input_label_style" } ],
                    [ "dt", { text: "Line" } ],
                    [ "dd", [
                        [ "span", { $: "input_label_line" } ]
                    ]],
                    [ "dt", { text: "Anchor" } ],
                    [ "dd", [
                        [ "span", { $: "input_label_anchor" } ]
                    ]]
                ]]
            ]);
            MakeEasyStringExpressionInput(tree.input_label_text, component.text, function(expr) {
                component.text = expr;
                on_edit_make_visible(component)();
            });
            MakeSwitchButton(tree.input_label_line, component.line ? "default" : "none", [
                { name: "Off", value: "none" },
                { name: "On", value: "default" }
            ], function(expr) {
                component.line = expr == "default" ? true : false;
                on_edit_make_visible(component)();
            }, clickout_handlers);
            if(tree.input_label_anchor) {
                MakeLabelAnchorSelectButton(tree.input_label_anchor, component.anchor, function(expr) {
                    component.anchor = expr;
                    component.anchor_offset = { x: 0, y: 0 };
                    on_edit_make_visible(component)();
                }, clickout_handlers);
            }
            if(!component.anchor_offset) component.anchor_offset = { x: 0, y: 0 };

            MakeNumberInputFontSize(tree.input_label_font_size, component.style.font_size, 1, [0, 100], function(value) {
                component.style.font_size = value;
                on_edit_make_visible(component)();
            });
            MakeFontSelectButton(tree.input_label_font_family, component.style.font_family, function(value) {
                component.style.font_family = value;
                on_edit_make_visible(component)();
            }, clickout_handlers);
            CreateSimpleLabelStyleEditor(tree.input_label_style, component.style, on_edit_make_visible(component), clickout_handlers);
        },
        renderItem_SimpleStyle: function(sel, component) {
            var dl = appendOnlyOnce(sel, "dl");
            appendOnlyOnce(dl, "dt").text("");
            // sel.append("p").text("Gray region or line...");
            CreateSimpleStyleEditor(appendOnlyOnce(dl, "dd"), component.style, on_edit_make_visible(component), clickout_handlers);
        },
        renderItem_ShapeLineStyle: function(sel, component) {
            var tree = appendTreeOnce(sel, [
                [ "dl", [
                    [ "dt", { text: "" } ],
                    [ "dd", { $: "line_style" } ],
                    [ "dt", { text: "Arrow" } ],
                    [ "dd", [
                        ["span", { $: "mode" }],
                        ["span", { $: "size" }]
                    ] ]
                ]]
            ]);
            CreateSimpleStrokeStyleEditor(tree.line_style, component.style, on_edit_make_visible(component), clickout_handlers);
            MakeSwitchButton(tree.mode, component.arrow, [
                { name: "", value: "<", icon: "line-start" },
                { name: "", value: ">", icon: "line-end" },
                { name: "", value: "<>", icon: "line-start-end" },
                { name: "", value: "none", icon: "line-none" }
            ], function(value) {
                component.arrow = value;
                on_edit_make_visible(component)();
            });
            MakeNumberSlider(tree.size, component.arrow_size, [ 1.5, 20 ], function(value) {
                component.arrow_size = value;
                on_edit_make_visible(component)();
            });
        },
        renderItem_RangeStyle: function(sel, component) {
            var is_line_chart = RC.owner.chart_elements.some(function(d) { return d.has_line; });
            var dl = appendOnlyOnce(sel, "dl");
            if(!Scales.isScaleNumerical(self.target.axis.getScale()) && is_line_chart) {
                appendOnlyOnce(dl, "dt", "extra").text("Mode");
                if(!component.mode) component.mode = "range";
                MakeSwitchButton(appendOnlyOnce(appendOnlyOnce(dl, "dd", "extra"), "span"), component.mode, [
                    { name: "Range", value: "range" },
                    { name: "Line", value: "line" }
                ], function(value) {
                    if(component.mode == value) return;
                    component.mode = value;
                    dl.selectAll("*").remove();
                    if(value == "line") {
                        component.style = Styles.createDefault("range-line");
                    } else {
                        component.style = Styles.createDefault("range");
                    }
                    on_edit_make_visible(component)();
                });
            }
            appendOnlyOnce(dl, "dt", "main").text("");
            // sel.append("p").text("Gray region or line...");
            if(component.mode == "line") {
                CreateSimpleStrokeStyleEditor(appendOnlyOnce(dl, "dd", "main"), component.style, on_edit_make_visible(component), clickout_handlers);
            } else {
                CreateSimpleStyleEditor(appendOnlyOnce(dl, "dd", "main"), component.style, on_edit_make_visible(component), clickout_handlers);
            }
        },
        renderItem_RangeLineStyle: function(sel, component) {
            var dl = appendOnlyOnce(sel, "dl");
            appendOnlyOnce(dl, "dt").text("");
            // sel.append("p").text("Gray region or line...");
            CreateSimpleStrokeStyleEditor(appendOnlyOnce(dl, "dd"), component.style, on_edit_make_visible(component), clickout_handlers);
        },
        getSeriesColors: function() {
            var colors = new Set();
            self.forEachElementsItem(RC, function(elements, item) {
                if(!elements.getItemColor) return;
                var color = elements.getItemColor(item);
                colors.add(color.r + "," + color.g + "," + color.b);
            });
            return arrayFromSet(colors).map(function(d) { return new RGBColor("rgb(" + d + ")"); });
        },
        renderItem_Highlight: function(sel, component) {
            var dl = appendOnlyOnce(sel, "dl");
            CreateHighlightStyleEditor(dl, component.style, on_edit_make_visible(component), clickout_handlers, this.getSeriesColors());
        },
        renderItem_HighlightLine: function(sel, component) {
            var dl = appendOnlyOnce(sel, "dl");
            CreateHighlightLineStyleEditor(dl, component.style, on_edit_make_visible(component), clickout_handlers, this.getSeriesColors());
        },
        renderItem_Trendline: function(sel, component) {
            sel.selectAll("*").remove();
            var dl = sel.append("dl");
            dl.append("dt").text("");
            var input_label_anchor = dl.append("dd");
            CreateSimpleStrokeStyleEditor(input_label_anchor, component.style, on_edit_make_visible(component), clickout_handlers);
        },
        renderItem_Bubbleset: function(sel, component) {
            sel.selectAll("*").remove();
            var dl = sel.append("dl");
            dl.append("dt").text("Style");
            var input_label_anchor = dl.append("dd");
            CreateSimpleFillStyleEditor(input_label_anchor, component.style, on_edit_make_visible(component), clickout_handlers);
            dl.append("dt").text("Radius");
            if(component.sigma === undefined) component.sigma = 10;
            MakeNumberInputUpDown(dl.append("dd").append("span"), component.sigma, 1, [ 1, 20 ], function(d) {
                component.sigma = d;
                on_edit_make_visible(component)();
            });

        },
        renderItem_ImageChooser: function(sel, component) {
            var tree = appendTreeOnce(sel, [
                [ "dl", { $: "dl" }, [
                    [ "dt", { text: "Image" } ],
                    [ "dd", [
                        [ "span.btn", { $: "image_chooser", text: "Choose Image..." } ],
                        [ "input", { $: "input_file", attr: { type: "file" }, style: { display: "none" } } ],
                    ]],
                    [ "dt", { text: "Opacity" } ],
                    [ "dd", [
                        [ "span", { $: "slider_opacity" } ]
                    ]],
                    [ "dt", { text: "Mode" } ],
                    [ "dd", [
                        [ "span", { $: "meet_or_slice" } ]
                    ]]
                ]]
            ]);
            tree.image_chooser.on("click", function() {
                tree.input_file.node().files = [];
                tree.input_file.node().click();
                tree.input_file.node().onchange = function() {
                    var file = tree.input_file.node().files[0];
                    if(!file) return;
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var content = e.target.result;
                        component.image = content;
                        on_edit_make_visible(component)();
                    }
                    reader.readAsDataURL(file);
                };
            });
            MakeNumberSlider(tree.slider_opacity, component.opacity, [ 0, 1 ], function(newval) {
                component.opacity = newval;
                on_edit_make_visible(component)();
            });
            MakeSwitchButton(tree.meet_or_slice, component.meet_or_slice == "slice" ? "slice" : "meet", [
                { name: "Meet", value: "meet" },
                { name: "Slice", value: "slice" }
            ], function(value) {
                component.meet_or_slice = value;
                on_edit_make_visible(component)();
            });
        },
        renderItem: function(sel, component) {
            if(component.type == "range") return this.renderItem_RangeStyle(sel, component);
            if(component.type == "range-line") return this.renderItem_RangeLineStyle(sel, component);
            if(component.type == "label" || component.type == "item-label") return this.renderItem_Label(sel, component);
            if(component.type == "highlight") return this.renderItem_Highlight(sel, component);
            if(component.type == "highlight-line") return this.renderItem_HighlightLine(sel, component);
            if(component.type == "trendline") return this.renderItem_Trendline(sel, component);
            if(component.type == "bubbleset") return this.renderItem_Bubbleset(sel, component);
            if(component.type == "shape.rect") return this.renderItem_SimpleStyle(sel, component);
            if(component.type == "shape.oval") return this.renderItem_SimpleStyle(sel, component);
            if(component.type == "shape.image") return this.renderItem_ImageChooser(sel, component);
            if(component.type == "shape.line") return this.renderItem_ShapeLineStyle(sel, component);
        },
        addList: [
            { name: "Label", value: "item-label", icon: "item-label" },
            { name: "Marker(s)", value: "highlight", icon: "bars" },
            { name: "Line", value: "highlight-line", icon: "lines" },
            { name: "Label", value: "label", icon: "shape-label" },
            { name: "Value Range", value: "range", icon: "range" },
            { name: "Value Line", value: "range-line", icon: "range-line" },
            { name: "Trendline", value: "trendline", icon: "trendline" },
            { name: "BubbleSet", value: "bubbleset", icon: "bubbleset" },
            { name: "Image", value: "shape.image", icon: "shape-image" },
            { name: "Rectangle", value: "shape.rect", icon: "shape-rect" },
            { name: "Oval", value: "shape.oval", icon: "shape-oval" },
            { name: "Line/Arrow", value: "shape.line", icon: "shape-arrow" },
        ],
        header: function(d) {
            return this.addList.filter(function(l) { return d.type == l.value; })[0].name;
        },
        headerIcon: function(d) {
            return this.addList.filter(function(l) { return d.type == l.value; })[0].icon;
        },
        defaultOpen: function(item) {
            return true;
            if(self.target.type == "freeform") return true;
            return !this.canToggle(item);
            // if(!this.canToggle(item)) return true;
            // if(item.type == "label" || item.type == "item-label") return false;
            // return true;
        },
        canToggle: function(item) {
            // if(item.type == "label" || item.type == "item-label") return true;
            return false;
            // if(item.type == "range-line" || item.type == "range") {
            //     return false;
            // }
            // if(item.type == "trendline" || item.type.match(/^shape\./)) {
            //     return false;
            // }
            // return true;
        }
    });

    if(this.target.type == "range" && !this.target_inherit) {
        if(Expression.isSimpleFunction(this.target.range, "range")) {
            var select_items_text = "Select Items Using this Range";
        } else {
            var select_items_text = "Select Items Using this Line";
        }
        var tree = appendTreeOnce(tree_wrapper.select_items, [
            [ "p", [
                [ "span.btn", { $: "select_range", text: select_items_text + " " } ]
            ]]
        ]);
        tree.select_range.call(IconFont.addIconOnce("arrow-down"));

        tree.select_range.on("click", function() {
            this.startSelectRangeItems(RC, tree.select_range, clickout_handlers);
        }.bind(this));
    }
    // if((this.target.type == "range" && this.target_inherit) || (this.target.type == "items" && this.target_inherit != "trendline")) {
    //     var annotation = this;
    //     var tree = appendTreeOnce(tree_wrapper.select_items, [
    //         [ "p", [
    //             [ "span.btn", { $: "add_trendline", text: "Add Trendline" } ]
    //         ]]
    //     ]);
    //     tree.add_trendline.on("click", function() {
    //         RC.owner.addAnnotation(new Annotation({
    //             target: annotation.target,
    //             target_inherit: "trendline",
    //             components: [
    //                 { type: "trendline", style: Styles.createDefault("trendline") }
    //             ]
    //         }));
    //     }.bind(this));
    // }
};

var ExpressionSuggestion = function() {
    this.tree = appendTreeOnce(d3.select("body"), [
        [ "chartaccent-suggestions.chartaccent-edit-widget", { $: "container" }, [
            [ "div.item-list", { $: "items" } ]
        ]]
    ]);
    this.tree.container.on("mousedown", function() {
        d3.event.preventDefault();
    });
    this.shown = false;
};

ExpressionSuggestion.prototype.getSuggestionList = function(context) {
    var suggestions = [];
    var data = context.get("data");
    if(data) {
        for(var key in data[0]) {
            var value = data[0][key];
            if(isNumber(value)) {
                suggestions.push("avg@(" + key + ")");
                suggestions.push("median@(" + key + ")");
                suggestions.push("min@(" + key + ")");
                suggestions.push("max@(" + key + ")");
            }
        }
    }
    return suggestions;
};

ExpressionSuggestion.prototype.trigger = function(input, position, context) {
    return;
    var self = this;
    if(this.current_timeout) {
        clearTimeout(this.current_timeout);
    }
    this.current_timeout = setTimeout(function() {
        if(!self.shown) {
            self.show(input, position, context);
        }
    }, 200);
};
ExpressionSuggestion.prototype.show = function(input, position, context) {
    var self = this;
    this.shown = true;
    this.tree.container.style("display", "block");
    var input_rect = input.node().getBoundingClientRect();
    var body_rect = document.body.getBoundingClientRect();
    this.tree.container.style("left", (input_rect.left - body_rect.left) + "px");
    this.tree.container.style("top", (input_rect.top - body_rect.top + input_rect.height) + "px");

    var data = context.get("data");
    if(data) {
        var suggestions = [];
        // console.log(data[0]);
        for(var key in data[0]) {
            var value = data[0][key];
            if(isNumber(value)) {
                suggestions.push("mean@(" + key + ")");
                suggestions.push("median@(" + key + ")");
                suggestions.push("min@(" + key + ")");
                suggestions.push("max@(" + key + ")");
            }
        }
        // console.log(suggestions);
        // suggestions.sort(function(a, b) { return a < b ? -1 : 1; });
        var div_items = this.tree.items.selectAll("div").data(suggestions);
        div_items.enter().append("div");
        div_items.exit().remove();
        div_items.text(function(d) { return d; });
        div_items.on("click", function(d) {
            Events.raise(self, "apply", d);
        });
    } else {
        this.hide();
    }
};
ExpressionSuggestion.prototype.hide = function() {
    this.shown = false;
    this.tree.container.style("display", "none");
    if(this.current_timeout) {
        clearTimeout(this.current_timeout);
        this.current_timeout = null;
    }
};
ExpressionSuggestion.prototype.remove = function(input, position, context) {
};
var SubstringMatcher = function(strs) {
    function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    };
    var expr_filter = function(m) {
        return m.replace(/[^0-9a-zA-Z]+/g, " ").split(" ").filter(function(x) { return x != ""; }).map(function(x) { return x.toLowerCase(); });
    };
    return function findMatches(q, cb) {
        q = expr_filter(q);
        var matches, substringRegex;
        matches = [];
        $.each(strs, function(i, str) {
            var str_split = expr_filter(str);
            // if for each component of q, there is one match, then pass.
            var pass = q.every(function(component) {
                return str_split.some(function(s) {
                    // component is a prefix of s.
                    return s.substr(0, component.length) == component;
                });
            });
            if(pass) {
                matches.push(str);
            }
        });
        cb(matches);
    };
};

function insertAtCaret(node, to_add) {
    var sel_start = node.selectionStart;
    var sel_end = node.selectionEnd;
    var new_text = node.value.substr(0, sel_start) + to_add + node.value.substr(sel_end);
    node.value = new_text;
    node.setSelectionRange(sel_start, sel_start + to_add.length);
}

var MakeExpressionInput = function(sel, expression, onchange, context) {
    sel.selectAll("*").remove();
    var input = sel.append("input");
    input.classed("input-expression", true);
    input.property("value", expression.toString());
    var suggestion = new ExpressionSuggestion();

    $(input.node()).typeahead({
        hint: true,
        highlight: true,
        minLength: 0
    }, {
        name: 'Hints',
        limit: 1000,
        source: SubstringMatcher(suggestion.getSuggestionList(context))
    });

    var update_error_status = function() {
        var is_error = false;
        try {
            var newexpr = Expression.parse(input.property("value"));
        } catch(e) {
            var msg = e.message;
            is_error = true;
        }
        if(is_error) {
            input.style("background-color", "#FCC");
        } else {
            input.style("background-color", "#FFF");
        }
        return newexpr;
    };
    $(input.node()).on("typeahead:selected", function() {
        var expr = update_error_status();
        if(expr && onchange) {
            onchange(expr);
        }
    });
    $(input.node()).on("focus", function() {
        input.node().select();
    });
    $(input.node()).on("input", function() {
        var expr = update_error_status();
    });
    $(input.node()).change(function() {
        var expr = update_error_status();
        if(expr && onchange) {
            onchange(expr);
        }
    });
    $(input.node()).blur(function() {
        var expr = update_error_status();
        if(!expr) {
            input.property("value", expression.toString());
        }
    });
};

var MakeStringExpressionInput = function(sel, expression, onchange, context) {
    sel.classed("input-expression", true);
    sel.property("value", Expression.toStringExpression(expression));
    var update_error_status = function() {
        var is_error = false;
        try {
            var newexpr = Expression.parseStringExpression(sel.property("value"));
        } catch(e) {
            var msg = e.message;
            is_error = true;
        }
        if(is_error) {
            sel.style("background-color", "#FCC");
        } else {
            sel.style("background-color", "#FFF");
        }
        return newexpr;
    };
    sel.on("input", update_error_status);
    sel.on("change", function() {
        var newexpr = update_error_status();
        if(newexpr && onchange) {
            onchange(newexpr);
        }
    });
};

var MakeEasyStringExpressionInput = function(sel, expression, onchange, context) {
    var easy_string = Expression.toEasyString(expression);
    var format = easy_string.format;

    var tree = appendTreeOnce(sel, [
        [ "input", { $: "input", style: { width: "234px" } } ],
        [ "span", { $: "more_less" }, [
            [ "span", { text: " " } ],
            [ "span.btn", { $: "btn_more" }, [ IconFont.iconDesc("digits-more") ] ],
            [ "span", { text: " " } ],
            [ "span.btn", { $: "btn_less" }, [ IconFont.iconDesc("digits-less") ] ]
        ]],
    ]);
    var input = tree.input;

    if(!format || !(Expression.isSimpleFunction(format, "format") || Expression.isSimpleFunction(format, "formatRange"))) {
        tree.more_less.remove();
    } else {
        var format_fmt = format.args[0].value;
        var m = format_fmt.match(/^\.([\d]+)f$/);
        if(!m) {
            tree.more_less.remove();
        } else {
            var fmt = parseInt(m[1]);
            tree.btn_more.on("click", function() {
                if(fmt + 1 < 6) {
                    format.args[0].value = "." + (fmt + 1) + "f";
                    onchange(expression);
                }
            });
            tree.btn_less.on("click", function() {
                if(fmt - 1 >= 0) {
                    format.args[0].value = "." + (fmt - 1) + "f";
                    onchange(expression);
                }
            });
        }
    }

    var sel_start = input.node().selectionStart, sel_end = input.node().selectionEnd;
    input.property("value", easy_string.text);
    input.node().setSelectionRange(sel_start, sel_end);

    sel.on("input", function() { // instant update.
        var newexpr = Expression.parseEasyString(input.property("value"), easy_string.format);
        if(newexpr && onchange) {
            onchange(newexpr);
        }
    });
    sel.on("change", function() {
        var newexpr = Expression.parseEasyString(input.property("value"), easy_string.format);
        if(newexpr && onchange) {
            onchange(newexpr);
        }
    });
};

var MakeTextInput = function(sel, text, onchange) {
    sel.property("value", !isNone(text) ? text : "");
    sel.on("change", function() {
        var newexpr = sel.property("value");
        if(newexpr && onchange) {
            onchange(newexpr);
        }
    });
    sel.on("focus", function() {
        sel.node().select();
    });
};

var MakeNumberInput = function(sel, text, onchange) {
    sel.style("width", "30px").style("text-align", "right");
    MakeTextInput(sel, text.toString(), function(d) {
        var number = parseFloat(d);
        onchange(number);
    });
};

var MakeCheckbox = function(sel, text, value, onchange) {
    sel.classed("btn-checkbox", true);
    var icon = appendOnlyOnce(sel, "span", "icon");
    var sp = appendOnlyOnce(sel, "span", "space").text(" ");
    var name = appendOnlyOnce(sel, "span", "name").text(text);
    var current_value = value;
    var update = function() {
        icon.selectAll("*").remove();
        if(current_value) {
            icon.call(IconFont.addIconOnce("checkbox-correct-checked"));
        } else {
            icon.call(IconFont.addIconOnce("checkbox-correct-empty"));
        }
        sel.classed("active", current_value);
    }
    sel.on("click", function() {
        current_value = !current_value;
        update();
        onchange(current_value);
    });
    update();
};

var MakeNumberInputUpDown = function(sel, number, tick, range, onchange) {
    sel.classed("input-updown", true);
    var input = appendOnlyOnce(sel, "input").style("width", "30px").style("text-align", "right");
    var btns = appendOnlyOnce(sel, "span");
    var btn_up = appendOnlyOnce(btns, "span", "btn-up").classed("btn-up", true);
    btn_up.call(IconFont.addIconOnce("arrow-up"));
    var btn_down = appendOnlyOnce(btns, "span", "btn-down").classed("btn-down", true);
    btn_down.call(IconFont.addIconOnce("arrow-down"));

    var current_number = number;

    btn_up.on("click", function() {
        current_number += tick;
        if(current_number > range[1]) current_number = range[1];
        if(current_number < range[0]) current_number = range[0];
        onchange(current_number);
        refresh();
    });
    btn_down.on("click", function() {
        current_number -= tick;
        if(current_number > range[1]) current_number = range[1];
        if(current_number < range[0]) current_number = range[0];
        onchange(current_number);
        refresh();
    });
    var refresh = function() {
        MakeTextInput(input, current_number.toString(), function(d) {
            if(parseFloat(d) == parseFloat(d)) {
                current_number = parseFloat(d);
                if(current_number > range[1]) current_number = range[1];
                if(current_number < range[0]) current_number = range[0];
                onchange(current_number);
            }
        });
    };
    refresh();
};


var MakeNumberInputFontSize = function(sel, number, tick, range, onchange, clickout_handlers) {
    sel.classed("input-fontsize", true);
    var tree = appendTreeOnce(sel, [
        [ "input", { style: { width: "30px", "text-align": "right" }, $: "input" } ],
        [ "span.dropdown", { $: "btn_dropdown" }, [ IconFont.iconDesc("arrow-down") ] ],
        [ "span.btn", { $: "btn_up" }, [ IconFont.iconDesc("font-larger") ] ],
        [ "span.btn", { $: "btn_down" }, [ IconFont.iconDesc("font-smaller") ] ]
    ]);

    var current_number = number;

    tree.btn_up.on("click", function() {
        current_number += tick;
        if(current_number > range[1]) current_number = range[1];
        if(current_number < range[0]) current_number = range[0];
        onchange(current_number);
        refresh();
    });
    tree.btn_down.on("click", function() {
        current_number -= tick;
        if(current_number > range[1]) current_number = range[1];
        if(current_number < range[0]) current_number = range[0];
        onchange(current_number);
        refresh();
    });
    tree.btn_dropdown.on("click", function() {
        var font_sizes = [ 8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96 ];
        var items = font_sizes.map(function(d) { return { name: d.toString(), value: d }; });
        var select = CreateEditorPopup("Select", {
            anchor: sel.node(),
            parent_clickout_handlers: clickout_handlers,
            value: current_number,
            choices: items
        });
        Events.on(select, "value", function(value) {
            current_number = value;
            onchange(current_number);
            refresh();
        });
    });
    var refresh = function() {
        MakeTextInput(tree.input, current_number.toString(), function(d) {
            if(parseFloat(d) == parseFloat(d)) {
                current_number = parseFloat(d);
                if(current_number > range[1]) current_number = range[1];
                if(current_number < range[0]) current_number = range[0];
                onchange(current_number);
            }
        });
    };
    refresh();
};

var MakeNumberSlider = function(sel, value, range, onchange, slider_width) {
    var width = slider_width !== undefined ? slider_width : 80;
    var tree = appendTreeOnce(sel, [
        [ "svg", { $: "svg", attr: { width: width, height: 28 }, style: { "vertical-align": "top" } }, [
            [ "line", {
                attr: {
                    x1: 8, x2: width - 8, y1: 14, y2: 14
                },
                style: {
                    "stroke": "#888",
                    "stroke-width": "2",
                    "stroke-linecap": "round"
                }
            }],
            [ "circle", {
                $: "handle",
                attr: {
                    cx: 0, cy: 14, r: 5
                },
                style: {
                    "fill": "#444",
                    "stroke": "none",
                    "cursor": "move"
                }
            }]
        ]]
    ]);

    var scale = d3.scale.linear().domain(range).range([8, width - 8]);

    var current_value = value;

    tree.handle
        .on("mousedown", function() {
            var x0 = d3.event.pageX;
            var v0 = current_value;
            setupDragHandlers({
                mousemove: function() {
                    var x1 = d3.event.pageX;
                    var newvalue = scale.invert(scale(v0) + x1 - x0);
                    if(newvalue > range[1]) newvalue = range[1];
                    if(newvalue < range[0]) newvalue = range[0];
                    onchange(newvalue);
                    current_value = newvalue;
                    update_handle();
                }
            });
        });

    var update_handle = function() {
        tree.handle.attr("cx", scale(current_value));
    };

    update_handle();
};

var MakeColorPicker = function(sel, color, onchange, clickout_handlers) {
    sel.classed("color", true);
    var content = appendOnlyOnce(sel, "span", "content");
    var span_cross = appendOnlyOnce(sel, "svg", "cross-small");
    span_cross
        .attr("width", 20).attr("height", 20);
    appendOnlyOnce(span_cross, "line").attr({
            x1: 0, y1: 0, x2: 20, y2: 20
        }).style({
            "stroke-width": 2,
            "stroke": "#d62728"
        });
    if(color !== null) {
        content.style("background", color);
        content.style("display", "inline-block");
        span_cross.style("display", "none");
    } else {
        content.style("background", "none");
        content.style("display", "none");
        span_cross.style("display", "inline-block");
    }
    sel.on("click", function() {
        var element = this;
        var colorpicker = CreateEditorPopup("ColorPicker", {
            anchor: this,
            align: "right",
            parent_clickout_handlers: clickout_handlers,
            color: color
        });
        Events.on(colorpicker, "color", function(color) {
            if(color !== null) {
                content.style("background", color);
                span_cross.style("display", "none");
            } else {
                content.style("background", "none");
                span_cross.style("display", "inline-block");
            }
            onchange(color);
        });
    });
};

var MakeStrokeColorPicker = function(sel, color, onchange, clickout_handlers) {
    sel.classed("color", true);
    var content = appendOnlyOnce(sel, "span", "content");
    var occluder = appendOnlyOnce(sel, "span", "occluder");
    var span_cross = appendOnlyOnce(sel, "svg", "cross-small");
    span_cross
        .attr("width", 20).attr("height", 20);
    appendOnlyOnce(span_cross, "line").attr({
            x1: 0, y1: 0, x2: 20, y2: 20
        }).style({
            "stroke-width": 2,
            "stroke": "#d62728"
        });
    if(color !== null) {
        content.style("background", color);
        content.style("display", "inline-block");
        span_cross.style("display", "none");
    } else {
        content.style("background", "none");
        content.style("display", "none");
        span_cross.style("display", "inline-block");
    }
    sel.on("click", function() {
        var element = this;
        var colorpicker = CreateEditorPopup("ColorPicker", {
            anchor: this,
            align: "right",
            parent_clickout_handlers: clickout_handlers,
            color: color
        });
        Events.on(colorpicker, "color", function(color) {
            if(color !== null) {
                content.style("background", color);
                span_cross.style("display", "none");
            } else {
                content.style("background", "none");
                span_cross.style("display", "inline-block");
            }
            onchange(color);
        });
    });
};

var MakeSwitchButton = function(sel, value, choices, onchange) {
    sel.classed("btn-group-switch", true);
    var spans = sel.selectAll("span.switch-item").data(choices);
    spans.enter().append("span").classed("switch-item", true);
    spans.exit().remove();
    appendOnlyOnce(spans, "span", "icon").each(function(d) {
        if(d.icon) {
            d3.select(this).call(IconFont.addIconOnce(d.icon));
            appendOnlyOnce(d3.select(this), "span", "space").text(" ");
        } else {
            d3.select(this).selectAll("*").remove();
        }
    });
    appendOnlyOnce(spans, "span", "text").text(function(d) { return d.name; });
    var current_value = value;
    spans.classed("active", function(d) {
        return current_value == d.value;
    });
    spans.on("click", function(d) {
        console.log(d.value, d);
        onchange(d.value);
        current_value = d.value;
        spans.classed("active", function(d) {
            return current_value == d.value;
        });
    });
};

var MakeSelectButton = function(sel, value, choices, onchange, clickout_handlers) {
    var current_value = value;
    var tree = appendTreeOnce(sel, [
        [ "span", { $: "btn", class: "btn btn-toggle" }, [
            [ "span", { $: "text", text: choices.filter(function(d) { return d.value == current_value })[0].name } ],
            [ "span", { text: " " } ],
            [ "span", { $: "icon" } ]
        ]]
    ]);
    tree["icon"].call(IconFont.addIconOnce("arrow-down"));
    tree["btn"].on("click", function() {
        var select = CreateEditorPopup("Select", {
            anchor: this,
            parent_clickout_handlers: clickout_handlers,
            value: current_value,
            choices: choices
        });
        tree["btn"].classed("active", true);
        Events.on(select, "value", function(value) {
            current_value = value;
            onchange(value);
            tree["text"].text(choices.filter(function(d) { return d.value == current_value })[0].name);
            tree["btn"].classed("active", false);
        });
        Events.on(select, "remove", function(value) {
            tree["btn"].classed("active", false);
        });
    });
};

var MakeSingleSelectButton = function(sel, text, choices, onchange, clickout_handlers) {
    var tree = appendTreeOnce(sel, [
        [ "span", { $: "btn", class: "btn btn-toggle" }, [
            [ "span", { $: "text", text: text } ],
            [ "span", { text: " " } ],
            [ "span", { $: "icon" } ]
        ]]
    ]);
    tree["icon"].call(IconFont.addIconOnce("arrow-down"));
    tree["btn"].on("click", function() {
        var select = CreateEditorPopup("Select", {
            anchor: this,
            parent_clickout_handlers: clickout_handlers,
            choices: choices
        });
        tree["btn"].classed("active", true);
        Events.on(select, "value", function(value) {
            onchange(value);
            tree["btn"].classed("active", false);
        });
        Events.on(select, "remove", function(value) {
            tree["btn"].classed("active", false);
        });
    });
};

var MakeFontSelectButton = function(sel, value, onchange, clickout_handlers) {
    var fonts = [
        { name: "Roboto", value: "Roboto", font: "Roboto" },
        { name: "Roboto Mono", value: "Roboto Mono", font: "Roboto Mono" },
        { name: "Helvetica", value: "Helvetica", font: "Helvetica" },
        { name: "Arial", value: "Arial", font: "Arial" },
        { name: "Lucida Grande", value: "Lucida Grande", font: "Lucida Grande" },
        { name: "Geneva", value: "Geneva", font: "Geneva" },
        { name: "Verdana", value: "Verdana", font: "Verdana" },
        { name: "Tahoma", value: "Tahoma", font: "Tahoma" },
        { name: "Comic Sans MS", value: "Comic Sans MS", font: "Comic Sans MS" },
        { name: "Impact", value: "Impact", font: "Impact" },
        { name: "Georgia", value: "Georgia", font: "Georgia" },
        { name: "Times", value: "Times", font: "Times" },
        { name: "Palatino", value: "Palatino", font: "Palatino" },
        { name: "Consolas", value: "Consolas", font: "Consolas" },
        { name: "Lucida Console", value: "Lucida Console", font: "Lucida Console" }
    ];
    MakeSelectButton(sel, value, fonts, onchange, clickout_handlers);
};

var MakeLabelAnchorSelectButton = function(sel, value, onchange, clickout_handlers) {
    var anchor_to_text = function(anchor) {
        var v = anchor.split(",");
        var cvt = {
            "t": "Top", "tt": "Top-Outside",
            "b": "Bottom", "bb": "Bottom-Outside",
            "l": "Left", "ll": "Left-Outside",
            "r": "Right", "rr": "Right-Outside",
            "m": "Middle"
        };
        return cvt[v[0]] + ", " + cvt[v[1]];
    };

    var current_value = value;
    var tree = appendTreeOnce(sel, [
        [ "span", { $: "btn", class: "btn btn-toggle" }, [
            [ "span", { $: "text", text: anchor_to_text(current_value) } ],
            [ "span", { text: " " } ],
            [ "span", { $: "icon" } ]
        ]]
    ]);
    tree["icon"].call(IconFont.addIconOnce("arrow-down"));

    tree["btn"].on("click", function() {
        var select = CreateEditorPopup("LabelAnchorSelect", {
            anchor: this,
            parent_clickout_handlers: clickout_handlers,
            value: current_value
        });
        tree["btn"].classed("active", true);
        Events.on(select, "value", function(value) {
            current_value = value;
            onchange(value);
            tree["text"].text(anchor_to_text(current_value));
            tree["btn"].classed("active", false);
        });
        Events.on(select, "remove", function(value) {
            tree["btn"].classed("active", false);
        });
    });
};

function MakeCheckboxList(ul, info) {
    ul.classed("checkboxes", true);
    var li = ul.selectAll("li").data(info.items);
    var li_enter = li.enter().append("li").classed("btn-toggle", true);
    li_enter.append("span").classed("checkbox", true).append("span");
    li_enter.append("span").classed("name", true);
    li.select(".name").text(function(d) { return " " + info.name(d); });
    var update_checked = function() {
        li.select("span.checkbox").select("span").attr("class", function(d) {
            return info.isChecked(d) ? "chartaccent-icons-checkbox-correct-checked" : "chartaccent-icons-checkbox-correct-empty";
        });
        li.classed("active", function(d) { return info.isChecked(d); });
    };
    li.on("click", function(d) {
        if(info.onToggle(d)) {
        } else {
        }
        update_checked();
    });
    update_checked();
};

var MakeColorfulSlider = function(sel, value, range, colors, onchange) {
    var width = 130;
    var tree = appendTreeOnce(sel, [
        [ "svg", { $: "svg", attr: { width: width, height: 28 }, style: { "vertical-align": "top" } }, [
            ["defs", { $: "gradients" } ],
            [ "g", { $: "lines", style: { cursor: "default" } } ],
            [ "g", {
                $: "handle",
            }, [
                [ "path", {
                    attr: {
                        "d": "M-3,-10L-3,10L3,10L3,-10Z"
                    },
                    style: {
                        "fill": "none",
                        "stroke": "#ccc",
                        "stroke-width": 3,
                        "pointer-events": "all",
                        "cursor": "move",
                        "shape-rendering": "crispEdges"
                    }
                } ],
                [ "path", {
                    attr: {
                        "d": "M-3,-10L-3,10L3,10L3,-10Z"
                    },
                    style: {
                        "fill": "none",
                        "stroke": "#444",
                        "pointer-events": "all",
                        "cursor": "move",
                        "shape-rendering": "crispEdges"
                    }
                } ]
            ]]
        ]]
    ]);

    var scale = d3.scale.linear().domain(range).range([8, width - 8]);

    var line_width = Math.floor(15 / colors.length);
    var yoffset = function(d, i) {
        return 14 + (i - (colors.length - 1) / 2) * line_width - line_width / 2;
    };
    var gradient_id = function(d) {
        return getObjectUniqueID(sel.node()) + "-gradient-stop-" + d.toString().replace(/[^0-9a-zA-Z]/g, "");
    };

    var sel_gradients = tree.gradients.selectAll("linearGradient").data(colors);
    sel_gradients.enter().append("linearGradient");
    sel_gradients.exit().remove();
    sel_gradients.attr({
        "id": gradient_id,
        "x1": "0%", "y1": "50%", "x2": "100%", "y2": "50%"
    });
    var sel_gradients_stops = sel_gradients.selectAll("stop").data(function(d) {
        var colors = [];
        for(var k = 0; k <= 10; k++) {
            var value = -(k / 10 * (range[1] - range[0]) + range[0]);
            colors.push(Styles.prepareHighlightColor({ mode: "brighter-darker", value: value }, d));
        }
        return colors;
    });
    sel_gradients_stops.enter().append("stop");
    sel_gradients_stops.exit().remove();
    sel_gradients_stops.attr({
        "offset": function(d, i) { return i / 10 * 100 + "%"; },
        "stop-color": function(d) { return d; },
        "stop-opacity": 1
    });

    var sel_lines = tree.lines.selectAll("rect").data(colors)
    sel_lines.enter().append("rect");
    sel_lines.exit().remove();
    sel_lines.attr({
        x: 8, width: width - 16,
        y: yoffset, height: line_width
    }).style({
        "fill": function(d) { return "url(#" + gradient_id(d) + ")"; },
        "stroke": "none",
        "shape-rendering": "crispEdges"
    });

    var current_value = value;

    tree.handle
        .on("mousedown", function() {
            var x0 = d3.event.pageX;
            var v0 = current_value;
            setupDragHandlers({
                mousemove: function() {
                    var x1 = d3.event.pageX;
                    var newvalue = scale.invert(scale(v0) + x1 - x0);
                    if(Math.abs(newvalue) < 0.1) newvalue = 0;
                    if(newvalue > range[1]) newvalue = range[1];
                    if(newvalue < range[0]) newvalue = range[0];
                    onchange(newvalue);
                    current_value = newvalue;
                    update_handle();
                }
            });
        });
    // tree.lines
    //     .on("mousedown", function() {
    //         var x0 = d3.event.pageX;
    //         var v0 = current_value;
    //         setupDragHandlers({
    //             mousemove: function() {
    //                 var x1 = d3.event.pageX;
    //                 var newvalue = scale.invert(scale(v0) + x1 - x0);
    //                 if(Math.abs(newvalue) < 0.1) newvalue = 0;
    //                 if(newvalue > range[1]) newvalue = range[1];
    //                 if(newvalue < range[0]) newvalue = range[0];
    //                 onchange(newvalue);
    //                 current_value = newvalue;
    //                 update_handle();
    //             }
    //         });
    //     });

    var update_handle = function() {
        tree.handle.attr("transform", "translate(" + scale(current_value) + ", 14)");
    };

    update_handle();
};

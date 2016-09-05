// InputWidget.

import "expression-widgets.js";

var ExpressionFunctions = {
    "Sum": {
        f: function() { return d3.sum(Array.prototype.slice.call(arguments)); },
        description: "Calculate the sum of values.",
        args: [ "Value*:Values" ],
        kwargs: {
            "Filter": "Only on items matching the given criterion."
        }
    }
};

var InputWidgetContext = function(schema) {
    this.columns = schema.columns;
};



var InputWidget = function(container) {
    this.style = {
        font_family: "Helvetica, Arial, sans-serif",
        font_size: 16,
        line_height: 20,
        height: 20,
    };

    this.canvas = document.createElement("canvas");
    this.canvas_context = this.canvas.getContext("2d");

    this.container = container;
    this.container
    .attr("contentEditable", true)
    .attr("class", "chartaccent-input-widget")
    .style({
        "-webkit-user-modify": "read-write-plaintext-only",
        "outline": "none",
        "font-family": this.style.font_family,
        "font-size": this.style.font_size + "px",
        "line-height": this.style.line_height + "px",
        "height": this.style.height + "px",
        "padding": "2px 5px",
        "display": "inline-block",
        "border": "1px solid #AAA",
        "box-shadow": "0 0 3px rgba(0,0,0,0.2) inset"
    });

    this.container.on("keydown", function() {
        console.log(d3.event.keyCode);
    });
    this.container.on("focus", this._handleInputEvent.bind(this, "focus"));
    this.container.on("blur", this._handleInputEvent.bind(this, "blur"));
    this.container.on("mouseup", this._handleInputEvent.bind(this, "mouseup"));
    this.container.on("keyup", this._handleInputEvent.bind(this, "keyup"));
    this.container.on("keydown", this._handleInputEvent.bind(this, "keydown"));
    this.container.on("paste", this._handleInputEvent.bind(this, "paste"));
    this.container.on("input", this._handleInputEvent.bind(this, "input"));
    this.container.on("select", this._handleInputEvent.bind(this, "select"));
    this.container.on("selectstart", this._handleInputEvent.bind(this, "selectstart"));

    this.expression = null;

    this._createSuggestionContainers();
};

InputWidget.prototype._handleInputEvent = function(event_type) {
    console.log("ROOT:" + event_type);

    var sel = window.getSelection();

    if(event_type == "blur") {
        this._changeCursor(null, null, null);
    } else if(sel && sel.type == "Caret") {
        var fnode = sel.focusNode;
        if(fnode instanceof Text) {
            var range = document.createRange();
            range.selectNodeContents(fnode);
            var client_rect = range.getClientRects();
            console.log(client_rect);
            client_rect = client_rect[0];

            var offset = this._measureText(fnode.textContent.substr(0, sel.focusOffset));

            fnode.caInsertPosition = sel.focusOffset;
            this._changeCursor(fnode, client_rect.left + offset, client_rect.top + client_rect.height + 5);
        } else {
            this._changeCursor(null, null, null);
        }
    }
};



InputWidget.prototype._raise = function() {
    Events.raise(this, "expression", this.expression);
};

InputWidget.prototype._measureText = function(text) {
    this.canvas_context.font = this.style.font_size + "px " + this.style.font_family;
    return this.canvas_context.measureText(text).width;
};

InputWidget.prototype.setContext = function(context) {
    this.context = context;
};

InputWidget.prototype._createSuggestionContainers = function() {
    this.suggestion_container = d3.select("body").append("chartaccent-suggestions")
    var left = this.suggestion_container.append("div")
    .style({
        "float": "left"
    });
    var right = this.suggestion_container.append("div")
    .style({
        "float": "left"
    });
    this.suggestion_container.append("div")
    .style({ "clear": "both" });

    left.append("h4").text("Columns")
    right.append("h4").text("Functions")

    this.suggestion_container.div_columns = left.append("div").attr("class", "columns item-list");
    this.suggestion_container.div_functions = right.append("div").attr("class", "functions item-list");
    this.suggestion_container.on("mousedown", function() {
        d3.event.preventDefault();
    });
};
InputWidget.prototype._renderSuggestion = function(element) {
    var self = this;
    var s = this.suggestion_container.div_columns.selectAll("div").data(this.context.columns);
    s.enter().append("div");
    s.exit().remove();
    s.text(function(d) { return d.name; });
    s.on("click", function(d) {
        if(element instanceof Text) {
            var position = element.caInsertPosition;
            var text = element.textContent;
            var v1 = text.substr(0, position);
            var v2 = text.substr(position);
            var parent = element.parentNode;
            var span_new = document.createElement("span");
            parent.insertBefore(span_new, element);
            var text_v2 = document.createTextNode("");
            parent.insertBefore(text_v2, span_new);

            element.textContent = v2;
            text_v2.textContent = v1;

            var enew = ExpressionWidgets.Create(this, d3.select(span_new), {
                type: "column",
                column: d.name
            });
            self.suggestion_container.style("display", "none");
        }
    });
};

InputWidget.prototype._changeCursor = function(node, offset_x, offset_y) {
    this.suggestion_container.style("display", "none");
    if(this.timer_do_change_cursor) {
        clearTimeout(this.timer_do_change_cursor);
    }
    this.timer_do_change_cursor = setTimeout(function() {
        if(node === null || offset_x === null || offset_y === null) {
            this.suggestion_container.style("display", "none");
        } else {
            this.suggestion_container
            .style({
                "display": "block",
                "left": Math.round(offset_x) + "px",
                "top": Math.round(offset_y) + "px"
            });
            this._renderSuggestion(node);
        }
    }.bind(this), 300);
};

InputWidget.prototype._renderExpression = function(container, expression) {
    var self = this;
    var element = ExpressionWidgets.Create(this, container, expression);
    // Events.on(element, "cursor", function(subelement, offset_x, offset_y) {
    //     self._changeCursor(subelement, offset_x, offset_y);
    // });
    return element;
};

InputWidget.prototype.setExpression = function(expression) {
    var self = this;
    this.container.selectAll("*").remove();
    this.expression = expression;

    var element = this._renderExpression(this.container, this.expression);

    Events.on(element, "change", function() {
        console.log(expression);
    });
    Events.on(element, "remove", function(new_expr) {
        self.setExpression({ type: "string", "value": "" });
    });
    Events.on(element, "replace", function(new_expr) {
        self.setExpression(new_expr);
    });
};

Module.InputWidget = InputWidget;
Module.InputWidgetContext = InputWidgetContext;

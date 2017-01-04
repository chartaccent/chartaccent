var ExpressionWidgets = { };

ExpressionWidgets.Create = function(owner, container, expression) {
    var WidgetClass = ExpressionWidgets[expression.type];
    return new WidgetClass(owner, container, expression);
};

ExpressionWidgets.string = function(owner, container, expression) {
    this.owner = owner;
    this.expression = expression;
    this.current_cursor_position = null;
    this.current_selection_start = null;

    var self = this;
    var input = container.append("span")
    .text(expression.value);
    this.input = input;
};

// ExpressionWidgets.string = function(owner, container, expression) {
//     this.owner = owner;
//     this.expression = expression;
//     this.current_cursor_position = null;
//     this.current_selection_start = null;

//     var self = this;
//     var input = container.append("span")
//     .text(expression.value)
//     .style({
//         "border": "none", "outline": "none", "margin": "none", "padding": "none",
//         "font-family": owner.style.font_family,
//         "font-size": owner.style.font_size + "px",
//         "line-height": owner.style.line_height + "px",
//         "height": owner.style.height + "px",
//         "background": "#F0F0F0",
//         "min-width": "5px",
//         "display": "inline-block"
//     });
//     input.node().caHandleInputEvent = this._handleChange.bind(this);
//     this.input = input;
// };
// ExpressionWidgets.string.prototype.doInsert = function(expression) {
//     if(this.current_selection_start !== null) {
//         var v1 = this.expression.value.substr(0, this.current_selection_start);
//         var v2 = this.expression.value.substr(this.current_selection_start);

//         var sequence = []

//         if(v1.length != 0) sequence.push({ type: "string", value: v1 });
//         sequence.push(expression);
//         if(v2.length != 0) sequence.push({ type: "string", value: v2 });

//         Events.raise(this, "replace", {
//             type: "concat",
//             sequence: sequence
//         });
//     }
// };
// ExpressionWidgets.string.prototype._handleChange = function(event_type) {
//     console.log("Event: " + event_type);
//     if(this.expression.value != this.input.text()) {
//         this.expression.value = this.input.text();
//         if(this.expression.value == "") {
//             Events.raise(this, "remove");
//         } else {
//             Events.raise(this, "change");
//         }
//     }
//     var sel = window.getSelection();
//     if(sel && event_type != "blur") {
//         var focus_node = sel.focusNode;
//         while(focus_node && focus_node != this.input.node()) {
//             focus_node = focus_node.parentNode;
//         }
//         if(focus_node == this.input.node()) {
//             var selection_start = sel.focusOffset;
//             var offset = this.owner._measureText(this.input.text().substr(0, selection_start));
//             var left = this.input.node().getBoundingClientRect().left + offset;
//             var top = this.input.node().getBoundingClientRect().top + this.input.node().getBoundingClientRect().height;
//             this.current_selection_start = selection_start;
//             if(left != this.current_cursor_position) {
//                 this.current_cursor_position = left;
//                 Events.raise(this, "cursor", this, left, top);
//             }
//             return;
//         }
//     }
//     if(null !== this.current_cursor_position) {
//         this.current_cursor_position = null;
//         this.current_selection_start = null;
//         Events.raise(this, "cursor", null, null, null);
//     }
// };

ExpressionWidgets.concat = function(owner, container, expression) {
    this.owner = owner;
    this.expression = expression;
    var self = this;

    expression.sequence.forEach(function(subexpression, index) {
        var subcontainer = container.append("span");
        var element = ExpressionWidgets.Create(owner, subcontainer, subexpression);
        // var do_replace = function(new_expression) {
        //     expression.sequence[index] = new_expression;
        //     subcontainer.selectAll("*").remove();
        //     element = ExpressionWidgets.Create(owner, subcontainer, new_expression);

        //     Events.on(element, "cursor", Events.raise.bind(Events, self, "cursor"));
        //     Events.on(element, "replace", do_replace);
        //     Events.raise(self, "change");
        // }
        // Events.on(element, "cursor", Events.raise.bind(Events, self, "cursor"));
        // Events.on(element, "replace", do_replace);
        // Events.on(element, "remove", function() {
        //     expression.sequence.splice(index, 1);
        //     var previous_string_item = null;
        //     var new_sequence = [];
        //     for(var i = 0; i < expression.sequence.length; i++) {
        //         var si = expression.sequence[i];
        //         if(si.type == "string") {
        //             if(!previous_string_item) {
        //                 previous_string_item = si;
        //             } else {
        //                 previous_string_item.value += si.value;
        //             }
        //         } else {
        //             if(previous_string_item) {
        //                 if(previous_string_item.value != "") {
        //                     new_sequence.push(previous_string_item);
        //                 }
        //                 previous_string_item = null;
        //             }
        //             new_sequence.push(si);
        //         }
        //     }
        //     if(previous_string_item) {
        //         if(previous_string_item.value != "") {
        //             new_sequence.push(previous_string_item);
        //         }
        //     }
        //     expression.sequence = new_sequence;
        //     if(expression.sequence.length == 0) {
        //         Events.raise(self, "remove", expression);
        //     } else {
        //         Events.raise(self, "replace", expression);
        //     }
        // });
    });
};

ExpressionWidgets.function = function(owner, container, expression) {
};

ExpressionWidgets.column = function(owner, container, expression) {
    this.owner = owner;
    this.expression = expression;
    var self = this;

    container.append("span").text(expression.column)
    .attr("tabIndex", 0)
    .attr("contentEditable", false)
    .style({
        "-webkit-user-select": "none",
        "background": "#1f77b4",
        "color": "white",
        "padding": "0 2px",
        "border-radius": "2px",
        "display": "inline-block",
        "cursor": "pointer",
        "outline": "none",
        "margin": "0 2px"
    })
    .on("focus", function() {
        d3.select(this).style({
            "background": "#ff7f0e"
        });
    })
    .on("blur", function() {
        d3.select(this).style({
            "background": "#1f77b4"
        });
    })
    .on("keydown", function() {
        if(d3.event.keyCode == 8) {
            Events.raise(self, "remove");
            d3.event.preventDefault();
        }
    });
};

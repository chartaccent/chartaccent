ChartElements.legend = function(owner, info) {
    this.owner = owner;
    this.name = info.name;
    this.elements = [];
    this.bubbleset = info.bubbleset;
    this.default_label = info.default_label;
    this.default_label_mode = info.default_label_mode;
};

ChartElements.legend.prototype.setItems = function(items) {
    this.elements = items.map(function(d) {
        return {
            items: d.items,
            name: d.name,
            rect: d.rect,
            color: d.color
        };
    });
};

ChartElements.legend.prototype.select = function(p) {
    var min_distance = null, min_element;
    for(var i = 0; i < this.elements.length; i++) {
        var rect = this.elements[i].rect;
        var d = Geometry.pointRectDistance(p, rect[0], rect[1], rect[3], rect[2]);
        if(min_distance === null || d < min_distance) {
            min_distance = d;
            min_element = this.elements[i];
        }
    }
    if(min_distance !== null && min_distance < 10) {
        return {
            distance: min_distance,
            element: min_element
        };
    } else {
        return null;
    }
};

ChartElements.legend.prototype.render = function(g, selection) {
    if(!selection) return;
    var rect = selection.element.rect;
    var sel_elements = g.selectAll("path").data([ rect ]);
    sel_elements.enter().append("path");
    sel_elements.exit().remove();
    sel_elements.attr("d", function(r) {
        return Geometry.Path.polylineClosed(r[0], r[1], r[3], r[2]);
    });
    sel_elements.style({
        "fill": Colors.selection_hint_fill_color,
        "fill-opacity": 0.1,
        "stroke": Colors.selection_hint_color,
        "stroke-width": 2
    });
};

ChartElements.legend.prototype.beginCreation = function(layer_hint, selection, callback) {
    return {
        isClickOnly: true,
        mouseup: function() {
            var element = selection.element;
            var default_label_mode = "item-label";
            var components = [
                {
                    type: default_label_mode == "item-label" ? "item-label" : "label",
                    text: default_label_mode == "label" ? new Expression.String(element.name) : Expression.parse("value"),
                    visible: true,
                    anchor: "m,tt",
                    style: Styles.createDefault(default_label_mode == "item-label" ? "item-label" : "label")
                },
                {
                    type: "highlight",
                    style: Styles.createDefault("highlight"),
                    segment: selection.segment
                }
            ];

            if(this.bubbleset !== undefined) {
                var bubbleset = {
                    visible: this.bubbleset == "default-on",
                    type: "bubbleset",
                    visible: false,
                    style: Styles.createDefault("bubbleset")
                };
                if(element.color) {
                    bubbleset.style.fill = element.color.clone();
                    bubbleset.style.fill.a = 0.5;
                }
                components.push(bubbleset);
            }
            var target_items = element.items.map(function(item) {
                return {
                    elements: this.owner.chart_elements.filter(function(d) { return d.name == item.series; })[0],
                    items: item.items.slice()
                }
            }.bind(this));

            if((d3.event.ctrlKey || d3.event.shiftKey) && this.owner.addItemsToCurrentAnnotation(target_items)) {
                // Successfully added, do nothing and return.
                return;
            } else {
                callback(new Annotation({
                    target: {
                        type: "items",
                        items: target_items
                    },
                    components: components
                }));
            }
        }.bind(this)
    };
};

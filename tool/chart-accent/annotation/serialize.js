/*

interface Point {
    x: number;
    y: number;
}

interface Rect {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}

interface AnnotationTarget {
    type: "range" | "items" | "freeform";
    // Range:
    range?: Expression;
    // Items:
    items?: {
        elements: ChartElements;
        items: DataItem[];
    }[];
    // Freeform:
    point?: Point;
    line?: [ Point, Point ];
    rect?: Rect;
}

interface Annotation {
    target: AnnotationTarget;
    target_inherit: AnnotationTargetInherit;
    components: AnnotationComponent[];
}

*/

Annotation.prototype.serializeTarget = function(ctx, target) {
    return {
        _id: ctx.assignOrGetTargetID(target),
        type: target.type,
        point: deepClone(target.point),
        rect: deepClone(target.rect),
        line: deepClone(target.line),
        axis: target.axis ? ctx.getChartElementsID(target.axis) : undefined,
        range: target.range ? target.range.toString() : undefined,
        items: target.items ? target.items.map(function(item) {
            return {
                elements: ctx.getChartElementsID(item.elements),
                items: item.items.map(function(d) {
                    return ctx.getDataItemID(d);
                })
            };
        }) : undefined
    }
}

Annotation.prototype.serializeTargetInherit = function(ctx, target_inherit) {
    if(target_inherit == undefined) return undefined;
    return {
        mode: target_inherit.mode,
        serieses: target_inherit.serieses.map(function(s) {
            return ctx.getChartElementsID(s);
        })
    }
}

Annotation.prototype.deserializeTargetInherit = function(ctx, target_inherit) {
    if(target_inherit == undefined) return undefined;
    return {
        mode: target_inherit.mode,
        serieses: target_inherit.serieses.map(function(s) {
            return ctx.getChartElementsByID(s);
        })
    }
}

Annotation.prototype.serialize = function(ctx) {
    var self = this;
    return {
        target: this.serializeTarget(ctx, this.target),
        target_inherit: this.serializeTargetInherit(ctx, this.target_inherit),
        components: this.components.map(function(c) {
            return self.serializeComponent(ctx, c);
        }),
        visible: this.visible,
        id: this.id
    };
};

Annotation.prototype.serializeStyle = function(ctx, style) {
    if(style == undefined) return undefined;
    return Styles.serializeStyle(style);
}

Annotation.prototype.deserializeStyle = function(ctx, style) {
    if(style == undefined) return undefined;
    return Styles.deserializeStyle(style);
}

Annotation.prototype.serializeComponent = function(ctx, component) {
    if(!component) return component;
    var r = {
        type: component.type,
        visible: component.visible,
        style: this.serializeStyle(ctx, component.style)
    };
    if(component.type == "label" || component.type == "item-label") {
        r.text = Expression.toStringExpression(component.text);
        r.anchor = deepClone(component.anchor);
        r.anchor_offset = deepClone(component.anchor_offset);
    }
    if(component.type == "bubbleset") {
        r.sigma = component.sigma;
    }
    if(component.type == "shape.image") {
        r.image = component.image;
        r.opacity = component.opacity;
    }
    if(component.type == "shape.line") {
        r.arrow = component.arrow;
        r.arrow_size = component.arrow_size;
    }
    return r;
    // if(component.type == "range") this.renderComponentRange(RC, RC2, component);
    // if(component.type == "range-line") this.renderComponentRange(RC, RC2, component);
    // if(component.type == "label") this.renderComponentLabel(RC, RC2, component);
    // if(component.type == "item-label") this.renderComponentItemLabel(RC, RC2, component);
    // if(component.type == "highlight") this.renderComponentHighlight(RC, RC2, component);
    // if(component.type == "highlight-line") this.renderComponentHighlightLine(RC, RC2, component);
    // if(component.type == "trendline") this.renderComponentTrendline(RC, RC2, component);
    // if(component.type.substr(0, 6) == "shape.") this.renderComponentShape(RC, RC2, component);
};

Annotation.prototype.deserializeComponent = function(ctx, serialized) {
    var r = {
        type: serialized.type,
        visible: serialized.visible,
        style: this.deserializeStyle(ctx, serialized.style)
    };
    if(serialized.type == "label" || serialized.type == "item-label") {
        r.text = Expression.parseStringExpression(serialized.text);
        r.anchor = deepClone(serialized.anchor);
        r.anchor_offset = deepClone(serialized.anchor_offset);
    }
    if(serialized.type == "bubbleset") {
        r.sigma = serialized.sigma;
    }
    if(serialized.type == "shape.image") {
        r.image = serialized.image;
        r.opacity = serialized.opacity;
    }
    if(serialized.type == "shape.line") {
        r.arrow = serialized.arrow;
        r.arrow_size = serialized.arrow_size;
    }
    return r;
};

Annotation.deserialize = function(ctx, serialized) {
    var annotation = Object.create(Annotation.prototype);
    annotation.target = ctx.getTargetByID(serialized.target._id, {
        type: serialized.target.type,
        point: deepClone(serialized.target.point),
        rect: deepClone(serialized.target.rect),
        line: deepClone(serialized.target.line),
        axis: serialized.target.axis ? ctx.getChartElementsByID(serialized.target.axis) : undefined,
        range: serialized.target.range ? Expression.parse(serialized.target.range) : undefined,
        items: serialized.target.items ? serialized.target.items.map(function(item) {
            return {
                elements: ctx.getChartElementsByID(item.elements),
                items: item.items.map(function(d) {
                    return ctx.getDataItemByID(d);
                })
            };
        }) : undefined
    });
    if(serialized.target_inherit != null) {
        annotation.target_inherit = annotation.deserializeTargetInherit(ctx, serialized.target_inherit);
    }
    annotation.components = serialized.components.map(function(c) {
        return annotation.deserializeComponent(ctx, c);
    });
    annotation.id = serialized.id;
    annotation.visible = serialized.visible;
    return annotation;
};
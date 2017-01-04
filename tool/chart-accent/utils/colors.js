var RGBColor = function(r, g, b, a) {
    if(r instanceof RGBColor) {
        this.r = r.r;
        this.g = r.g;
        this.b = r.b;
        this.a = r.a;
    } else if(typeof(r) == "string") {
        var str = r.trim();
        if(str.substr(0, 1) == "#") {
            if(str.length == 7) {
                this.r = parseInt(str.substr(1, 2), 16);
                this.g = parseInt(str.substr(3, 2), 16);
                this.b = parseInt(str.substr(5, 2), 16);
                this.a = g === undefined ? 1.0 : parseFloat(g);
                return;
            } else if(str.length == 4) {
                this.r = parseInt(str.substr(1, 1), 16) * 0x11;
                this.g = parseInt(str.substr(2, 1), 16) * 0x11;
                this.b = parseInt(str.substr(3, 1), 16) * 0x11;
                this.a = g === undefined ? 1.0 : parseFloat(g);
                return;
            }
        } else if(str.substr(0, 5) == "rgba(") {
            var value = str.substr(5, str.length - 5 - 1)
                .split(",").map(function(s) { return s.trim(); });
            this.r = parseInt(value[0]);
            this.g = parseInt(value[1]);
            this.b = parseInt(value[2]);
            this.a = parseFloat(value[3]);
            if(this.a > 1) this.a = 1;
            if(this.a < 0) this.a = 0;
            return;

        } else if(str.substr(0, 4) == "rgb(") {
            var value = str.substr(4, str.length - 4 - 1)
                .split(",").map(function(s) { return s.trim(); });
            this.r = parseInt(value[0]);
            this.g = parseInt(value[1]);
            this.b = parseInt(value[2]);
            this.a = g === undefined ? 1.0 : parseFloat(g);
            return;
        }
        throw new Error("invalid color");
    } else {
        this.r = r !== undefined ? parseInt(r) : 0;
        this.g = g !== undefined ? parseInt(g) : 0;
        this.b = b !== undefined ? parseInt(b) : 0;
        this.a = a !== undefined ? parseFloat(a) : 1.0;
        if(this.a > 1) this.a = 1;
        if(this.a < 0) this.a = 0;
    }
};

RGBColor.prototype.clone = function() {
    return new RGBColor(this.r, this.g, this.b, this.a);
};

RGBColor.prototype.over = function(dest) {
    var a = this.a + dest.a * (1 - this.a);
    if(a == 0) {
        return new RGBColor(0, 0, 0, 0);
    } else {
        var r = (this.r * this.a + dest.r * dest.a * (1 - this.a)) / a;
        var g = (this.g * this.a + dest.g * dest.a * (1 - this.a)) / a;
        var b = (this.b * this.a + dest.b * dest.a * (1 - this.a)) / a;
        return new RGBColor(r, g, b, a);
    }
};

RGBColor.prototype.mix = function(color2, t) {
    return new RGBColor(
        this.r + t * (color2.r - this.r),
        this.g + t * (color2.g - this.g),
        this.b + t * (color2.b - this.b),
        this.a + t * (color2.a - this.a)
    );
};

RGBColor.prototype.brighter = function(t) {
    if(t > 0) {
        return this.mix(new RGBColor(255, 255, 255, 1), t);
    } else {
        return this.mix(new RGBColor(0, 0, 0, 1), -t);
    }
};

RGBColor.prototype.toString = function(alpha) {
    if(alpha !== undefined) {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + alpha + ")";
    } else {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    }
};

RGBColor.prototype.clone = function() {
    return new RGBColor(this.r, this.g, this.b, this.a);
};

var Colors = {
    selection_hint_color: new RGBColor("#ff7f0e"),
    selection_hint_fill_color: new RGBColor("#888")
};

Module.setColor = function(key, value) {
    Colors[key] = new RGBColor(value);
};

var Images = { };

(function() {
    import base64 "../images/image-placeholder.png" as image;
    Images.image_placeholder = "data:image/png;base64," + image;
})();

var Styles = {
    serializeColorInfo: function(color) {
        if(color == null) return null;
        if(color instanceof RGBColor) {
            return { r: color.r, g: color.g, b: color.b, a: color.a };
        }
        return deepClone(color);
    },
    deserializeColorInfo: function(serialized) {
        if(serialized == null) return null;
        if(serialized.r !== undefined) {
            return new RGBColor(serialized.r, serialized.g, serialized.b, serialized.a);
        }
        return deepClone(serialized);
    },
    serializeStyle: function(style) {
        return {
            fill: Styles.serializeColorInfo(style.fill),
            paint_order: style.paint_order,
            stroke: Styles.serializeColorInfo(style.stroke),
            stroke_width: style.stroke_width,
            line_stroke: Styles.serializeColorInfo(style.line_stroke),
            line_stroke_width: style.line_stroke_width,
            font_family: style.font_family,
            font_size: style.font_size,
            arrow: style.arrow
        };
    },
    deserializeStyle: function(style) {
        return {
            fill: Styles.deserializeColorInfo(style.fill),
            paint_order: style.paint_order,
            stroke: Styles.deserializeColorInfo(style.stroke),
            stroke_width: style.stroke_width,
            line_stroke: Styles.deserializeColorInfo(style.line_stroke),
            line_stroke_width: style.line_stroke_width,
            font_family: style.font_family,
            font_size: style.font_size,
            arrow: style.arrow
        };
    },
    fillDefault: function(obj) {
        if(obj.fill === undefined) obj.fill = new RGBColor("#000");
        if(obj.stroke === undefined) obj.stroke = new RGBColor("#000");
        if(obj.stroke_width === undefined) obj.stroke_width = 1;
        // if(obj.stroke_opacity === undefined) obj.stroke_opacity = 1;
        // if(obj.fill_opacity === undefined) obj.fill_opacity = 1;
        // if(obj.paint_order === undefined) obj.paint_order = "fill";
        // if(obj.blending_mode === undefined) obj.blending_mode = "normal";
        if(obj.font_family === undefined) obj.font_family = "Helvetica";
        if(obj.font_size === undefined) obj.font_size = 14;
        return obj;
    },
    applyStyle: function(style, selection) {
        selection.style({
            "fill": style.fill !== null ? style.fill : "none",
            "stroke": style.stroke !== null ? style.stroke : "none",
            "stroke-width": style.stroke_width
        });
    },
    prepareHighlightColor: function(color, original) {
        if(color === null) return "none";
        if(color instanceof RGBColor) return color;
        if(color.mode == "brighter") {
            // return chroma.mix(new RGBColor(original).toString(), "#FFF", color.value, 'lab');
            return new RGBColor(255, 255, 255, color.value).over(new RGBColor(original));
        } else if(color.mode == "darker") {
            // return chroma.mix(new RGBColor(original).toString(), "#000", color.value, 'lab');
            return new RGBColor(0, 0, 0, color.value).over(new RGBColor(original));
        } else if(color.mode == "brighter-darker") {
            if(color.value > 0) {
                return new RGBColor(255, 255, 255, color.value).over(new RGBColor(original));
            } else {
                return new RGBColor(0, 0, 0, -color.value).over(new RGBColor(original));
            }
        }
        return "none";
    },
    createDefault: function(type) {
        if(type == "range") {
            return {
                fill: new RGBColor("#EEE", 1),
                stroke: null,
                stroke_width: 1
            };
        }
        if(type == "range-line") {
            return {
                fill: null,
                stroke: new RGBColor("#000"),
                fill_opacity: 1,
                stroke_width: 1
            };
        }
        if(type == "label") {
            return {
                fill: new RGBColor("#000"),
                stroke: null,
                stroke_width: 2,
                font_family: "Helvetica",
                font_size: 14
            };
        }
        if(type == "item-label") {
            return {
                fill: new RGBColor("#000"),
                stroke: new RGBColor("#FFF"),
                stroke_width: 2,
                paint_order: "stroke",
                font_family: "Helvetica",
                font_size: 14
            };
        }
        if(type == "highlight") {
            return {
                fill: { mode: "brighter-darker", value: 0.2 },
                stroke: { mode: "brighter-darker", value: -1 },
                stroke_width: 2,
                line_stroke: { mode: "brighter-darker", value: -0.2 },
                line_stroke_width: 3
            };
        }
        if(type == "highlight-all") {
            return {
                fill: { mode: "brighter-darker", value: 0 },
                stroke: null,
                stroke_width: 2,
                line_stroke: { mode: "brighter-darker", value: 0 },
                line_stroke_width: 2
            };
        }
        if(type == "trendline") {
            return {
                fill: null,
                stroke: new RGBColor("#000"),
                stroke_width: 2
            };
        }
        if(type == "bubbleset") {
            return {
                fill: new RGBColor("#888"),
                stroke: null,
                stroke_width: 2
            };
        }
        if(type == "black") {
            return {
                fill: new RGBColor("#000"),
                stroke: new RGBColor("#000"),
                stroke_width: 3
            };
        }
        if(type == "shape.rect" || type == "shape.oval") {
            return {
                fill: new RGBColor("#000", 0.1),
                stroke: new RGBColor("#000"),
                stroke_width: 2
            };
        }
        if(type == "shape.line") {
            return {
                fill: null,
                stroke: new RGBColor("#000"),
                stroke_width: 2,
                arrow: "end"
            };
        }
    }
};

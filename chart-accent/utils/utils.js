import "events.js";
import "dependency-manager.js";
import "geometry.js";
import "scales.js";
import "colors.js";
import "presence.js";

function getRootContainer() {
    if(Module.rootContainer) {
        return d3.select(Module.rootContainer);
    } else {
        return d3.select(document.body);
    }
}

Module.setRootContainer = function(e) {
    Module.rootContainer = e;
}

function isArray(o) { return o instanceof Array; }
function isObject(o) { return o instanceof Object; }
function isNone(o) { return o === null || o === undefined; }
function isNumber(o) { return typeof(o) == "number"; }
function isString(o) { return typeof(o) == "string"; }

function deepEquals(a, b) {
    if(a === b) return true;

    if(isArray(a) && isArray(b)) {
        if(a.length != b.length) return false;
        return a.every(function(a, i) {
            return deepEquals(a, b[i]);
        });
    }
    if(isObject(a) && isObject(b)) {
        for(var key in a) {
            if(a.hasOwnProperty(key) && b.hasOwnProperty(key)) {
                if(!deepEquals(a[key], b[key])) return false;
            }
        }
        for(var key in b) {
            if(!a.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
    return a === b;
}

function deepClone(x) {
    if(x == null) return x;
    return JSON.parse(JSON.stringify(x));
}

function generateGUID() {
    var S4 = function() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

var object_unique_ids = new WeakMap();
var obj_unique_id_index = 0;
function getObjectUniqueID(obj) {
    if(object_unique_ids.has(obj)) return object_unique_ids.get(obj);
    var id = "_uniqueid_" + obj_unique_id_index;
    obj_unique_id_index += 1;
    object_unique_ids.set(obj, id);
    return id;
}

function resolveToSVGSelection(item) {
    if(item instanceof d3.selection) return item;
    return d3.select(item);
}

function appendOnlyOnce_OLD(g, tag, classname) {
    var selector = tag;
    if(classname !== undefined) selector += "." + classname;
    var sel = g.selectAll(selector).data(function(d) { return [d]; });
    if(classname !== undefined) {
        sel.enter().append(tag).classed(classname, true);
    } else {
        sel.enter().append(tag);
    }
    return sel;
}

// This only append to its children, not internal stuff.
function appendOnlyOnce(g, tag, classname) {
    var selector = tag;
    if(classname !== undefined) selector += "." + classname;
    var sel = g.selectAll(selector).data(function(d) { return [d]; });
    if(classname !== undefined) {
        sel.enter().append(tag).classed(classname, true);
    } else {
        sel.enter().append(tag);
    }
    return sel;
}

function getObjectKeys(obj) {
    var keys = [];
    for(var k in obj) {
        if(obj.hasOwnProperty(k)) keys.push(k);
    }
    return keys;
};

function appendTreeOnce(sel, desc) {
    var result = [];
    var tree_index = 0;
    var tree_prefix = "T-" + getObjectUniqueID(sel.node());
    var make_array = function(parent, array) {
        array.forEach(function(item, i) {
            var name_and_class = item[0];
            var info = { };
            var children = [];
            if(isArray(item[1])) {
                children = item[1];
            } else if(isObject(item[1])) {
                info = item[1];
            }
            if(isArray(item[2])) {
                children = item[2];
            } else if(isObject(item[2])) {
                info = item[2];
            }
            var name = name_and_class.split(".")[0];
            var classname = name_and_class.split(".")[1];
            var s = appendOnlyOnce(parent, name, tree_prefix + tree_index);
            tree_index += 1;
            if(info.$) { result[info.$] = s; }
            if(info.text) { s.text(info.text); }
            if(info.style) { s.style(info.style); }
            if(info.attr) { s.attr(info.attr); }
            if(info.classed) { s.classed(info.classed); }
            if(classname !== undefined) { s.classed(classname, true); }
            if(info.class) { s.classed(info.class, true); }
            make_array(s, children);
        });
    };
    make_array(sel, desc);
    return result;
}

// Always call this in mousedown event handlers.
var setupDragHandlers = function(info) {
    var guid = generateGUID();
    var is_mouse_move = false;
    var x0 = d3.event.pageX;
    var y0 = d3.event.pageY;
    d3.select(window).on("mousemove." + guid, function() {
        d3.event.stopPropagation();
        var x1 = d3.event.pageX;
        var y1 = d3.event.pageY;
        if(is_mouse_move || (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) >= 16) {
            is_mouse_move = true;
            if(info.mousemove) info.mousemove();
        }
    }, true);
    d3.select(window).on("mouseup." + guid, function() {
        d3.select(window).on("mousemove." + guid, null, true);
        d3.select(window).on("mouseup." + guid, null, true);
        if(info.mouseup) info.mouseup();
    }, true);

};

var setupExpressionEditor = function(info) {
    var anchor = info.anchor.getBoundingClientRect();
    if(info.anchor.tagName == "text") {
        var text_anchor = info.anchor.style.textAnchor;
    }
    var body_rect = document.body.parentNode.getBoundingClientRect();
    var font_size = parseFloat(info.anchor.style.fontSize.replace("px", ""));
    var font_family = info.anchor.style.fontFamily;
    var height = font_size + 4;
    var wrapper_width = Math.max(anchor.width, 200);
    var left_offset = 0;
    if(text_anchor == "middle") left_offset = -wrapper_width / 2 + anchor.width / 2;
    if(text_anchor == "end") left_offset = -wrapper_width + anchor.width;
    var wrapper = getRootContainer().append("div").style({
        "position": "absolute",
        "z-index": 1000001,
        "width": wrapper_width + "px",
        "font-family": font_family,
        "font-size": font_size + "px",
        "height": height + "px",
        "line-height": height + "px",
        "left": (anchor.left - body_rect.left + left_offset) + "px",
        "top": (anchor.top - body_rect.top) + "px",
        "padding": "0",
        "margin": "0",
        "background": "white",
        "outline": "1px dashed #AAA",
        "box-shadow": "0 0 2px #AAA",
        "text-align": text_anchor == "middle" ? "center" : (text_anchor == "end" ? "right" : "left")
    });
    wrapper.classed("chartaccent-edit-widget", true);
    var input = wrapper.append("input").style({
        "margin": 0,
        "padding": 0,
        "height": height + "px",
        "line-height": height + "px",
        "outline": "none",
        "border": "none",
        "width": "100%",
        "font-size": font_size + "px",
        "text-align": text_anchor == "middle" ? "center" : (text_anchor == "end" ? "right" : "left")
    }).property("value", Expression.toStringExpression(info.expression));

    var text_measure = document.createElement("canvas");
    var text_measure_ctx = text_measure.getContext("2d");
    text_measure_ctx.font = font_size + "px " + font_family;

    var update_size = function() {
        var wrapper_width = Math.max(anchor.width, text_measure_ctx.measureText(input.property("value")).width + 20);
        var left_offset = 0;
        if(text_anchor == "middle") left_offset = -wrapper_width / 2 + anchor.width / 2;
        if(text_anchor == "end") left_offset = -wrapper_width + anchor.width;
        wrapper.style("width", wrapper_width + "px");
        wrapper.style("left", (anchor.left - body_rect.left + left_offset) + "px");
    };
    update_size();

    input.node().focus();
    input.node().select();
    input.on("blur", function() {
        wrapper.remove();
        try {
            var newexpr = Expression.parseStringExpression(input.property("value"));
        } catch(e) {
        }
        if(newexpr && info.change) info.change(newexpr);
    });
    input.on("input", function() {
        var is_error = false;
        try {
            var newexpr = Expression.parseStringExpression(input.property("value"));
        } catch(e) {
            var msg = e.message;
            is_error = true;
        }
        if(is_error) {
            input.style("background-color", "#FCC");
        } else {
            input.style("background-color", "#FFF");
        }
        update_size();
    });
    input.on("keydown", function() {
        d3.event.stopPropagation();
    });
    input.on("keyup", function() {
        var is_error = false;
        try {
            var newexpr = Expression.parseStringExpression(input.property("value"));
        } catch(e) {
            var msg = e.message;
            is_error = true;
        }
        if(d3.event.keyCode == 13) {
            input.on("blur", null);
            wrapper.remove();
            if(newexpr && info.change) info.change(newexpr);
        }
        if(d3.event.keyCode == 27) {
            input.on("blur", null);
            wrapper.remove();
        }
        update_size();
    });
};

var setupEasyExpressionEditor = function(info) {
    var anchor = info.anchor.getBoundingClientRect();
    if(info.anchor.tagName == "text") {
        var text_anchor = info.anchor.style.textAnchor;
    }
    var body_rect = document.body.parentNode.getBoundingClientRect();
    var font_size = parseFloat(info.anchor.style.fontSize.replace("px", ""));
    var font_family = info.anchor.style.fontFamily;
    var height = font_size + 4;
    var wrapper_width = Math.max(anchor.width, 200);
    var left_offset = 0;
    if(text_anchor == "middle") left_offset = -wrapper_width / 2 + anchor.width / 2;
    if(text_anchor == "end") left_offset = -wrapper_width + anchor.width;
    var wrapper = getRootContainer().append("div").style({
        "position": "absolute",
        "z-index": 1000001,
        "width": wrapper_width + "px",
        "font-family": font_family,
        "font-size": font_size + "px",
        "height": height + "px",
        "line-height": height + "px",
        "left": (anchor.left - body_rect.left + left_offset) + "px",
        "top": (anchor.top - body_rect.top) + "px",
        "padding": "0",
        "margin": "0",
        "background": "white",
        "outline": "1px dashed #AAA",
        "box-shadow": "0 0 2px #AAA",
        "text-align": text_anchor == "middle" ? "center" : (text_anchor == "end" ? "right" : "left")
    });
    var easy_string = Expression.toEasyString(info.expression);
    wrapper.classed("chartaccent-edit-widget", true);
    var input = wrapper.append("input").style({
        "margin": 0,
        "padding": 0,
        "height": height + "px",
        "line-height": height + "px",
        "outline": "none",
        "border": "none",
        "width": "100%",
        "font-size": font_size + "px",
        "text-align": text_anchor == "middle" ? "center" : (text_anchor == "end" ? "right" : "left")
    }).property("value", easy_string.text);

    var text_measure = document.createElement("canvas");
    var text_measure_ctx = text_measure.getContext("2d");
    text_measure_ctx.font = font_size + "px " + font_family;

    var update_size = function() {
        var wrapper_width = Math.max(anchor.width, text_measure_ctx.measureText(input.property("value")).width + 20);
        var left_offset = 0;
        if(text_anchor == "middle") left_offset = -wrapper_width / 2 + anchor.width / 2;
        if(text_anchor == "end") left_offset = -wrapper_width + anchor.width;
        wrapper.style("width", wrapper_width + "px");
        wrapper.style("left", (anchor.left - body_rect.left + left_offset) + "px");
    };
    update_size();

    input.node().focus();
    input.node().select();
    input.on("blur", function() {
        wrapper.remove();
        try {
            var newexpr = Expression.parseEasyString(input.property("value"), easy_string.format);
        } catch(e) {
        }
        if(newexpr && info.change) info.change(newexpr);
    });
    input.on("input", function() {
        var is_error = false;
        try {
            var newexpr = Expression.parseEasyString(input.property("value"), easy_string.format);
        } catch(e) {
            var msg = e.message;
            is_error = true;
        }
        if(is_error) {
            input.style("background-color", "#FCC");
        } else {
            input.style("background-color", "#FFF");
        }
        update_size();
    });
    input.on("keydown", function() {
        d3.event.stopPropagation();
    });
    input.on("keyup", function() {
        var is_error = false;
        try {
            var newexpr = Expression.parseEasyString(input.property("value"), easy_string.format);
        } catch(e) {
            var msg = e.message;
            is_error = true;
        }
        if(d3.event.keyCode == 13) {
            input.on("blur", null);
            wrapper.remove();
            if(newexpr && info.change) info.change(newexpr);
        }
        if(d3.event.keyCode == 27) {
            input.on("blur", null);
            wrapper.remove();
        }
        update_size();
    });
};

var setupClickoutHandlers = function(wrapper, onclickout, parent_clickout) {
    if(!onclickout) onclickout = function() { wrapper.remove(); return true; };

    var guid = generateGUID();

    var context = {
        children: new Set(),
        addChild: function(c) {
            this.children.add(c);
        },
        removeChild: function(c) {
            this.children.delete(c);
        },
        is_in_wrapper: function(target) {
            var result = false;
            var item = target;
            while(item) {
                if(item == wrapper.node()) {
                    result = true;
                    break;
                }
                item = item.parentNode;
            }
            if(result) return true;
            context.children.forEach(function(c) {
                if(c.is_in_wrapper(target)) {
                    result = true;
                }
            });
            return result;
        },
        remove: function() {
            if(parent_clickout) parent_clickout.removeChild(this);
            d3.select(window).on("mousedown." + guid, null);
            d3.select(window).on("contextmenu." + guid, null);
            d3.select(window).on("keydown." + guid, null);
            context.children.forEach(function(c) {
                c.doRemove("parent");
            });
        },
        doRemove: function(type) {
            if(onclickout(type)) {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                context.remove();
                return true;
            } else {
                return false;
            }
        }
    };
    if(parent_clickout) {
        parent_clickout.addChild(context);
    }
    d3.select(window).on("mousedown." + guid, function() {
        if(context.is_in_wrapper(d3.event.target)) return;
        if(context.doRemove("clickout")) {
            // console.log("Added click handler");
            d3.select(window).on("click." + guid, function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                d3.select(window).on("click." + guid, null);
                // console.log("Removed click handler");
            }, true);
        }
    }, true);
    d3.select(window).on("contextmenu." + guid, function() {
        if(context.is_in_wrapper(d3.event.target)) return;
        context.doRemove("clickout");
    }, true);
    d3.select(window).on("keydown." + guid, function() {
        if(context.is_in_wrapper(d3.event.target)) return;
        if(d3.event.keyCode == 27) {
            context.doRemove("escape");
        }
        if(d3.event.keyCode == 8 || d3.event.keyCode == 46) {
            context.doRemove("delete");
        }
    });
    return context;
};

IconFont = {
    addIcon: function(name) {
        return function() {
            if(typeof(name) == "function") {
                this.append("span").attr("class", function(d) { return "chartaccent-icons-" + name(d); });
            } else {
                this.append("span").attr("class", "chartaccent-icons-" + name);
            }
        };
    },
    addIconOnce: function(name) {
        return function() {
            if(typeof(name) == "function") {
                appendOnlyOnce(this, "span").attr("class", function(d) { return "chartaccent-icons-" + name(d); });
            } else {
                appendOnlyOnce(this, "span").attr("class", "chartaccent-icons-" + name);
            }
        };
    },
    iconDesc: function(name) {
        return ["span.chartaccent-icons-" + name]
    },
    svgIcon: function(name) {
        return function() {
            this.text(FONT_chartaccent_icons["chartaccent-icons-" + name]);
            this.style("font-family", "chartaccent_icons");
        };
    },
    icons: FONT_chartaccent_icons
};

Module.IconFont = IconFont;

import "serializer.js";

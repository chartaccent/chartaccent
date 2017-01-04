// Presence(target, [
//     [items, "div.classname", {
//         style: {
//         },
//         attr: {
//         },
//         events: {
//         },
//         children: [
//             ["li.span", { text: "Hello" }]
//         ]
//     }]
// ])

function Presence(target, list, dont_render) {
    this.target = target;
    this.list = list;
    if(!dont_render) {
        this.render();
    }
};

Presence.prototype.render = function() {
    var target = this.target;
    var list = this.list;

    for(var i = 0; i < list.length; i++) {
        var item = list[i];
        target.each(function(d_previous) {
            var target_item = d3.select(this);
            if(item instanceof Function) {
                item = item.apply(null, d_previous);
                target_item.selectAll("*").remove();
            }
            if(typeof(item[0]) == "string") {
                var array = null;
                var selector = item[0];
                var config = item[1];
            } else {
                var array = item[0];
                var selector = item[1];
                var config = item[2];
            }
            var sp = selector.split(".");
            var tagname = sp[0];
            var classname = sp[1];
            var data = [ [] ];
            if(!array) {
                if(d_previous) data = [ d_previous ];
            } else {
                if(d_previous) data = array.map(function(d) { return [d].concat(d_previous); });
                else data = array.map(function(d) { return [d]; });
            }
            var selection = target_item.selectAll(selector).data(data);
            selection.exit().remove();
            var selection_enter = selection.enter().append(tagname);
            if(classname) selection_enter.classed(classname, true);
            if(config) {
                if(config.style) {
                    for(var name in config.style) {
                        var value = config.style[name];
                        if(value instanceof Function) {
                            selection.style(name, function(d) {
                                return value.apply(this, d);
                            });
                        } else {
                            selection.style(name, value);
                        }
                    }
                }
                if(config.classed) {
                    for(var name in config.classed) {
                        var value = config.classed[name];
                        if(value instanceof Function) {
                            selection.classed(name, function(d) {
                                return value.apply(this, d);
                            });
                        } else {
                            selection.classed(name, value);
                        }
                    }
                }
                if(config.attr) {
                    for(var name in config.attr) {
                        var value = config.attr[name];
                        if(value instanceof Function) {
                            selection.attr(name, function(d) {
                                return value.apply(this, d);
                            });
                        } else {
                            selection.attr(name, value);
                        }
                    }
                }
                if(config.text) {
                    var value = config.text;
                    if(value instanceof Function) {
                        selection.text(function(d) {
                            return value.apply(this, d);
                        });
                    } else {
                        selection.text(value);
                    }
                }
                if(config.on) {
                    for(var name in config.on) {
                        var value = config.on[name];
                        if(value instanceof Function) {
                            selection.on(name, function(d) {
                                value.apply(this, d);
                            });
                        } else {
                            selection.on(name, value);
                        }
                    }
                }
                if(config.children) {
                    new Presence(selection, config.children);
                }
            }
        });
    }
};

Module.Presence = Presence;

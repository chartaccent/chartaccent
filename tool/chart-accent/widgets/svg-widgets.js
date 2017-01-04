var Widgets = { };

Widgets.CircularButton = function(info) {
    return function() {
        this.classed("button", true);
        var circle = appendOnlyOnce(this, "circle");
        var text = appendOnlyOnce(this, "text");
        circle.attr("cx", info.x);
        circle.attr("cy", info.y);
        circle.attr("r", info.r);
        text.attr("x", info.x);
        text.attr("y", info.y);
        text.style({
            "alignment-baseline": "central",
            "text-anchor": "middle"
        });
        text.each(function(d) {
            d3.select(this).call(IconFont.svgIcon(info.icon(d)));
        });
        circle.filter(function(d) { return !info.hasBorder(d); }).remove();
    };
};

Widgets.RangeTab = function(info) {
    var width = 15;

    return function() {
        this.classed("chartaccent-range-tab", true);
        var path = appendOnlyOnce(this, "path");
        var btn = this.selectAll("g.button").data(function(d) {
            return info.buttons.map(function(button, i) {
                return [d, button, i];
            });
        });
        btn.enter().append("g").attr("class", "button");
        btn.exit().remove();
        var buttons_t = function(d) {
            var tabwidth = Math.abs(info.t2(d[0]) - info.t1(d[0]));
            if(tabwidth < 22 * info.buttons.length) {
                return (info.t2(d[0]) + info.t1(d[0])) / 2.0;
            } else {
                var shift = d[2] * 22 - (info.buttons.length - 1) * 22 / 2;
                return (info.t2(d[0]) + info.t1(d[0])) / 2.0 + shift;
            }
        };
        var buttons_s = function(d) {
            var tabwidth = Math.abs(info.t2(d[0]) - info.t1(d[0]));
            if(tabwidth < 22) {
                return width + d[2] * 22 + 11;
            } else if(tabwidth < 22 * info.buttons.length) {
                return width + d[2] * 22;
            } else {
                return width / 2;
            }
        };
        var buttons_b = function(d) {
            var tabwidth = Math.abs(info.t2(d[0]) - info.t1(d[0]));
            if(tabwidth < 22) {
                return true;
            }
            return false;
        };
        if(info.orientation == "vertical") {
            path.attr("d", function(d) {
                if(info.t1(d) == info.t2(d)) {
                    return Geometry.Path.tabV(info.t1(d) - 1, info.t2(d) + 1, width + 5, 1);
                } else {
                    return Geometry.Path.tabV(info.t1(d), info.t2(d), width, width);
                }
            });
            btn.call(Widgets.CircularButton({
                x: buttons_s, y: buttons_t,
                r: 8,
                icon: function(d) { return d[1]; },
                hasBorder: buttons_b
            }));
        } else {
            path.attr("d", function(d) {
                if(info.t1(d) == info.t2(d)) {
                    return Geometry.Path.tabH(info.t1(d) - 1, info.t2(d) + 1, -width - 5, 1);
                } else {
                    return Geometry.Path.tabH(info.t1(d), info.t2(d), -width, width);
                }
            });
            btn.call(Widgets.CircularButton({
                x: buttons_t,
                y: function(d) { return -buttons_s(d); },
                r: 8,
                icon: function(d) { return d[1]; },
                hasBorder: buttons_b
            }));
        }
        if(info.buttonActive) {
            btn.classed("active", function(d) {
                return info.buttonActive(d[0], d[1]);
            });
        }
        path.style("cursor", "pointer");
        path.on("click", function(d) {
            info.onClick(d, "more", this);
        });
        btn.on("click", function(d) {
            info.onClick(d[0], d[1], this);
        });
    };
};

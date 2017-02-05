Module.setThemeColors = function(colors) {
    Module.theme_colors = colors.slice();
}

EditorPopups.ColorPicker = function(info, wrapper) {
    wrapper.classed("color-picker", true);

    var self = this;
    var current_color = info.color;

    // A color picker similar to microsoft products.

    // The "Theme" colors.
    var main_colors = ["#000", "#FFF",  "#5CA3D1", "#9BBE42", "#F0B04F", "#9F8AC1", "#E16B9E", "#44B29C", "#E27166"];
    if(Module.theme_colors) {
        main_colors = ["#000", "#FFF"].concat(Module.theme_colors);
    }

    // for(var i = 0; i < main_colors.length; i++) {
    //     colors = colors.concat(chroma.scale(["#000", main_colors[i]], 'lab').colors(5).slice(1, -1));
    //     colors = colors.concat(chroma.scale([main_colors[i], '#FFF'], 'lab').colors(6).slice(0,-1));
    // }
    // colors = colors.map(function(x) { return new RGBColor(x); });

    var adjust_brightness = function(color, l) {
        var lab = chroma(color).lab();
        lab[0] = l * 100;
        return chroma(lab, "lab");
    };

    var p = wrapper.append("p").classed("btn-none", true).on("click", function(d) {
        Events.raise(self, "color", null);
        info.remove();
    });
    p.call(IconFont.addIcon("cross"))
    p.append("span").text(" None");

    var columns = wrapper.append("p").selectAll("span.column").data(main_colors).enter().append("span").attr("class", "column");
    columns.style({
        display: "inline-block",
        width: "28px",
        "margin-right": "3px"
    });
    columns.append("span").append("span").attr("class", "color").on("click", function(d) {
        if(current_color) {
            var a = current_color.a;
            current_color = new RGBColor(d);
            current_color.a = a;
        } else {
            current_color = new RGBColor(d);
        }
        update_current_color();
        Events.raise(self, "color", current_color);
    })
    .style("margin-bottom", "8px")
    .append("span").attr("class", "content").style({
        "background-color": function(d) { return d.toString(); }
    });
    columns.append("span").selectAll("span.color").data(function(d) {
        if(d == "#000") {
            return chroma.scale(["#888", "#000"], "lab").colors(8).slice(1, -1);
        }
        if(d == "#FFF") {
            return chroma.scale(["#FFF", "#888"], "lab").colors(8).slice(1, -1);
        }
        return [ 1, 0.95, 0.85, 0.7, 0.5, 0.3 ].map(function(v) { return adjust_brightness(d, v).toString(); });
    }).enter().append("span").attr("class", "color")
        .on("click", function(d) {
            if(current_color) {
                var a = current_color.a;
                current_color = new RGBColor(d);
                current_color.a = a;
            } else {
                current_color = new RGBColor(d);
            }
            update_current_color();
            Events.raise(self, "color", current_color);
        })
        .append("span").attr("class", "content").style({
            "background-color": function(d) { return d.toString(); }
        });

    var p = wrapper.append("footer").style({
        "line-height": "28px",
        "text-align": "right"
    });
    var alpha_editor = p.append("span");
    alpha_editor.append("span").text("Opacity ");
    var opacity_slider = alpha_editor.append("span");
    MakeNumberSlider(opacity_slider, current_color ? current_color.a : 1.0, [ 0, 1 ], function(new_alpha) {
        if(current_color) {
            current_color = current_color.clone();
            current_color.a = new_alpha;
            update_current_color();
            Events.raise(self, "color", current_color);
        }
    }, 140);
    if(info.disable_alpha) alpha_editor.remove();

    p.append("span").text(" ");
    p.append("span").classed("btn", true).text("OK")
        .on("click", function(d) {
            info.remove();
        });
    // wrapper.style({
    //     "width": "231px"
    // });
    var update_current_color = function() {
        // rect_alpha.attr("x", (current_color ? current_color.a : 1.0) * 90 + 5 - 2);
        alpha_editor.style("display", current_color ? "inline" : "none");
    };
    update_current_color();
};

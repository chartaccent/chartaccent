EditorPopups.Select = function(info, wrapper) {
    var self = this;
    var value = info.value;
    wrapper.classed("select", true);
    var ps = wrapper.append("ul").selectAll("li").data(info.choices);
    var li = ps.enter().append("li")
    li.append("span").call(IconFont.addIcon("correct")).classed("mark", true);
    li.append("label")
        .text(function(d) { return d.name; })
        .style({
            "font-family": function(d) { return d.font ? d.font : null; }
        });
    ps.classed("active", function(d) { return value == d.value; });
    ps.on("click", function(d) {
        Events.raise(self, "value", d.value);
        info.remove();
    });
};

EditorPopups.LabelAnchorSelect = function(info, wrapper) {
    var self = this;
    wrapper.classed("anchor-select", true);
    var svg = wrapper.append("svg").attr("width", 140).attr("height", 90);
    var g = svg.append("g").attr("transform", "translate(70, 45)");
    var w = 81, h = 51;
    var spacing_x = w / 3, size_x = spacing_x - 6;
    var spacing_y = h / 3, size_y = spacing_y - 6;
    var bg = g.append("rect").attr("x", -w / 2).attr("y", -h / 2).attr("width", w).attr("height", h)
        .style({
            "stroke": "#ff7f0e",
            "fill": "#ff7f0e",
            "fill-opacity": 0.2,
            "stroke-width": 2,
        });
    g.append("g").selectAll("g").data([-2,-1,0,1,2]).enter().append("g").selectAll("rect").data(function(d) {
        return [[d,-2],[d,-1],[d,0],[d,1],[d,2]];
    }).enter().append("rect")
        .classed("anchor", true)
        .attr("x", function(d) { return d[0] * spacing_x - size_x / 2; })
        .attr("y", function(d) { return d[1] * spacing_y - size_y / 2; })
        .attr("width", size_x)
        .attr("height", size_y)
        .style({
            "stroke": "black",
            "cursor": "pointer",
        })
        .attr("stroke-dasharray", "2, 2")
        .on("click", function(d) {
            var xs = { 0: "ll", 1: "l", 2: "m", 3: "r", 4: "rr" };
            var ys = { 0: "tt", 1: "t", 2: "m", 3: "b", 4: "bb" };
            Events.raise(self, "value", xs[d[0] + 2] + "," + ys[d[1] + 2]);
            info.remove();
        }).classed("active", function(d) {
            var xs = { 0: "ll", 1: "l", 2: "m", 3: "r", 4: "rr" };
            var ys = { 0: "tt", 1: "t", 2: "m", 3: "b", 4: "bb" };
            return info.value == xs[d[0] + 2] + "," + ys[d[1] + 2];
        });
};

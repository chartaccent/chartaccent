function CreateBubbleSet(g, defs, color, sigma) {
    if(sigma === undefined) sigma = 10;

    var o = { };
    var filter_id = "chartaccent-item-background-filter-" + getObjectUniqueID(o);
    var filter = defs.append("filter")
        .attr("id", filter_id);
    filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", sigma);

    var gaussian_max = 1.0;
    var threshold = 0.1;
    var slope = 50;

    var tr = filter.append("feComponentTransfer");
    tr.append("feFuncA").attr("type", "linear").attr("intercept", -threshold * slope + 0.5).attr("slope", slope / gaussian_max);

    var tr = filter.append("feComponentTransfer");
    tr.append("feFuncR").attr("type", "linear").attr("intercept", color.r / 255.0).attr("slope", 0);
    tr.append("feFuncG").attr("type", "linear").attr("intercept", color.g / 255.0).attr("slope", 0);
    tr.append("feFuncB").attr("type", "linear").attr("intercept", color.b / 255.0).attr("slope", 0);
    tr.append("feFuncA").attr("type", "table").attr("tableValues", "0 " + color.a);


    var bbox = g.node().getBBox();
    filter.attr("filterUnits", "userSpaceOnUse");
    var margin = 40;
    filter.attr("x", bbox.x - margin);
    filter.attr("y", bbox.y - margin);
    filter.attr("width", bbox.width + margin * 2);
    filter.attr("height", bbox.height + margin * 2);

    g.style("filter", "url(#" + filter_id + ")");

    var nodes = [];
    g.selectAll(":not(g)").each(function(d) {
        var bbox = this.getBBox();
        var x = bbox.x + bbox.width / 2;
        var y = bbox.y + bbox.height / 2;
        nodes.push(new Geometry.Vector(x, y));
    });
    var mst = Geometry.minimalSpanningTree(nodes);
    g.append("g").selectAll("line").data(mst).enter().append("line")
        .attr("x1", function(d) { return nodes[d[0]].x; })
        .attr("y1", function(d) { return nodes[d[0]].y; })
        .attr("x2", function(d) { return nodes[d[1]].x; })
        .attr("y2", function(d) { return nodes[d[1]].y; })
        .style({
            "stroke": "black",
            "stroke-width": 3,
            "stroke-linecap": "round"
        });
};

Annotation.prototype.renderComponentBubbleset = function(RC, RC2, component) {
    if(!component.visible || !this.visible || !component.style.fill) return;

    var defs = RC2.addElement("fg", "defs", getObjectUniqueID(component));
    defs.selectAll("*").remove();

    var g_items = RC2.addElement("bg", "g", "highlight", "bg-" + getObjectUniqueID(component));
    g_items.selectAll("*").remove();


    if(this.target.type == "items") {
        this.target.items.forEach(function(desc) {
            var elements = desc.elements;
            var items = desc.items;
            var g = g_items.append("g");
            var overlay = elements.createHighlightOverlay(g, items, Styles.createDefault("black"));
            overlay.style({
                "cursor": "pointer",
                "pointer-events": "all"
            });
            overlay.on("click", function() {
                RC2.startPopoutEditor();
            });

        });
    }
    if(this.target.type == "range") {
        // Find all items in this range.
        this.target_inherit.serieses.forEach(function(elements) {
            if(elements.createRangeHighlightOverlay) {
                var g = g_items.append("g");
                var overlay = elements.createRangeHighlightOverlay(g, RC2.range, RC2.axis, this.target_inherit.mode);
                if(overlay) {
                    overlay.style({
                        "fill": "black",
                        "stroke": "black",
                        "strok-width": 3,
                        "cursor": "pointer",
                        "pointer-events": "all"
                    });
                    overlay.on("click", function() {
                        RC2.startPopoutEditor();
                    });
                } else {
                    g.remove();
                }
            }
        }.bind(this));
    }

    if(component.sigma === undefined) component.sigma = 10;
    CreateBubbleSet(g_items, defs, component.style.fill, component.sigma);
};

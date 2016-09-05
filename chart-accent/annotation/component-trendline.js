Annotation.prototype.renderComponentTrendline = function(RC, RC2, component) {
    if(!component.visible || !this.visible) return;

    var annotation = this;

    var doStartPopout = function() {
        RC2.startPopoutEditor();
    }

    // Compute the trend line.
    var points = [];
    if(annotation.target.type == "items") {
        annotation.target.items.forEach(function(desc) {
            desc.items.forEach(function(d) {
                var x = desc.elements.getAxisValue(d, "x");
                var y = desc.elements.getAxisValue(d, "y");
                var px = Scales.getScaleValueRange(RC.owner.cartesian_scales.x, x);
                var py = Scales.getScaleValueRange(RC.owner.cartesian_scales.y, y);
                px = (px[0] + px[1]) / 2;
                py = (py[0] + py[1]) / 2;
                points.push([px, py,
                    Scales.getScaleValueRange(RC.owner.cartesian_scales.x, x),
                    Scales.getScaleValueRange(RC.owner.cartesian_scales.y, y)
                ]);
            });
        });
    }
    if(annotation.target.type == "range") {
        annotation.target_inherit.serieses.forEach(function(elements) {
            if(!elements.getRangeItems) return;
            var items = elements.getRangeItems(RC2.range, RC2.axis, annotation.target_inherit.mode);
            items.forEach(function(item) {
                var x = elements.getAxisValue(item, "x");
                var y = elements.getAxisValue(item, "y");
                var px = Scales.getScaleValueRange(RC.owner.cartesian_scales.x, x);
                var py = Scales.getScaleValueRange(RC.owner.cartesian_scales.y, y);
                px = (px[0] + px[1]) / 2;
                py = (py[0] + py[1]) / 2;
                points.push([px, py,
                    Scales.getScaleValueRange(RC.owner.cartesian_scales.x, x),
                    Scales.getScaleValueRange(RC.owner.cartesian_scales.y, y)
                ]);
            });
        });
    }
    // We need at least 3 points to do the regression.
    if(points.length <= 1) return;

    // Compute linear regression with least squares.
    // y = Mx + C
    var xsum = 0, ysum = 0, xysum = 0, xxsum = 0, yysum = 0, n = points.length;
    for(var i = 0; i < points.length; i++) {
        xsum += points[i][0];
        ysum += points[i][1];
        xxsum += points[i][0] * points[i][0];
        yysum += points[i][1] * points[i][1];
        xysum += points[i][0] * points[i][1];
    }
    // The slope.
    var M = (n * xysum - xsum * ysum) / (n * xxsum - xsum * xsum);
    // The intercept.
    var C = ysum / n - M * xsum / n;

    var line = RC2.addElement("fg", "line", "trendline", getObjectUniqueID(component));
    var line_handle = RC2.addElement("fg", "line", "trendline-handle", getObjectUniqueID(component));
    var xExtent = [
        d3.min(points, function(d) { return Math.min(d[2][0], d[2][1]); }),
        d3.max(points, function(d) { return Math.max(d[2][0], d[2][1]); })
    ];
    var yExtent = Scales.getScaleRangeExtent(RC.owner.cartesian_scales.y);
    var x1 = Math.min(xExtent[0], xExtent[1]);
    var x2 = Math.max(xExtent[0], xExtent[1]);
    // Clip to yExtent.
    if(M * x1 + C > Math.max(yExtent[0], yExtent[1])) {
        x1 = (Math.max(yExtent[0], yExtent[1]) - C) / M;
    }
    if(M * x1 + C < Math.min(yExtent[0], yExtent[1])) {
        x1 = (Math.min(yExtent[0], yExtent[1]) - C) / M;
    }
    if(M * x2 + C > Math.max(yExtent[0], yExtent[1])) {
        x2 = (Math.max(yExtent[0], yExtent[1]) - C) / M;
    }
    if(M * x2 + C < Math.min(yExtent[0], yExtent[1])) {
        x2 = (Math.min(yExtent[0], yExtent[1]) - C) / M;
    }
    line.attr({
        "x1": x1,
        "y1": M * x1 + C,
        "x2": x2,
        "y2": M * x2 + C
    });
    line_handle.attr({
        "x1": x1,
        "y1": M * x1 + C,
        "x2": x2,
        "y2": M * x2 + C
    });
    line.style({
        "fill": "none",
        "stroke": component.style.stroke !== null ? component.style.stroke : "none",
        "stroke-width": component.style.stroke_width,
        "stroke-linecap": "round",
        "pointer-events": "none"
    });
    line_handle.style({
        "cursor": "pointer",
        "stroke-linecap": "round",
        "stroke-width": 5,
        "pointer-events": "all"
    });
    line_handle.classed("chartaccent-draghandle-line", true);
    line_handle.on("mousedown", function() {
        RC2.startPopoutEditor();
    });
};

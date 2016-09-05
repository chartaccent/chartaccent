var BubbleCursorManager = function(svg, reference_element) {
    this.reference_element = reference_element;
    this.items = [];
    this.CreateSVGPoint = function(x, y) {
        var p = svg.createSVGPoint();
        p.x = x;
        p.y = y;
        return p;
    };
};

BubbleCursorManager.prototype.addElement = function(root_matrix_inverse, element, cursor, onmousedown) {
    var self = this;
    var tag = element.tagName;
    if(tag == "rect") {
        var matrix = element.getScreenCTM();
        matrix = root_matrix_inverse.multiply(matrix);
        var x = parseFloat(element.getAttribute("x"));
        var y = parseFloat(element.getAttribute("y"));
        var w = parseFloat(element.getAttribute("width"));
        var h = parseFloat(element.getAttribute("height"));
        var p00 = this.CreateSVGPoint(x, y).matrixTransform(matrix);
        var p01 = this.CreateSVGPoint(x, y + h).matrixTransform(matrix);
        var p10 = this.CreateSVGPoint(x + w, y).matrixTransform(matrix);
        var p11 = this.CreateSVGPoint(x + w, y + h).matrixTransform(matrix);
        this.items.push([["rect", p00, p01, p10, p11], cursor, onmousedown]);
    }
    if(tag == "circle") {
        var matrix = element.getScreenCTM();
        matrix = root_matrix_inverse.multiply(matrix);
        var cx = parseFloat(element.getAttribute("cx"));
        var cy = parseFloat(element.getAttribute("cy"));
        var r = parseFloat(element.getAttribute("r"));
        var center = this.CreateSVGPoint(cx, cy).matrixTransform(matrix);
        var radius = matrix.a * r;
        this.items.push([["circle", center, radius], cursor, onmousedown]);
    }
    if(tag == "path") {
        var matrix = element.getScreenCTM();
        matrix = root_matrix_inverse.multiply(matrix);
        var d = element.getAttribute("d");
        d = d.split(/\s*[ml]\s*/i).map(function(x) { return x.trim().split(/\s*,\s*/).map(function(y) { return parseFloat(y.trim()); }); }).filter(function(x) { return x.length == 2; });
        d = d.map(function(p) {
            return self.CreateSVGPoint(p[0], p[1]).matrixTransform(matrix);
        });
        this.items.push([["polygon", d], isObject(cursor) ? cursor : { cursor: cursor, layer: 0 }, onmousedown]);
    }
};

BubbleCursorManager.prototype.add = function(selection, cursor, onmousedown) {
    var self = this;
    var root_matrix = this.reference_element.getScreenCTM();
    var root_matrix_inverse = root_matrix.inverse();
    selection.each(function() {
        self.addElement(root_matrix_inverse, this, cursor, onmousedown);
    });
};

BubbleCursorManager.prototype.clear = function() {
    this.items = [];
};

BubbleCursorManager.prototype.pointItemDistance = function(p, element) {
    if(element[0] == "rect") {
        return Geometry.pointRectDistance(p, element[1], element[2], element[4], element[3]);
    }
    if(element[0] == "circle") {
        var d = Geometry.pointPointDistance(p, element[1]);
        var d_border = Math.max(0, d - element[2]);
        return d_border;
    }
    if(element[0] == "polygon") {
        var d = Geometry.pointInsidePolygon(p, element[1]);
        return d ? 0 : 1000;
    }
    return null;
};


BubbleCursorManager.prototype.find = function(pt) {
    var dmin = null, imin = null;
    for(var i = 0; i < this.items.length; i++) {
        var item = this.items[i];
        var d = this.pointItemDistance(pt, item[0]);
        if(d === null) continue;
        if(dmin === null || (dmin > d || (dmin == d && this.items[imin][1].layer < this.items[i][1].layer))) {
            dmin = d;
            imin = i;
        }
    }
    if(imin !== null && dmin < 3) {
        var info = this.items[imin][1];
        return {
            cursor: info.cursor,
            layer: info.layer,
            onmousedown: this.items[imin][2],
            distance: dmin
        };
    } else {
        return null;
    }
};

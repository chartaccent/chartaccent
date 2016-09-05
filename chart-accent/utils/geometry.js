var Geometry = {
    vectorLength: function(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    },
    pointPointDistance: function(p1, p2) {
        return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
    },
    pointLineSegmentDistance: function(p, p1, p2) {
        var p2_p1 = new Geometry.Vector(p2.x - p1.x, p2.y - p1.y);
        var distance = p2_p1.length();
        if(distance < 1e-6) {
            return Geometry.pointPointDistance(p, p1);
        }
        var p_p1 = new Geometry.Vector(p.x - p1.x, p.y - p1.y);
        var proj_distance = p_p1.dot(p2_p1) / distance;
        var value = p_p1.cross(p2_p1) / distance;
        if(proj_distance < 0) {
            return Geometry.pointPointDistance(p, p1);
        } else if(proj_distance <= distance) {
            return Math.abs(value);
        } else {
            return Geometry.pointPointDistance(p, p2);
        }
    },
    pointLineSegmentSignedDistance: function(p, p1, p2) {
        var p2_p1 = new Geometry.Vector(p2.x - p1.x, p2.y - p1.y);
        var distance = p2_p1.length();
        if(distance < 1e-6) {
            return Geometry.pointPointDistance(p, p1);
        }
        var p_p1 = new Geometry.Vector(p.x - p1.x, p.y - p1.y);
        var proj_distance = p_p1.dot(p2_p1) / distance;
        var value = p_p1.cross(p2_p1) / distance;
        if(proj_distance < 0) {
            return value > 0 ? Geometry.pointPointDistance(p, p1) : -Geometry.pointPointDistance(p, p1);
        } else if(proj_distance <= distance) {
            return value;
        } else {
            return value > 0 ? Geometry.pointPointDistance(p, p2) : -Geometry.pointPointDistance(p, p2);
        }
    },
    pointPathDistance: function(p) {
        var min_d = null;
        for(var i = 1; i < arguments.length - 1; i++) {
            var p1 = arguments[i];
            var p2 = arguments[i + 1];
            var d = Geometry.pointLineSegmentDistance(p, p1, p2);
            if(min_d === null || min_d > d) {
                min_d = d;
            }
        }
        return min_d;
    },
    pointClosedPathDistance: function(p) {
        var min_d = null;
        for(var i = 1; i < arguments.length; i++) {
            var p1 = arguments[i];
            if(i == arguments.length - 1) {
                var p2 = arguments[1];
            } else {
                var p2 = arguments[i + 1];
            }
            var d = Geometry.pointLineSegmentDistance(p, p1, p2);
            if(min_d === null || min_d > d) {
                min_d = d;
            }
        }
        return min_d;
    },
    pointRectDistance: function(p, p00, p01, p11, p10) {
        if(Geometry.pointInsidePolygon(p, [p00, p01, p11, p10])) return 0;
        return Geometry.pointClosedPathDistance(p, p00, p01, p11, p10);
    },
    pointInsidePolygon: function(point, polygon) {
        for(var c = false, i = -1, l = polygon.length, j = l - 1; ++i < l; j = i) {
            if( ((polygon[i].y <= point.y && point.y < polygon[j].y) || (polygon[j].y <= point.y && point.y < polygon[i].y))
             && (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)
            ) {
                c = !c;
            }
        }
        return c;
    },
    isLineSegmentsIntersect: function(l11, l12, l21, l22) {
        var A0 = l11.x, B0 = l11.y;
        var A1 = l12.x, B1 = l12.y;
        var A2 = l21.x, B2 = l21.y;
        var A3 = l22.x, B3 = l22.y;
        var judge1 = ((A2-A0)*(B1-B0) - (B2-B0)*(A1-A0)) * ((A3-A0)*(B1-B0) - (B3-B0)*(A1-A0)) < 0;
        var judge2 = ((A0-A2)*(B3-B2) - (B0-B2)*(A3-A2)) * ((A1-A2)*(B3-B2) - (B1-B2)*(A3-A2)) < 0;
        return judge1 && judge2;
    },
    isPolygonIntersect: function(polygon1, polygon2) {
        for(var i = 0; i < polygon1.length; i++) {
            if(Geometry.pointInsidePolygon(polygon1[i], polygon2)) return true;
        }
        for(var i = 0; i < polygon1.length; i++) {
            for(var j = 0; j < polygon2.length; j++) {
                var p1 = polygon1[i];
                var p2 = polygon1[(i + 1) % polygon1.length];
                var q1 = polygon2[j];
                var q2 = polygon2[(j + 1) % polygon2.length];
                if(Geometry.isLineSegmentsIntersect(p1, p2, q1, q2)) return true;
            }
        }
        return false;
    },
    minimalSpanningTree: function(points) {
        var edges = [];
        var parents = new Array(points.length);
        for(var i = 0; i < points.length; i++) {
            parents[i] = i;
            for(var j = i + 1; j < points.length; j++) {
                edges.push([ Geometry.pointPointDistance(points[i], points[j]), i, j ]);
            }
        }
        edges.sort(function(a, b) { return a[0] - b[0]; });

        var get_parent = function(p) {
            if(parents[p] != p) {
                parents[p] = get_parent(parents[p]);
            }
            return parents[p];
        };
        var tree_edges = [];
        for(var i = 0; i < edges.length; i++) {
            var p1 = edges[i][1];
            var p2 = edges[i][2];
            if(get_parent(p1) == get_parent(p2)) {
            } else {
                parents[get_parent(p1)] = get_parent(p2);
                tree_edges.push([p1, p2]);
            }
        }
        return tree_edges;
    }
};

Geometry.Vector = function(x, y) {
    this.x = x;
    this.y = y;
};
Geometry.Vector.prototype.sub = function(v2) {
    return new Geometry.Vector(this.x - v2.x, this.y - v2.y);
};
Geometry.Vector.prototype.add = function(v2) {
    return new Geometry.Vector(this.x + v2.x, this.y + v2.y);
};
Geometry.Vector.prototype.scale = function(s) {
    return new Geometry.Vector(this.x * s, this.y * s);
};
Geometry.Vector.prototype.dot = function(v2) {
    return this.x * v2.x + this.y * v2.y;
};
Geometry.Vector.prototype.cross = function(v2) {
    return this.x * v2.y - this.y * v2.x;
};
Geometry.Vector.prototype.length = function(v2) {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
Geometry.Vector.prototype.clone = function() {
    return new Geometry.Vector(this.x, this.y);
};

Geometry.Path = {
    polyline: function() {
        return "M" + Array.prototype.slice.call(arguments).map(function(d) {
            return d.x + "," + d.y;
        }).join("L");
    },
    polylineClosed: function() {
        return Geometry.Path.polyline.apply(null, arguments) + "Z";
    },
    rect: function(x, y, w, h) {
        return Geometry.Path.polylineClosed(
            new Geometry.Vector(x, y),
            new Geometry.Vector(x + w, y),
            new Geometry.Vector(x + w, y + h),
            new Geometry.Vector(x, y + h)
        );
    },
    commands: function() {
        return Array.prototype.slice.call(arguments).map(function(d) {
            return d[0] + " " + d.slice(1).join(",");
        }).join(" ");
    },
    arrow: function(size, p1, p2) {
        // Arrow from p1 to p2, with size.
        var direction = p1.sub(p2);
        direction = direction.scale(1.0 / direction.length() * size);
        direction_rot90 = new Geometry.Vector(-direction.y, direction.x).scale(0.4);
        return Geometry.Path.polylineClosed(
            p2,
            p2.add(direction).add(direction_rot90),
            p2.add(direction).sub(direction_rot90)
        )
    },
    tabV: function(y1, y2, width, roundness) {
        if(y1 > y2) { var t = y1; y1 = y2; y2 = t; }
        if(roundness > (y2 - y1) / 2) roundness = (y2 - y1) / 2;
        return Geometry.Path.commands(
            ["M", 0, y1],
            ["L", width - roundness * Math.sign(width), y1],
            ["A", roundness, roundness, 0, 0, 1, width, y1 + roundness],
            ["L", width, y2 - roundness],
            ["A", roundness, roundness, 0, 0, 1, width - roundness * Math.sign(width), y2],
            ["L", 0, y2],
            ["Z"]
        );
    },
    tabH: function(y1, y2, width, roundness) {
        if(y1 > y2) { var t = y1; y1 = y2; y2 = t; }
        if(roundness > (y2 - y1) / 2) roundness = (y2 - y1) / 2;
        return Geometry.Path.commands(
            ["M", y1, 0],
            ["L", y1, width - roundness * Math.sign(width)],
            ["A", roundness, roundness, 0, 0, 1, y1 + roundness, width],
            ["L", y2 - roundness, width],
            ["A", roundness, roundness, 0, 0, 1, y2, width - roundness * Math.sign(width)],
            ["L", y2, 0],
            ["Z"]
        );
    }
};

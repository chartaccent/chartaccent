function ApplyAxisStyle(sel) {
    sel.selectAll("path").style({
        "fill": "none",
        "stroke": "black"
    });
    sel.selectAll("line").style({
        "fill": "none",
        "stroke": "black"
    });
}

var measureTextCanvas = document.createElement("canvas");
var measureTextCanvasCtx = measureTextCanvas.getContext("2d");
measureTextCanvasCtx.font = "14px Helvetica";
function MeasureLegend(columns) {
    console.log(columns);
    return d3.max(columns, function(d) { return measureTextCanvasCtx.measureText(d).width; });
}

function CreateLegend(g, columns, colors) {
    var sel = g.selectAll("g.legend").data(columns);
    var enter = sel.enter().append("g").attr("class", "legend");
    enter.attr("transform", function(d, i) {
        return "translate(0, " + i * 18 + ")";
    });
    enter.append("text");
    enter.append("circle");
    sel.exit().remove();
    sel.select("text")
    .text(function(d) { return d; })
    .attr("x", 10).attr("y", 0)
    .style({
        "font-size": 14,
        "alignment-baseline": "central",
        "text-anchor": "start"
    });
    sel.select("circle")
    .attr("cx", 0).attr("cy", 0).attr("r", 5)
    .style({
        "stroke": "none",
        "fill": function(d, i) { return colors[i]; }
    });
    var result = { };
    sel.each(function(d) {
        result[d] = d3.select(this);
    });
    return result;
}

function BaseChart(element, info, config) {
    var self = this;

    this.element = element;
    this.info = info;
    this.config = config;

    // Margin.

    this.margin = { top: 80, right: this._measure_legend_width() + 80, bottom: 40, left: 80 };

    // Prepare svg.
    // width and height are chart area size.
    this.width = info.width - this.margin.left - this.margin.right;
    this.height = info.height - this.margin.top - this.margin.bottom;

    // Chartaccent panel.
    if(config.chartaccent) {
        this.panel = element.append("div").classed("panel", true);
        this.toolbar = element.append("div").classed("toolbar", true);
    }
    var div_chart = element.append("div");
    this.svg = div_chart.classed("chart", true).append("svg")
        .style("font-family", "Helvetica")
        .style("font-size", "14");
    this.actual_svg = this.svg
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom);
    // translated svg: origin is (left, top) of the real svg.
    this.svg = this.actual_svg.append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.colors = [ "#5CA3D1", "#9BBE42", "#F0B04F", "#9F8AC1", "#E16B9E", "#44B29C" ];

    // Chart title.
    this.svg.append("text").attr("x", this.width / 2).attr("y", -25).text(info.title).style({
        "font-size": 18,
        "text-anchor": "middle"
    });

    var p_buttons = element.append("p").style("clear", "both").style("text-align", "right");
    var export_as = function(type, callback_complete) {
        var do_download = function(url) {
            saveAs(url, "chartaccent." + type);
            callback_complete();
        };
        if(type == "svg") {
            var blob = self.chartaccent.getSVGDataBlob();
            do_download(blob);
        }
        if(type == "png") {
            self.chartaccent.getImageDataBlob('image/png', 4, function(blob) {
                do_download(blob);
            });
        }
        if(type == "gif") {
            self.chartaccent.getAnimatedGIFImages(function(blob) {
                do_download(blob);
            })
        }
    };
    if(config.chartaccent) {
        if(config.chartaccent_info && config.chartaccent_info.setExportFunction) {
            config.chartaccent_info.setExportFunction(export_as);
        }
    }


    if(info.type == "barchart") this._create_barchart();
    if(info.type == "linechart") this._create_linechart();
    if(info.type == "scatterplot") this._create_scatterplot();
};

BaseChart.prototype._determine_y_format = function() {
    var info = this.info;
    var max_digits = 0;
    info.columns.forEach(function(d) {
        if(info.y_columns.indexOf(d.name) >= 0) {
            var digits = d.digits;
            max_digits = Math.max(max_digits, digits);
        }
    });
    return "." + max_digits + "f";
};

BaseChart.prototype._determine_xy_format = function() {
    var info = this.info;
    var max_digits = 0;
    info.columns.forEach(function(d) {
        if([info.x_column, info.y_column].indexOf(d.name) >= 0) {
            var digits = d.digits;
            max_digits = Math.max(max_digits, digits);
        }
    });
    return "." + max_digits + "f";
};

BaseChart.prototype._measure_legend_width = function() {
    var info = this.info;
    if(info.type == "barchart") {
        return MeasureLegend(info.y_columns);
    }
    if(info.type == "linechart") {
        return MeasureLegend(info.y_columns);
    }
    if(info.type == "scatterplot") {
        if(info.color_column) {
            var group_values = { };
            var groups = [];
            info.rows.forEach(function(row) {
                var value = row[info.color_column];
                if(value !== null && value !== undefined) {
                    if(!group_values[value]) {
                        group_values[value] = true;
                        groups.push(value);
                    }
                }
            });
            groups.sort();
            return MeasureLegend(groups);
        }
    }
    return 0;
}

BaseChart.prototype._create_barchart = function() {
    var config = this.config;
    var info = this.info;
    var svg = this.svg;
    var width = this.width;
    var height = this.height;
    var margin = this.margin;

    var rows = info.rows;
    var columns = info.columns;

    var x_column = info.x_column;
    var y_columns = info.y_columns;

    var y_format = this._determine_y_format();

    var scale_x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .4);
    var scale_y = d3.scale.linear()
        .range([height, 0]);
    var axis_x = d3.svg.axis()
        .scale(scale_x)
        .orient("bottom");
    var axis_y = d3.svg.axis()
        .scale(scale_y)
        .orient("left")
        .ticks(10);
    scale_x.domain(rows.map(function(d) { return d[x_column]; }));
    scale_y.domain([
        (info.scale_y_min !== undefined ? info.scale_y_min : 0),
        (info.scale_y_max !== undefined ? info.scale_y_max : d3.max(y_columns, function(c) {
            return d3.max(rows, function(d) { return d3.max([d[c + "_lower"], d[c + "_upper"], d[c]]); })
        }))
    ]);
    scale_y.nice();

    var colors = this.colors;
    var legend = CreateLegend(svg.append("g").attr("transform", "translate(" + (width + 30) + ", 6)"), info.y_columns, colors);

    var bars = info.y_columns.map(function(y_column, i) {
        var spacing = Math.round(scale_x.rangeBand() / y_columns.length);
        var border = 2;

        var bars = svg.append("g").selectAll(".bar")
            .data(rows)
          .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return Math.round(scale_x(d[x_column])) + spacing * i + border / 2; })
            .attr("width", spacing - border)
            .attr("y", function(d) { return Math.round(scale_y(d[y_column])); })
            .attr("height", function(d) { return height - 0.5 - Math.round(scale_y(d[y_column])); })
            .style("fill", colors[i]);

        // Show error bars.
        if(rows.every(function(d) { return d[y_column + "_lower"] != null && d[y_column + "_upper"] != null; })) {
            var error_bars = svg.append("g").selectAll(".errorbar")
                .data(rows)
            .enter().append("path")
            .attr("class", "errorbar")
            .attr("d", function(d) {
                var bar_x = Math.round(scale_x(d[x_column])) + spacing * (i + 0.5);
                var y1 = scale_y(d[y_column + "_lower"]);
                var y2 = scale_y(d[y_column + "_upper"]);
                var errorbar_width = Math.min(10, spacing - border);
                return [
                    "M", bar_x, y1,
                    "L", bar_x, y2,
                    "M", bar_x - errorbar_width / 2, y1,
                    "L", bar_x + errorbar_width / 2, y1,
                    "M", bar_x - errorbar_width / 2, y2,
                    "L", bar_x + errorbar_width / 2, y2
                ].join(" ");
            })
            .style("fill", "none").style("stroke", "black")
        }
        return bars;
    });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(axis_x)
        .call(ApplyAxisStyle);

    svg.append("g")
        .attr("class", "y axis")
        .call(axis_y)
        .call(ApplyAxisStyle)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(info.scale_y_label);

    if(config.chartaccent) {
        // ChartAccent code.
        var chart_accent = ChartAccent.Create({
            layer_background: this.actual_svg.insert("g", ":first-child"),
            layer_annotation: this.actual_svg.append("g"),
            panel: this.panel,
            toolbar: this.toolbar
        });
        // Annotatable chart.
        var chart = chart_accent.AddChart({
            bounds: {
                x: 0, y: 0,
                width: width + margin.left + margin.right,
                height: height + margin.top + margin.bottom,
                origin_x: margin.left,
                origin_y: margin.top
            },
            default_lasso_label: "per-item",
            default_lasso_label_expression: 'format(".1f", value)',
            cartesian_scales: {
                x: scale_x, y: scale_y     // D3 axis.
            },
            selection_mode: "marquee",
            tables: [
                { name: "data", data: rows, isDefault: true }
            ],
            palette: colors.slice(0, y_columns.length)
        });
        // Annotatable elements.
        chart.addAxis({
            axis: "x",
            origin_y: height,
            name: x_column
        });
        chart.addAxis({
            axis: "y",
            origin_x: 0,
            name: info.scale_y_label,
            default_format: y_format
        });
        var legend_items = [];
        bars.forEach(function(bar, i) {
            var y_column = info.y_columns[i];
            chart.addSeriesFromD3Selection({
                name: y_column,
                selection: bar,
                default_label: 'format("' + y_format + '", value)',
                getAxisValue: function(d, axis) {
                    if(axis == "x") return d[info.x_column];
                    if(axis == "y") return d[y_column];
                },
                getValue: function(d) {
                    return d[y_column];
                },
                itemToString: info.itemToString ? info.itemToString : function(d) { return d3.format(y_format)(d[y_column]); },
                visibility: function(f) {
                    bar.style("visibility", function(d) { return f(d) ? "visible" : "hidden"; });
                }
            });
            legend_items.push({
                name: y_column,
                items: [ { series: y_column, items: info.rows } ],
                selection: legend[y_column]
            });
        });
        chart.addLegend({
            items: legend_items,
            default_label_mode: "item-label",
            default_label: 'format("' + y_format + '", value)'
        });
        this.chartaccent = chart_accent;
    }
};

BaseChart.prototype._create_linechart = function() {
    var config = this.config;
    var info = this.info;
    var svg = this.svg;
    var width = this.width;
    var height = this.height;
    var margin = this.margin;

    var rows = info.rows;
    var columns = info.columns;

    var x_column = info.x_column;
    var y_columns = info.y_columns;

    var y_format = this._determine_y_format();

    var scale_x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .4);
    var scale_y = d3.scale.linear()
        .range([height, 0]);
    var axis_x = d3.svg.axis()
        .scale(scale_x)
        .orient("bottom");
    var axis_y = d3.svg.axis()
        .scale(scale_y)
        .orient("left")
        .ticks(10);
    scale_x.domain(rows.map(function(d) { return d[x_column]; }));
    scale_y.domain([
        (info.scale_y_min !== undefined ? info.scale_y_min : 0),
        (info.scale_y_max !== undefined ? info.scale_y_max : d3.max(y_columns, function(c) {
            return d3.max(rows, function(d) { return d3.max([d[c + "_lower"], d[c + "_upper"], d[c]]); })
        }))
    ]);
    scale_y.nice();

    var colors = this.colors;
    var legend = CreateLegend(svg.append("g").attr("transform", "translate(" + (width + 30) + ", 6)"), info.y_columns, colors);

    var lines = info.y_columns.map(function(y_column, i) {
        var sp = scale_x.rangeBand() / 2;

        // Show error bars.
        if(rows.every(function(d) { return d[y_column + "_lower"] != null && d[y_column + "_upper"] != null; })) {
            var error_bars = svg.append("g").selectAll(".errorbar")
                .data(rows)
            .enter().append("path")
            .attr("class", "errorbar")
            .attr("d", function(d) {
                var bar_x = scale_x(d[x_column]) + sp;
                var y1 = scale_y(d[y_column + "_lower"]);
                var y2 = scale_y(d[y_column + "_upper"]);
                var errorbar_width = 10;
                return [
                    "M", bar_x, y1,
                    "L", bar_x, y2,
                    "M", bar_x - errorbar_width / 2, y1,
                    "L", bar_x + errorbar_width / 2, y1,
                    "M", bar_x - errorbar_width / 2, y2,
                    "L", bar_x + errorbar_width / 2, y2
                ].join(" ");
            })
            .style("fill", "none").style("stroke", colors[i])
        }

        var c = svg.append("g");

        var line = c.append("path").attr("class", "line")
            .datum(rows)
            .attr("d", d3.svg.line().x(function(d) { return scale_x(d[x_column]) + sp; }).y(function(d) { return scale_y(d[y_column]); }))
            .style("stroke", colors[i])
            .style("stroke-width", 2)
            .style("stroke-linejoin", "round")
            .style("stroke-linecap", "round")
            .style("fill", "none");

        var dots = c.selectAll(".dot")
            .data(rows)
          .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", function(d) { return scale_x(d[x_column]) + sp; })
            .attr("cy", function(d) { return scale_y(d[y_column]); })
            .attr("r", 4).style("fill", colors[i]);

        return [line, dots];
    });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(axis_x)
        .call(ApplyAxisStyle);

    svg.append("g")
        .attr("class", "y axis")
        .call(axis_y)
        .call(ApplyAxisStyle)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(info.scale_y_label);

    if(config.chartaccent) {
        // ChartAccent code.
        var chart_accent = ChartAccent.Create({
            layer_background: this.actual_svg.insert("g", ":first-child"),
            layer_annotation: this.actual_svg.append("g"),
            panel: this.panel,
            toolbar: this.toolbar
        });
        // Annotatable chart.
        var chart = chart_accent.AddChart({
            bounds: {
                x: 0, y: 0,
                width: width + margin.left + margin.right,
                height: height + margin.top + margin.bottom,
                origin_x: margin.left,
                origin_y: margin.top
            },
            default_lasso_label: "per-item",
            default_lasso_label_expression: 'format(".1f", value)',
            cartesian_scales: {
                x: scale_x, y: scale_y     // D3 axis.
            },
            selection_mode: "marquee",
            tables: [
                { name: "data", data: rows, isDefault: true }
            ],
            palette: colors.slice(0, y_columns.length)
        });
        // Annotatable elements.
        chart.addAxis({
            axis: "x",
            origin_y: height,
            name: x_column
        });
        chart.addAxis({
            axis: "y",
            origin_x: 0,
            name: info.scale_y_label,
            default_format: y_format
        });
        var legend_items = [];
        lines.forEach(function(line, i) {
            var y_column = info.y_columns[i];
            chart.addSeriesFromD3Selection({
                name: y_column,
                selection: line[1],
                path: line[0],
                default_label: 'format("' + y_format + '", value)',
                getAxisValue: function(d, axis) {
                    if(axis == "x") return d[info.x_column];
                    if(axis == "y") return d[y_column];
                },
                getValue: function(d) {
                    return d[y_column];
                },
                itemToString: info.itemToString ? info.itemToString : function(d) { return d3.format(y_format)(d[y_column]); },
                visibility: function(f) {
                    bar.style("visibility", function(d) { return f(d) ? "visible" : "hidden"; });
                }
            });
            legend_items.push({
                name: y_column,
                items: [ { series: y_column, items: info.rows } ],
                selection: legend[y_column]
            });
        });
        chart.addLegend({
            items: legend_items,
            default_label_mode: "item-label",
            default_label: 'format("' + y_format + '", value)'
        });
        this.chartaccent = chart_accent;
    }
};

BaseChart.prototype._create_scatterplot = function() {
    var config = this.config;
    var info = this.info;
    var svg = this.svg;
    var width = this.width;
    var height = this.height;
    var margin = this.margin;

    var rows = info.rows;
    var columns = info.columns;

    var x_column = info.x_column;
    var y_column = info.y_column;
    var name_column = info.name_column;
    var color_column = info.color_column;
    var size_column = info.size_column;

    var value_format = this._determine_xy_format();

    var scale_x = d3.scale.linear()
        .range([0, width]);

    var scale_y = d3.scale.linear()
        .range([height, 0]);

    var axis_x = d3.svg.axis()
        .scale(scale_x)
        .orient("bottom");

    var axis_y = d3.svg.axis()
        .scale(scale_y)
        .orient("left");


    var colors = this.colors;

    if(color_column) {
        var group_values = { };
        var groups = [];
        rows.forEach(function(row) {
            var value = row[color_column];
            if(value !== null && value !== undefined) {
                if(!group_values[value]) {
                    group_values[value] = true;
                    groups.push(value);
                }
            }
        });
        groups.sort();
        var legend = CreateLegend(svg.append("g").attr("transform", "translate(" + (width + 30) + ", 6)"), groups, colors);
    }

    scale_x.domain([
        info.scale_x_min !== undefined ? info.scale_x_min : d3.min(rows, function(d) { return d[x_column]; }),
        info.scale_x_max !== undefined ? info.scale_x_max : d3.max(rows, function(d) { return d[x_column]; })
    ]);
    scale_y.domain([
        info.scale_y_min !== undefined ? info.scale_y_min : d3.min(rows, function(d) { return d[y_column]; }),
        info.scale_y_max !== undefined ? info.scale_y_max : d3.max(rows, function(d) { return d[y_column]; })
    ]);
    scale_x.nice();
    scale_y.nice();

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(axis_x).call(ApplyAxisStyle)
      .append("text")
        .attr("transform", "translate(" + width + ", -20)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(info.scale_x_label);

    svg.append("g")
        .attr("class", "y axis")
        .call(axis_y).call(ApplyAxisStyle)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(info.scale_y_label);

    var dots = svg.selectAll(".dot")
        .data(rows)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", function(d) { return scale_x(d[x_column]); })
        .attr("cy", function(d) { return scale_y(d[y_column]); })
        .attr("r", 5 * info.size_scale).style("fill", function(d) {
            if(!groups) return colors[0];
            var idx = groups.indexOf(d[color_column]);
            if(idx >= 0) {
                return colors[idx];
            } else {
                return colors[0];
            }
        });

    if(size_column) {
        var scale_size = d3.scale.linear();
        scale_size.domain([ d3.min(rows, function(d) { return d[size_column]; }), d3.max(rows, function(d) { return d[size_column]; }) ]);
        scale_size.range([ 1, 100 ]);
        dots.attr("r", function(d) {
            return Math.sqrt(scale_size(d[size_column])) * info.size_scale;
        });
    }

    if(config.chartaccent) {
        // ChartAccent code.
        var chart_accent = ChartAccent.Create({
            layer_background: this.actual_svg.insert("g", ":first-child"),
            layer_annotation: this.actual_svg.append("g"),
            panel: this.panel,
            toolbar: this.toolbar
        });
        // Annotatable chart.
        var chart = chart_accent.AddChart({
            bounds: {
                x: 0, y: 0,
                width: width + margin.left + margin.right,
                height: height + margin.top + margin.bottom,
                origin_x: margin.left,
                origin_y: margin.top
            },
            cartesian_scales: {
                x: scale_x, y: scale_y     // D3 axis.
            },
            selection_mode: "lasso",
            default_lasso_label_expression: 'format("' + value_format + '", value)',
            tables: [
                { name: "data", data: info.rows, isDefault: true }
            ],
            palette: groups ? colors.slice(0, groups.length) : colors.slice(0, 5)
        });
        // Annotatable elements.
        chart.addAxis({
            axis: "x",
            origin_y: height,
            name: info.scale_x_label,
            default_format: value_format
        });
        chart.addAxis({
            axis: "y",
            origin_x: 0,
            name: info.scale_y_label,
            default_format: value_format
        });
        chart.addSeriesFromD3Selection({
            name: "Data",
            selection: dots,
            default_label: name_column,
            bubbleset: "default-on",
            getAxisValue: function(d, axis) {
                if(axis == "x") return d[x_column];
                if(axis == "y") return d[y_column];
            },
            itemToString: function(d) {
                return d[name_column];
            },
            getValue: function(d) {
                return this.itemToString(d);
            }
        });
        if(groups) {
            var legend_items = groups.map(function(g, i) {
                return {
                    selection: legend[g],
                    items: [ {
                        series: "Data",
                        items: rows.filter(function(d) { return d[color_column] == g; })
                    } ],
                    name: g,
                    color: colors[i]
                };
            });
            chart.addLegend({
                items: legend_items, bubbleset: "default-on",
                default_label_mode: "label"
            });
        }
        this.chartaccent = chart_accent;
    }
}

exports.BaseChart = BaseChart;
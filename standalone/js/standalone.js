var ko = require("knockout");
var d3 = require("d3");
var chroma = require("chroma-js");
var ChartAccent = require("../../build/chart-accent").ChartAccent;
var $ = require("jquery");

// Export modules to window.
window.d3 = d3;
window.chroma = chroma;
window.ChartAccent = ChartAccent;
window.$ = $;

var BaseChart = require("./charts").BaseChart;
var current_chart = null;

// ko.options.deferUpdates = true;

var strings = {
    stages: {
        "import": "Import Data",
        "visualization": "Create Chart",
        "annotation": "Annotate"
    },
    types: {
        "text": "Text",
        "number": "Number"
    }
};

window.strings = strings;

function FormatTableItem(column, value) {
    if(column.type() == "text") return value;
    if(column.type() == "number") {
        if(typeof(value) == "string") {
            value = value.replace(/\,/g, "");
        }
        value = +value;
        return value.toFixed(column.digits());
    }
}

window.FormatTableItem = FormatTableItem;

function IncrementObservable(o, step, min, max) {
    var v = o() + step;
    o(Math.max(min, Math.min(max, v)));
};

window.IncrementObservable = IncrementObservable;

// Custom binding: display a chart.
ko.bindingHandlers.chartaccent_chart = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called when the binding is first applied to an element
        // Set up any initial state, event handlers, etc. here
        var value = ko.unwrap(valueAccessor());
        d3.select(element).selectAll("*").remove();
        if(value) {
            var chart = new BaseChart(d3.select(element), value, { chartaccent: false });
        }

    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called once when the binding is first applied to an element,
        // and again whenever any observables/computeds that are accessed change
        // Update the DOM element based on the supplied values here.
        ko.bindingHandlers.chartaccent_chart.init(element, valueAccessor, allBindings, viewModel, bindingContext);
    }
};

// Custom binding: display a chart with ChartAccent panels.
ko.bindingHandlers.chartaccent_annotate_chart = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called when the binding is first applied to an element
        // Set up any initial state, event handlers, etc. here
        var value = ko.unwrap(valueAccessor());
        d3.select(element).selectAll("*").remove();
        if(value) {
            value = JSON.parse(JSON.stringify(value));
            var chart = new BaseChart(d3.select(element), value, { chartaccent: true });
            if(current_chart) {
                var annotations = current_chart.saveAnnotations();
            }
            current_chart = chart;
            if(annotations) {
                current_chart.loadAnnotations(annotations);
            }
        }

    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called once when the binding is first applied to an element,
        // and again whenever any observables/computeds that are accessed change
        // Update the DOM element based on the supplied values here.
        ko.bindingHandlers.chartaccent_annotate_chart.init(element, valueAccessor, allBindings, viewModel, bindingContext);
    }
};

function ChartAccentStandaloneModel() {
    // Data
    var self = this;
    self.stages = [
        "import",
        "visualization",
        "annotation"
    ];
    self.sample_datasets = [
        { name: "Average Monthly Temperature", hint: "try BarChart", csv: "datasets/temperature.csv", example: "datasets/temperature.png" },
        { name: "Beijing Air Quality", hint: "try LineChart", csv: "datasets/beijingair.csv", example: "datasets/beijingair.png" },
        { name: "Iris Flowers", hint: "try Scatterplot", csv: "datasets/iris.csv", example: "datasets/iris.png" },
        { name: "Auto MPG", hint: "try Scatterplot", csv: "datasets/car.csv", example: "datasets/car.png" },
        { name: "Gapminder", hint: "try Scatterplot", csv: "datasets/gapminder.csv", example: "datasets/gapminder.png" },
        { name: "Orange Sales", hint: "try BarChart/LineChart with error bars", csv: "datasets/oranges.csv", example: "datasets/oranges.png" },
    ];
    self.selected_sample_dataset = ko.observable(null);
    self.selected_sample_dataset.subscribe(function(newValue) {
        if(newValue != null) {
            let val = self.sample_datasets.filter(function(d) { return d.name == newValue; })[0];
            self.importCSVFromURL(val.csv);
        }
    });
    self.chart_types = [
        { name: "Bar Chart", id: "barchart", image: "images/barchart.png" },
        { name: "Line Chart", id: "linechart", image: "images/linechart.png" },
        { name: "Scatterplot", id: "scatterplot", image: "images/scatterplot.png" }
    ];
    self.chart_options = {
        x_column: ko.observable(null),
        y_column: ko.observable(null),                          // for scatterplot
        name_column: ko.observable(null),
        connect_points: ko.observable(false),
        color_column: ko.observable(null),
        size_column: ko.observable(null),
        size_scale: ko.observable(1),
        y_columns: ko.observableArray([ko.observable(null)]),   // for bar chart and line chart.
        scale_x_min: ko.observable(null),
        scale_y_min: ko.observable(null),
        scale_x_max: ko.observable(null),
        scale_y_max: ko.observable(null),
        scale_x_label: ko.observable("X axis"),
        scale_y_label: ko.observable("Y axis"),
        title: ko.observable(""),
        width: ko.observable(800),
        height: ko.observable(400)
    };
    self.chart_type = ko.observable();

    self.current_stage = ko.observable("import");

    // Default dataset is empty.
    self.data_columns = ko.observable();
    self.data_rows = ko.observable();

    // Once we change chart type, clear the columns.
    self.chart_type.subscribe(function(val) {
        self.chart_options.x_column(null);
        self.chart_options.y_column(null);
        current_chart = null;
    });
    // Reset x, y limits when column is changed.
    self.chart_options.x_column.subscribe(function(val) {
        self.chart_options.scale_x_min(null);
        self.chart_options.scale_x_max(null);
        self.chart_options.scale_x_label(val);
        current_chart = null;
    });
    self.chart_options.y_column.subscribe(function(val) {
        self.chart_options.scale_y_min(null);
        self.chart_options.scale_y_max(null);
        self.chart_options.scale_y_label(val);
        current_chart = null;
    });
    self.chart_options.y_columns.subscribe(function(val) {
        current_chart = null;
    });


    self.set_current_stage = function(stage) {
        self.current_stage(stage);
        if(stage == "annotation") {
            trackEvent("annotation/" + self.chart_type(), "start");
        }
    };

    self.set_chart_type = function(id) {
        self.chart_type(id);
    };

    self.export_status = ko.observable("");
    self.export_as = function(type) {
        console.log(current_chart);
        if(current_chart && current_chart.exportAs) {
            self.export_status("Exporting...");
            current_chart.exportAs(type, function() {
                self.export_status("");
            });
        }
    };
    self.save_chart = function() {
        if(!current_chart) return;
        var annotations = current_chart.saveAnnotations();
        var chart_info = {
            x_column: self.chart_options.x_column(),
            y_column: self.chart_options.y_column(),
            name_column: self.chart_options.name_column(),
            connect_points: self.chart_options.connect_points(),
            color_column: self.chart_options.color_column(),
            size_column: self.chart_options.size_column(),
            size_scale: self.chart_options.size_scale(),
            y_columns: self.chart_options.y_columns().map(function(x) { return x(); }),
            scale_x_min: self.chart_options.scale_x_min(),
            scale_y_min: self.chart_options.scale_y_min(),
            scale_x_max: self.chart_options.scale_x_max(),
            scale_y_max: self.chart_options.scale_y_max(),
            scale_x_label: self.chart_options.scale_x_label(),
            scale_y_label: self.chart_options.scale_y_label(),
            title: self.chart_options.title(),
            width: self.chart_options.width(),
            height: self.chart_options.height(),
            type: self.chart_type()
        };
        var saved = {
            chart: chart_info,
            annotations: annotations,
            data: {
                rows: self.data_rows(),
                columns: self.data_columns().map(function(d) {
                    return {
                        name: d.name,
                        type: d.type(),
                        digits: d.digits()
                    };
                })
            }
        };
        var file = new File([ JSON.stringify(saved, null, 2) ], "chartaccent.json", { type: "application/json" });
        saveAs(file);
    };
    self.load_chart_button = function() {
        d3.select("#loadFile").node().onchange = function() {
            var files = d3.select("#loadFile").node().files;
            if(files.length == 1) {
                var file = files[0];
                d3.select("#loadFile").node().parentNode.reset();
                if(file.name.match(/.json$/i)) {
                    var r = new FileReader();
                    r.onload = function(e) {
                        var contents = e.target.result;
                        self.load_chart(JSON.parse(contents));
                    }
                    r.readAsText(file, "utf-8");
                }
            }
        }
        d3.select("#loadFile").node().click();
    };

    self.load_chart = function(saved) {
        var chart_options = saved.chart;
        self.data_columns(saved.data.columns.map(function(c) {
            return {
                name: c.name,
                type: ko.observable(c.type),
                digits: ko.observable(c.digits)
            };
        }));
        current_chart = null;
        self.data_rows(saved.data.rows);
        self.chart_type(saved.chart.type);
        self.chart_options.x_column(chart_options.x_column);
        self.chart_options.y_column(chart_options.y_column);
        self.chart_options.name_column(chart_options.name_column);
        self.chart_options.connect_points(chart_options.connect_points);
        self.chart_options.color_column(chart_options.color_column);
        self.chart_options.size_column(chart_options.size_column);
        self.chart_options.size_scale(chart_options.size_scale);
        self.chart_options.y_columns(chart_options.y_columns.map(function(x) { return ko.observable(x) }));
        self.chart_options.scale_x_min(chart_options.scale_x_min);
        self.chart_options.scale_y_min(chart_options.scale_y_min);
        self.chart_options.scale_x_max(chart_options.scale_x_max);
        self.chart_options.scale_y_max(chart_options.scale_y_max);
        self.chart_options.scale_x_label(chart_options.scale_x_label);
        self.chart_options.scale_y_label(chart_options.scale_y_label);
        self.chart_options.title(chart_options.title);
        self.chart_options.width(chart_options.width);
        self.chart_options.height(chart_options.height);
        self.current_stage("annotation");
        if(current_chart) {
            current_chart.loadAnnotations(saved.annotations);
        }
    };

    // Computed columns.
    self.data_columns_all = ko.computed(function() {
        var columns = this.data_columns();
        if(columns) {
            return columns
                .map(function(d) {
                    return d.name;
                });
        } else {
            return [];
        }
    }, self);
    self.data_columns_text = ko.computed(function() {
        var columns = this.data_columns();
        if(columns) {
            return columns
                .filter(function(c) {
                    return c.type() == "text";
                })
                .map(function(d) {
                    return d.name;
                });
        } else {
            return [];
        }
    }, self);
    self.data_columns_number = ko.computed(function() {
        var columns = this.data_columns();
        if(columns) {
            return columns
                .filter(function(c) {
                    return c.type() == "number";
                })
                .map(function(d) {
                    return d.name;
                });
        } else {
            return [];
        }
    }, self);

    self.prepared_rows_columns = ko.computed(function() {
        // Check if the chart is complete, otherwise return null.
        var chart_type = self.chart_type();
        var columns = self.data_columns();
        var rows = self.data_rows();
        if(!chart_type || !rows || !columns) return null;

        // Prepare rows and columns.
        columns = columns.map(function(d) {
            return { name: d.name, type: d.type(), digits: d.digits() };
        });
        rows = rows.map(function(row) {
            var r = { };
            for(var j = 0; j < columns.length; j++) {
                if(columns[j].type == "number") {
                    r[columns[j].name] = row[columns[j].name] !== undefined ? +(row[columns[j].name].replace(/\,/g, "")) : null;
                } else {
                    r[columns[j].name] = row[columns[j].name];
                }
            }
            return r;
        });

        return {
            rows: rows, columns: columns
        };
    }, self);

    self.bar_chart_x_column_multiple_value = ko.computed(function() {
        var _prepared_rows_columns = self.prepared_rows_columns();
        if(!_prepared_rows_columns) return false;

        var rows = _prepared_rows_columns.rows;
        var columns = _prepared_rows_columns.columns;
        var value_counter = { };
        var multiple_value = false;

        var x_column = self.chart_options.x_column();
        if(!x_column) return false;

        rows.forEach(function(r) {
            if(r[x_column]) {
                var value = r[x_column].toString();
                if(value_counter[value]) {
                    multiple_value = true;
                } else {
                    value_counter[value] = true;
                }
            }
        });
        return multiple_value;
    }, self);

    // Chart information.
    self.chart_information = ko.computed(function() {
        // Check if the chart is complete, otherwise return null.
        var chart_type = self.chart_type();
        var columns = self.data_columns();
        var rows = self.data_rows();
        if(!chart_type || !rows || !columns) return null;

        var _prepared_rows_columns = self.prepared_rows_columns();
        var rows = _prepared_rows_columns.rows;
        var columns = _prepared_rows_columns.columns;

        var parse_scale_limits = function(value) {
            if(value === "" || value === null || value === undefined) return undefined;
            return +value;
        }

        // Return chart specification.
        if(chart_type == "barchart" || chart_type == "linechart") {
            var x_column = self.chart_options.x_column();
            var y_columns = self.chart_options.y_columns().map(function(d) { return d(); }).filter(function(x) { return x; });
            if(!x_column || y_columns.length == 0) return null;
            // The x_column must have only one row per value, otherwise the chart will be incorrect.
            if(self.bar_chart_x_column_multiple_value()) return null;
            return {
                rows: rows,
                columns: columns,
                type: chart_type,
                x_column: x_column,
                y_columns: y_columns,
                scale_y_min: parse_scale_limits(self.chart_options.scale_y_min()),
                scale_y_max: parse_scale_limits(self.chart_options.scale_y_max()),
                scale_y_label: self.chart_options.scale_y_label(),
                title: self.chart_options.title(),
                width: self.chart_options.width(),
                height: self.chart_options.height()
            }
        }
        if(chart_type == "scatterplot") {
            var x_column = self.chart_options.x_column();
            var y_column = self.chart_options.y_column();
            var name_column = self.chart_options.name_column();
            if(!x_column || !y_column || !name_column) return null;
            var color_column = self.chart_options.color_column();
            var size_column = self.chart_options.size_column();
            return {
                rows: rows,
                columns: columns,
                type: chart_type,
                x_column: x_column,
                y_column: y_column,
                name_column: name_column,
                color_column: color_column,
                size_column: size_column,
                size_scale: self.chart_options.size_scale(),
                scale_x_min: parse_scale_limits(self.chart_options.scale_x_min()),
                scale_y_min: parse_scale_limits(self.chart_options.scale_y_min()),
                scale_x_label: self.chart_options.scale_x_label(),
                scale_x_max: parse_scale_limits(self.chart_options.scale_x_max()),
                scale_y_max: parse_scale_limits(self.chart_options.scale_y_max()),
                scale_y_label: self.chart_options.scale_y_label(),
                connect_points: self.chart_options.connect_points(),
                title: self.chart_options.title(),
                width: self.chart_options.width(),
                height: self.chart_options.height()
            }
        }
        // unknown chart type.
        return null;
    }, self);
};

ChartAccentStandaloneModel.prototype.gotoPreviousStage = function() {
    let current = this.current_stage();
    if(current == "annotation") this.current_stage("visualization");
    if(current == "visualization") this.current_stage("import");
    if(current == "import") {
        window.location = "index.html";
    }
}

ChartAccentStandaloneModel.prototype.resetChartInformation = function() {
    var self = this;
    self.chart_type(null);
    self.chart_options.x_column(null);
    self.chart_options.y_column(null);
    self.chart_options.name_column(null);
    self.chart_options.connect_points(false);
    self.chart_options.color_column(null);
    self.chart_options.size_column(null);
    self.chart_options.size_scale(1);
    self.chart_options.y_columns([ ko.observable() ]);
    self.chart_options.scale_x_min(null);
    self.chart_options.scale_y_min(null);
    self.chart_options.scale_x_max(null);
    self.chart_options.scale_y_max(null);
    self.chart_options.scale_x_label("X axis");
    self.chart_options.scale_y_label("Y axis");
    self.chart_options.title("");
    self.chart_options.width(800);
    self.chart_options.height(400);
    current_chart = null;
}

ChartAccentStandaloneModel.prototype.importCSVFromText = function(csv_text) {
    var self = this;
    var rows = d3.csv.parseRows(csv_text);
    var header = rows[0];
    header = header.map(function(d, i) {
        if(d == "") return "C" + (i + 1);
        else return d;
    });
    var objects = rows.slice(1).filter(function(d) {
        return d.length >= header.length;
    }).map(function(d) {
        var r = { };
        for(var t = 0; t < header.length; t++) {
            r[header[t]] = d[t];
        }
        return r;
    });
    self.resetChartInformation();
    self.data_columns(header.map(function(d, i) {
        var type = "text";
        var max_digits = 0;
        var is_all_numbers_of_nans = objects.every(function(o) {
            var v = o[d];
            v = v.replace(/\,/g, "");
            if(v == "" || +v == +v) {
                var ax = (+v).toFixed(8).match(/\.(\d+)$/)[1];
                var zeros = ax.match(/(0*)$/)[1];
                max_digits = Math.max(max_digits, 8 - zeros.length);
                return true;
            } else {
                return false;
            }
        });
        if(is_all_numbers_of_nans) type = "number";

        return { name: d, type: ko.observable(type), digits: ko.observable(max_digits) }
    }));
    self.data_rows(objects);
    // Track:
    trackEvent("dataset", "import", "columns:" + header.length + ",rows:" + objects.length);
};

ChartAccentStandaloneModel.prototype.importCSVFromURL = function(url, callback) {
    var self = this;
    d3.text(url, function(error, data) {
        self.importCSVFromText(data);
        if(callback) callback();
    });
};

ChartAccentStandaloneModel.prototype.importCSV = function(file, callback) {
    var self = this;
    reader = new FileReader();
    reader.onload = function(e) {
        output = e.target.result;
        self.importCSVFromText(output);
        if(callback) callback();
    };
    reader.readAsText(file);
};

var model = new ChartAccentStandaloneModel();
ko.applyBindings(model);

window.onload = function () {
    if (typeof history.pushState === "function") {
        history.pushState("jibberish", null, null);
        window.onpopstate = function () {
            history.pushState('newjibberish', null, null);
            // Handle the back (or forward) buttons here
            // Will NOT handle refresh, use onbeforeunload for this.
            model.gotoPreviousStage();
        };
    }
    else {
        var ignoreHashChange = true;
        window.onhashchange = function () {
            if (!ignoreHashChange) {
                ignoreHashChange = true;
                window.location.hash = Math.random();
                // Detect and redirect change here
                // Works in older FF and IE9
                // * it does mess with your hash symbol (anchor?) pound sign
                // delimiter on the end of the URL
            }
            else {
                ignoreHashChange = false;
            }
        };
    }
}
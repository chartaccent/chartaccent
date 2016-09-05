// ChartAccent as a module.

var ChartAccent = ((function() {
    var Module = { };

    var d3 = require("d3");
    var chroma = require("chroma-js");
    var $ = require("jquery");
    var jQuery = require("jquery");
    var typeahead = require("typeahead.js-browserify");

    typeahead.loadjQueryPlugin();

    import "chart-accent.js";

    return Module;
})());

exports.ChartAccent = ChartAccent;
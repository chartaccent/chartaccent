define("ChartAccent", [ "d3", "chroma-js", "jquery", "typeahead.js-browserify" ], function(d3, chroma, $, typeahead) {
    var jQuery = $;
    typeahead.loadjQueryPlugin();
    var Module = {};
    import "chart-accent.js";
    return Module;
});
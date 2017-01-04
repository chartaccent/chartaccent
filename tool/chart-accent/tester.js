var ChartAccent = ((function() {
    var Module = { };

    import "chart-accent.js";

    return Module;
})());

if(typeof(exports) !== "undefined") {
    exports.EventManager = ChartAccent.EventManager.Test;
    exports.Expression = ChartAccent.Expression.Test;
    exports.DependencyManager = ChartAccent.DependencyManager.Test;
}

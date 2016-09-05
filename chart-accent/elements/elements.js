var ChartElements = {
    Create: function(owner, type, info) {
        return new ChartElements[type](owner, info);
    }
};

import "axis.js";
import "series.js";
import "legend.js";

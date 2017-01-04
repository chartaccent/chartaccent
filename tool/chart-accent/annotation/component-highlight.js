Annotation.prototype.renderComponentHighlight = function(RC, RC2, component) {
    if(!component.visible || !this.visible) return;
    if(this.target.type == "items") {
        this.target.items.forEach(function(desc) {
            var elements = desc.elements;
            var items = desc.items;
            var g = RC2.addElement("fg", "g", "highlight", getObjectUniqueID(desc) + getObjectUniqueID(component) + getObjectUniqueID(elements));
            var overlay = elements.createHighlightOverlay(g, items, component.style);
            // if(RC.hasSelection() || RC.isSelected(RC2.annotation)) {
            //     overlay.style("pointer-events", "none");
            // }
            if(RC.isSelectionInAnnotation(RC2.annotation)) {
                overlay.style("pointer-events", "none");
            }
            // overlay.call(function() { Styles.applyStyle(component.style, this); });
            if(overlay) {
                overlay.style({
                    "cursor": "pointer"
                });
                overlay.on("mousedown", function() {
                    RC2.startPopoutEditor();
                });
                overlay.on("mouseover", function() {
                    if(!RC.isSelectionInAnnotation(RC2.annotation)) {
                        if(d3.event.which == 0) {
                            RC2.annotation.renderSelectionBoxHint(RC);
                        }
                    }
                });
                overlay.on("mouseleave", function() {
                    RC2.annotation.removeSelectionBoxHint(RC);
                });
            } else {
                g.remove();
            }
        });
    }
    if(this.target.type == "range") {
        // Find all items in this range.
        this.target_inherit.serieses.forEach(function(elements) {
            if(elements.createRangeHighlightOverlay) {
                var g = RC2.addElement("fg", "g", "highlight", getObjectUniqueID(elements) + getObjectUniqueID(component));
                var overlay = elements.createRangeHighlightOverlay(g, RC2.range, RC2.axis, this.target_inherit.mode, component.style);
                if(RC.isSelectionInAnnotation(RC2.annotation)) {
                    overlay.style("pointer-events", "none");
                }
                // overlay.call(function() { Styles.applyStyle(component.style, this); });
                if(overlay) {
                    overlay.style({
                        "cursor": "pointer"
                    });
                    overlay.on("mousedown", function() {
                        RC2.startPopoutEditor();
                    });
                    overlay.on("mouseover", function() {
                        if(!RC.isSelectionInAnnotation(RC2.annotation)) {
                            if(d3.event.which == 0) {
                                RC2.annotation.renderSelectionBoxHint(RC);
                            }
                        }
                    });
                    overlay.on("mouseleave", function() {
                        RC2.annotation.removeSelectionBoxHint(RC);
                    });
                } else {
                    g.remove();
                }
            }
        }.bind(this));
    }
};

Annotation.prototype.renderComponentHighlightLine = function(RC, RC2, component) {
    if(!component.visible || !this.visible) return;
    if(this.target.type == "items") {
        this.target.items.forEach(function(desc) {
            var elements = desc.elements;
            var items = desc.items;
            var g = RC2.addElement("fg", "g", "highlight", getObjectUniqueID(desc) + getObjectUniqueID(component) + getObjectUniqueID(elements));
            var overlay = elements.createLineHighlightOverlay(g, items, component.style);
            // overlay.call(function() { Styles.applyStyle(component.style, this); });
            if(overlay) {
                overlay.style({
                    "cursor": "pointer"
                });
                overlay.on("mousedown", function() {
                    RC2.startPopoutEditor();
                });
            } else {
                g.remove();
            }
        });
    }
    if(this.target.type == "range") {
        // Find all items in this range.
        this.target_inherit.serieses.forEach(function(elements) {
            if(elements.createRangeHighlightOverlay) {
                var g = RC2.addElement("fg", "g", "highlight", getObjectUniqueID(elements) + getObjectUniqueID(component));
                var overlay = elements.createRangeLineHighlightOverlay(g, RC2.range, RC2.axis, this.target_inherit.mode, component.style);
                // overlay.call(function() { Styles.applyStyle(component.style, this); });
                if(overlay) {
                    overlay.style({
                        "cursor": "pointer"
                    });
                    overlay.on("mousedown", function() {
                        RC2.startPopoutEditor();
                    });
                } else {
                    g.remove();
                }
            }
        }.bind(this));
    }
};

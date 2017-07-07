var CreateEditorPopup = function(name, info) {
    var wrapper = MakeEditorPopupWrapper(info);
    var popup = new (EditorPopups[name])(info, wrapper);
    Events.on(wrapper, "remove", function() { Events.raise(popup, "remove"); });
    return popup;
};

var MakeEditorPopupWrapper = function(info) {
    var wrapper = getRootContainer().append("div").classed("chartaccent-popout", true);

    var target_rect = info.anchor.getBoundingClientRect();
    var body_rect = document.body.parentNode.getBoundingClientRect();

    wrapper.style({
        "left": (target_rect.left - body_rect.left) + "px",
        "top": (target_rect.top - body_rect.top + target_rect.height + 6) + "px"
    });

    var border_triangle = wrapper.append("div").classed("border-triangle", true);

    if(info.align == "right") {
        wrapper.style({
            "right": -(target_rect.right - body_rect.right) + "px",
            "left": null
        });
        border_triangle.classed("align-right", true);
    }
    wrapper.style({
        "position": "absolute",
        "z-index": "1000000",
        "background": "white",
        "border": "1px solid #444",
        "box-shadow": "0 0 2px rgba(0,0,0,0.3)"
    });

    var clickout_handler = setupClickoutHandlers(wrapper, function(type) {
        if(!info.onClickout || info.onClickout()) {
            wrapper.remove();
            Events.raise(wrapper, "remove");
            return true;
        } else {
            return false;
        }
    }, info.parent_clickout_handlers);

    info.remove = function() {
        wrapper.remove();
        clickout_handler.remove();
    };

    return wrapper;
};

var EditorPopups = { };

import "color-picker.js";
import "select.js";
import "select-items.js";

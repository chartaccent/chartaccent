// info: {
//    serieses: [ "name1", "name2", ... ]
//    modes: [ "mode1", "mode2", ... ]
//    default_mode: "mode1"
// }
EditorPopups.SelectItems = function(info, wrapper) {
    var self = this;

    var selected_serieses = new Set(info.serieses);
    var selected_mode = info.default_mode;
    var include_equal = info.default_include_equal;

    wrapper.append("h3").text("Mode");
    MakeSwitchButton(wrapper.append("p").append("span"), selected_mode, info.modes, function(newmode) {
        selected_mode = newmode;
    });

    if(info.show_include_equal) {
        MakeCheckbox(wrapper.append("p").append("span"), "Include Equal", include_equal, function(value) {
            include_equal = value;
        });
    }

    wrapper.append("h3").text("Series");
    var ul = wrapper.append("ul");
    ul.classed("checkboxes", true);
    var li = ul.selectAll("li").data(info.serieses);
    var li_enter = li.enter().append("li").classed("btn-toggle", true);
    li_enter.append("span").classed("checkbox", true).append("span");
    li_enter.append("span").classed("name", true);
    li_enter.style("line-height", "20px");
    li.select(".name").text(function(d) { return " " + d; });
    var update_checked = function() {
        li.select("span.checkbox").select("span").attr("class", function(d) {
            return selected_serieses.has(d) ? "chartaccent-icons-checkbox-correct-checked" : "chartaccent-icons-checkbox-correct-empty";
        });
        li.classed("active", function(d) { return selected_serieses.has(d); });
    };
    li.on("click", function(d) {
        if(selected_serieses.has(d)) selected_serieses.delete(d);
        else selected_serieses.add(d);
        update_checked();
    });
    update_checked();

    var footer = wrapper.append("footer").append("span").style("float", "right");
    var btn_ok = footer.append("span").classed("btn", true).text("OK");
    footer.append("span").text(" ");
    var btn_cancel = footer.append("span").classed("btn", true).text("Cancel");

    btn_ok.on("click", function() {
        Events.raise(self, "selected", include_equal ? selected_mode + "-or-equal" : selected_mode, arrayFromSet(selected_serieses));
        info.remove();
    });

    btn_cancel.on("click", function() {
        info.remove();
    });

    // wrapper.classed("select", true);
    // var ps = wrapper.append("ul").selectAll("li").data(info.choices);
    // var li = ps.enter().append("li")
    // li.append("span").call(IconFont.addIcon("correct")).classed("mark", true);
    // li.append("label")
    //     .text(function(d) { return d.name; })
    //     .style({
    //         "font-family": function(d) { return d.font ? d.font : null; }
    //     });
    // ps.classed("active", function(d) { return value == d.value; });
    // ps.on("click", function(d) {
    //     Events.raise(self, "value", d.value);
    //     info.remove();
    // });
};

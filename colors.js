var chroma = require("chroma-js");


var black = chroma("#000");
var white = chroma("#FFF");

var x = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];

var grays = x.map((i) => {
    var value = i / 9;
    var color = chroma.mix(black, white, value, "lab");
    return "$gray-" + i + "00: " + color.hex() + ";";
}).join("\n");

console.log(grays);

var primaryColor = chroma("#327BCA");
var colors = x.map((i) => {
    var value = i / 9;
    var pcolor = primaryColor.hcl();
    pcolor[2] = (chroma("#FFF").hcl()[2] - chroma("#000").hcl()[2]) * value + chroma("#000").hcl()[2];
    return "$primary-" + i + "00: " + chroma.hcl(pcolor).hex() + ";";
}).join("\n");

console.log(colors);
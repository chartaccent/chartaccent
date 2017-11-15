import "iconfont/iconfont.css.js";

import "utils/utils.js";

import "widgets/widgets.js";

import "expression/expression.js";
import "input-widget/widget.js";

import "editor-popups/editor-popups.js";

import "annotation/annotation.js";

import "chart-representation.js";

var ChartAccent = function(info) {
    this.charts = [];

    this.layer_annotation = resolveToSVGSelection(info.layer_annotation);
    this.layer_background = resolveToSVGSelection(info.layer_background);
    this.panel = info.panel;
    this.toolbar = info.toolbar;
    // Find the SVG node containing layer_annotation
    var svg = this.layer_annotation.node();
    while(svg.tagName != "svg") {
        svg = svg.parentNode;
    }
    this.svg = svg;
};

ChartAccent.prototype.summarizeState = function() {
    return this.charts[0].summarizeState();
};

ChartAccent.prototype.saveAnnotations = function() {
    if(this.charts.length == 0) return null;
    return deepClone(this.charts[0].serializeAnnotations(this.charts[0].currentState()));
};

ChartAccent.prototype.loadAnnotations = function(saved, logEvent) {
    var state = this.charts[0].deserializeAnnotations(saved);
    this.charts[0].loadState(state);
    if(logEvent) {
        this.charts[0].event_tracker("load", this.summarizeState(state));
    }
};

ChartAccent.prototype.AddChart = function(info) {
    var repr = ChartRepresentation.Create(this, info);
    this.charts.push(repr);
    return repr;
};

ChartAccent.prototype.getSVGDataBlob = function() {
    var s = new XMLSerializer();
    var str = s.serializeToString(this.svg);
    var additional_css = ".chartaccent-edit-widget { visibility: hidden; }";
    var p_insert = str.indexOf(">") + 1;
    str = str.slice(0, p_insert) + '<defs><style type="text/css"><![CDATA[' + additional_css + ']]></style></defs>' + str.slice(p_insert);
    // create a file blob of our SVG.
    var doctype = '<?xml version="1.0" standalone="no"?>'
                + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
    var blob = new Blob([ doctype + str], { type: 'image/svg+xml;charset=utf-8' });
    return blob;
};

function b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}

ChartAccent.prototype.getSVGDataURLBase64 = function() {
    var s = new XMLSerializer();
    var str = s.serializeToString(this.svg);
    var additional_css = ".chartaccent-edit-widget { visibility: hidden; }";
    var p_insert = str.indexOf(">") + 1;
    str = str.slice(0, p_insert) + '<defs><style type="text/css"><![CDATA[' + additional_css + ']]></style></defs>' + str.slice(p_insert);
    // create a file blob of our SVG.
    var doctype = '<?xml version="1.0" standalone="no"?>'
                + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
    var dataurl = "data:image/svg+xml;base64," + b64EncodeUnicode(doctype + str);
    return dataurl;
};

ChartAccent.prototype.getSVGDataURL = function() {
    var blob = this.getSVGDataBlob();
    var url = window.URL.createObjectURL(blob);
    return url;
};

ChartAccent.prototype.getImageDataURL = function(format, scale, callback) {
    var img = new Image();
    img.onload = function() {
        // Now that the image has loaded, put the image into a canvas element.
        var canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = "#FFF";
        ctx.scale(scale, scale);
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);
        var canvasUrl = canvas.toDataURL(format);
        callback(canvasUrl);
    };
    img.src = this.getSVGDataURL();
};

ChartAccent.prototype.getImageDataBlob = function(format, scale, callback) {
    var img = new Image();
    img.onload = function() {
        // Now that the image has loaded, put the image into a canvas element.
        var canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = "#FFF";
        ctx.scale(scale, scale);
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(function(blob) {
            callback(blob);
        }, format);
    };
    img.src = this.getSVGDataURL();
};

ChartAccent.prototype.getAnimatedGIFImages = function(callback) {
    this.charts[0].makeAnimation(callback);
};

Module.Create = function(info) {
    return new ChartAccent(info);
};

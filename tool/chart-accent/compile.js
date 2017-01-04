// Custom script that handles "import"

var input_file = process.argv[2];
var output_file = process.argv[3];

var FS = require("fs");
var PATH = require("path");

function ProcessFile(path) {
    var content = FS.readFileSync(path, "utf-8");
    content = content.replace(/^[ \t]*import[ \t]+\"(.*?)\"[ \t]*(\;?)[ \t]*$/gm, function(all, filename) {
        return ProcessFile(PATH.join(PATH.dirname(path), filename));
    });
    content = content.replace(/^[ \t]*import[ \t]*base64[ \t]+\"(.*?)\"[ \t]*as[ \t]*([a-zA-Z0-9\_]+)(\;?)[ \t]*$/gm, function(all, filename, variablename) {
        return "var " + variablename + " = \"" + FS.readFileSync(PATH.join(PATH.dirname(path), filename)).toString("base64") + "\";";
    });
    return content;
}

var result = ProcessFile(input_file)

FS.writeFileSync(output_file, result, 'utf-8');

var FileUtil = require("../../file/FileUtil"), async = require("async"),
    _ = require("underscore");

var tmplFolderPath = __dirname + "/tmpl";

var tmplFiles = FileUtil.readDir(tmplFolderPath);

var compiled = {};

tmplFiles.forEach(function (fileName) {
    console.log(fileName)
    compiled[fileName.split(".")[0]] = _.template(FileUtil.readFile(tmplFolderPath + "/" + fileName, "utf8"));
});

exports.Compiled = compiled;

exports.writeJSFile = function(path, tmplName, options){
    FileUtil.createFile(path, compiled[tmplName](options))
}

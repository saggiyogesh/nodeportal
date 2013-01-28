var watchTree = require("fs-watch-tree").watchTree;
var mime = require("mime");

var validMimeTypes = ["application/javascript", "text/css", "application/json"];

function isValidFile(name) {
    return utils.containsArray(validMimeTypes, mime.lookup(name));
}

/**
 * Watches the files in directory recursively given by the path.
 * Only .js, .json and .css files are watched.
 * Callback fn is called when a watch event is raised, passed with following paramaters:
 *      1. String: name of file with absolute path which raised the event
 *      2. boolean: true in case when the either file is modified or deleted otherwise false.
 *      3. boolean: true if file is deleted.
 * @param path
 * @param fn
 * @param options
 */
module.exports = function (path, fn, options) {
    options = options || {};
    var watch = watchTree(path, options, function (event) {
        var fileName = event.name;

        if (isValidFile(fileName)) {
            fn(event.name, event.isModify(), event.isDelete());

        }
    });

    return watch;
};
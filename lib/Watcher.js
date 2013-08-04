var chokidar = require('chokidar');
var mime = require("mime");

var validMimeTypes = ["application/javascript", "text/css", "application/json"];


function isValidFile(name) {
    return utils.containsArray(validMimeTypes, mime.lookup(name));
}

exports.ADD_EVENT = "add";
exports.DELETE_EVENT = "delete";
exports.CHANGE_EVENT = "change";
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
    options = options || {ignored: /^\./, persistent: true};
    var watcher = chokidar.watch(path, options);

    watcher
        .on(exports.ADD_EVENT, function (path) {
            fn(path, exports.ADD_EVENT);
        })
        .on(exports.CHANGE_EVENT, function (path) {
            fn(path, exports.CHANGE_EVENT);
        })
        .on('unlink', function (path) {
            fn(path, exports.DELETE_EVENT);
        });

    watcher.close();
};


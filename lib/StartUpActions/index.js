var FileUtil = require("../file/FileUtil"),
    AppProperties = require("../AppProperties"),
    async = require("async");

module.exports = function (app, next) {
    var rootPath = process.cwd();
    var files = AppProperties.get("APP_STARTUP_ACTIONS_FILE");
    var actions = [], done = 1;
    files.split(",").forEach(function (file) {
        file = FileUtil.readFile(FileUtil.realPath(rootPath, file));
        var actionsArr = JSON.parse(file)
        Debug._l("file : " + actionsArr);
        actionsArr.forEach(function (action) {
            action = FileUtil.realPath(rootPath, action);
            var fn = require(action);
            _.isFunction(fn) && actions.push(fn(app, done));
        });
    });
//    Debug._l(actions);

    async.series(actions, function (err, end) {
        if (err) end = null;
        else end = end[end.length - 1]
        next(err, end);
    });
};
/**
 * Startup action to configure plugins and configure plugin routes
 */

var FileUtil = require("../file/FileUtil"),
    plugins = require("../plugins"),
    async = require('async'),
    DefaultDataHandler = require('./DefaultDataHandler'),
    InitOtherDefaultData = require('./InitOtherDefaultData'),
    ProcessPermission = require('./ProcessPermission');

module.exports = function (app, done) {
    return function (next) {
        FileUtil.readFile(FileUtil.realPath(utils.getPluginsPath(), "plugin_properties.json"), function (err, data) {
            if (!err) {
                plugins.init(app, JSON.parse(data));
            }
            else {
                done = null;
            }

            async.series(
                [
                    DefaultDataHandler(app, done),
                    InitOtherDefaultData(app, done),
                    ProcessPermission(app, done)
                ],
                next);
        });
    };
};
/**
 * Startup action to create necessary dirs
 */


var AppProperties = require("../AppProperties"),
    FileUtil = require("../file/FileUtil");
module.exports = function (app, done) {
    return function (next) {
        try {
            FileUtil.existsThenCreateDir(utils.getDataDirPath());
            FileUtil.existsThenCreateDir(utils.getResourcesDirPath());
            FileUtil.existsThenCreateDir(utils.getThemesDirPath());
            FileUtil.existsThenCreateDir(utils.getLayoutsDirPath());
            FileUtil.existsThenCreateDir(utils.getUserProfilePicDirPath());
            next(null, done);
        }
        catch (e) {
            next(e, null);
        }

    };
};
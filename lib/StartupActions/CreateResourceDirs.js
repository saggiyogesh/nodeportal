/**
 * Startup action to create necessary dirs
 */


var AppProperties = require("../AppProperties"),
    FileUtil = require("../file/FileUtil");
module.exports = function (app, done) {
    return function (next) {
        var rootPath = app.set("appPath"), dataDirPath = FileUtil.realPath(rootPath, AppProperties.get("DATA_FOLDER_PATH")) ,
            resourcesPath = FileUtil.realPath(dataDirPath, "resources"),
            themesDirPath = rootPath + "/" + "views/themes", layoutsDirPath = rootPath + "/" + "views/layouts";
        try {
            FileUtil.existsThenCreateDir(dataDirPath);
            FileUtil.existsThenCreateDir(resourcesPath);
            FileUtil.existsThenCreateDir(themesDirPath);
            FileUtil.existsThenCreateDir(layoutsDirPath);
            next(null, done);
        }
        catch (e) {
            next(e, null);
        }

    };
};
var fs = require("fs"), path = require("path"), plugins = require("../plugins"),
    setCache = require("./Cache").set,
    removeCache = require("./Cache").remove,
    DBActions = require("../DBActions"),
    ThemeUtil = require("../ThemeUtil"),
    Watcher = require("../Watcher"),
    FileUtil = require("../file/FileUtil");

/**
 * Returns unique id depends on file location i.e. a theme file or a plugin file
 * @param filePath
 */
function generateIdFromFilePath(filePath) {
    var arr = filePath.split("/"), len = arr.length, last = arr[len - 1],
        secondLast = arr[len - 2], thirdLast = arr[len - 3];

    var isPluginFile = utils.contains(filePath, "/plugins/");
    return isPluginFile ? thirdLast + "/" + last : thirdLast + "/" + secondLast + "/" + last;
}

/**
 * Reads file and cache its data
 * @param id
 * @param filePath
 */
function generateCache(filePath) {
    var id = generateIdFromFilePath(filePath);
    Debug._l(id);
    fs.readFile(filePath, 'utf8', function (err, data) {
        if (err) {
            Debug._l("err: " + err);
            return;
        }
        fs.stat(filePath, function (err, stat) {
            setCache(id, {modified:stat.mtime, content:data });
        });
    });
}

/**
 * watch a directory for changes
 * @param id
 * @param dirPath
 */
function addWatcher(dirPath) {
    Debug._l(dirPath);
    /*fs.watchFile(dirPath, function (curr, prev) {
     //        console.log('the current mtime is: ' + curr.mtime);
     //        console.log('the previous mtime was: ' + prev.mtime);

     generateCache(id, dirPath);
     });*/
    var watch = Watcher(dirPath, function (filePath, isModified, isDeleted) {
        if (isModified) {
            Debug._l(generateIdFromFilePath(filePath));
            generateCache(filePath);
        }
        if (isDeleted) {
            removeCache(generateIdFromFilePath(filePath));
        }
    });

    return watch;
}

/**
 * Initiates file watcher and caching of plugin's client js file.
 * @param app
 */
function initPluginsJSWatch(app) {
    utils.tick(function () {
        var pluginsHome = utils.getPluginsPath();
        var allPlugins = plugins.getAll();
        Object.keys(allPlugins).forEach(function (pluginId) {
            var pluginPath = pluginsHome + "/" + pluginId + "/client";
            var fileName = pluginId + ".js",
                pluginJSFilePath = pluginPath + "/" + fileName,
                fileId = pluginId + "/" + fileName;
            var exists = path.exists || fs.exists;
            exists(pluginJSFilePath, function (exists) {
                if (exists) {
                    generateCache(pluginJSFilePath);
                    addWatcher(pluginPath);
                }
            });
        });
    })
}

/**
 * caches and watches theme directory
 * @param app
 * @param theme
 */
var cacheAndWatchTheme = exports.cacheAndWatchTheme = function (app, theme) {
    var viewsPath = utils.getViewsPath(), themePath = viewsPath + "/" + theme.path,
        cssPath = themePath + "/" + "css", jsPath = themePath + "/" + "js",
        name = utils.normalize(theme.name),
        readDir = function (type, path) {
            if (FileUtil.exists(path)) {
                addWatcher(path);
                fs.readdir(path, function (err, files) {
                    if (err) throw err;

                    files.forEach(function (fileName, index) {
                        var filePath = path + "/" + fileName;
                        generateCache(filePath);
                        ThemeUtil.setThemeFile(type, name, fileName);
                    });
                });
            }
        };

    ThemeUtil.initCache(name);
    utils.tick(function () {
        readDir("css", cssPath);
        readDir("js", jsPath);
    });
};

/**
 * Initiates file watcher and caching of theme's css and js files.
 * @param app
 */
function initThemeFilesWatch(app) {
    utils.tick(function () {
        var viewsPath = utils.getViewsPath();
        var dbAction = new DBActions.DBActions(app.set("db"), {modelName:"Theme"});
        dbAction.get("getAll", null, function (err, themes) {
            if (err) throw err;
            themes.forEach(function (theme) {
                cacheAndWatchTheme(app, theme);
            });
        })
    });
}

exports.init = function (app) {
    initPluginsJSWatch(app);
    initThemeFilesWatch(app);
};


var path = require("path"), plugins = require("../plugins"),
    setCache = require("./Cache").set,
    removeCache = require("./Cache").remove,
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
 * @param filePath
 */
function generateCache(filePath) {
    var id = generateIdFromFilePath(filePath);
    Debug._l(id);
    FileUtil.readFile(filePath, 'utf8', function (err, data) {
        if (err) {
            Debug._l("err: " + err);
            return;
        }
        FileUtil.stat(filePath, function (err, stat) {
            setCache(id, {modified: stat.mtime, content: data });
        });
    });
}

/**
 * watch a directory for changes
 * @param dirPath
 */
function addWatcher(dirPath) {
    Debug._l(dirPath);
    Watcher(dirPath, function (filePath, action) {
        switch (action) {
            case Watcher.ADD_EVENT:
            case Watcher.CHANGE_EVENT:
                Debug._l(generateIdFromFilePath(filePath));
                generateCache(filePath);
                break;

            case Watcher.DELETE_EVENT:
                removeCache(generateIdFromFilePath(filePath));
                break;

        }
    });

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
            FileUtil.exists(pluginJSFilePath, function (exists) {
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
        cssPath = themePath + "/" + ThemeUtil.CSS_FOLDER_NAME,
        jsPath = themePath + "/" + ThemeUtil.JS_FOLDER_NAME,
        name = utils.normalize(theme.name),
        readDir = function (type, path) {
            if (FileUtil.exists(path)) {
                addWatcher(path);
                FileUtil.readDir(path, function (err, files) {
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
        readDir(ThemeUtil.CSS_FOLDER_NAME, cssPath);
        readDir(ThemeUtil.JS_FOLDER_NAME, jsPath);
    });
};

/**
 * Initiates file watcher and caching of theme's css and js files.
 * @param app
 */
function initThemeFilesWatch(app) {
    utils.tick(function () {
        var viewsPath = utils.getViewsPath();
        app.getService("Theme").getAll(function (err, themes) {
            if (err) throw err;
            themes.forEach(function (theme) {
                cacheAndWatchTheme(app, theme);
            });
        })
    });
}

exports.init = function (app) {
//    initPluginsJSWatch(app);
    initThemeFilesWatch(app);
};


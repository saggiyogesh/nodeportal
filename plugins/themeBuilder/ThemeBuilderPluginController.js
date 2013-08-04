var BasePluginController = require(process.cwd() + "/lib/BasePluginController");

var DEFAULT_THEME = "default", THEME_SCHEMA = "Theme",
    DEFAULT_DIRS = ["css", "js", "tmpl", "images"];
var ThemeBuilderPluginController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route: '/newTheme/:name?', action: createTheme
        });
        that.get({
            route: '/openTheme/:id?', action: openTheme
        });
        that.get({
            route: '/show/:id/:folderName/:name', action: getFile
        });
        that.get({
            route: '/save/:id/:folderName/:name', action: updateFile
        });
        that.get({
            route: '/newFile/:id/:folderName/:name', action: newFile
        });
        that.get({
            route: '/deleteFile/:id/:folderName/:name', action: deleteFile
        });
        that.post({
            route: '/uploadThemeFile',
            action: uploadThemeFile
        });
    });
};

util.inherits(ThemeBuilderPluginController, BasePluginController);

function getViewsHome(app) {
    return app.set("views");
}

function getThemeHome(app) {
    return getViewsHome(app) + "/themes";
}

function getDefaultThemePath(app) {
    return getViewsHome(app) + "/shell/theme/default";
}

function uploadThemeFile(req, res, next) {
    var that = this, params = req.params, DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getInstance(req, THEME_SCHEMA),
        themeHome = getViewsHome(req.app),
        fileUtil = that.FileUtil;

    var file = req.files.files[0],
        postParams = that.getPluginHelper().getPostParams(req),
        themeId = postParams.themeId,
        folderName = postParams.folderName,
        fileName = file.name, tmpPath = file.path;

    Debug._li("", file, true);
    Debug._li("post", req.body, true);
    if (folderName === DEFAULT_DIRS[0] || folderName === DEFAULT_DIRS[1] || folderName === DEFAULT_DIRS[3]) {
        //for css and js files and images
        dbAction.get("findByThemeId", themeId, function (err, theme) {
            if (err) {
                that.setError(req, err);
                return next(null, req, res);
            }
            if (theme) {
                var filePath = themeHome + "/" + theme.path + "/" + folderName + "/" + fileName;
                fileUtil.copyFile(tmpPath, filePath, function (err) {
                    //err ? that.setError(req, err) : that.setSuccess(req, "");
                    next(null, req, res);
                });

            }
        });
    }


//    that.setSuccess(req, "File created successfully.");
    // next(null, req, res);
}
function newFile(req, res, next) {
    var that = this, params = req.params, DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getInstance(req, THEME_SCHEMA),
        themeHome = getViewsHome(req.app), themeId = params.id,
        folderName = params.folderName, fileName = params.name,
        fileUtil = that.FileUtil;
    if (themeId && fileName && folderName) {
        dbAction.get("findByThemeId", themeId, function (err, theme) {
            if (err) {
                that.setError(req, err);
                return next(null, req, res);
            }

            var filePath = themeHome + "/" + theme.path + "/" + folderName + "/" + fileName;
            fileUtil.createFile(filePath, "", function (err) {
                if (err) {
                    that.setError(req, err);
                }
                else {
                    that.setSuccess(req, "File created successfully.");
                    require(req.app.set("appPath") + "/lib/ThemeUtil").
                        setThemeFile(folderName, utils.normalize(theme.name), fileName);
                }
                next(null, req, res);
            });
        });
    }
}

function deleteFile(req, res, next) {
    var that = this, params = req.params, DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getInstance(req, THEME_SCHEMA),
        themeHome = getViewsHome(req.app), themeId = params.id,
        folderName = params.folderName, fileName = params.name,
        fileUtil = that.FileUtil;
    if (themeId && fileName && folderName) {
        dbAction.get("findByThemeId", themeId, function (err, theme) {
            if (err) {
                that.setError(req, err);
                return next(null, req, res);
            }
            var filePath = themeHome + "/" + theme.path + "/" + folderName + "/" + fileName;
            fileUtil.removeFile(filePath, function (err) {
                if (err) {
                    that.setError(req, err);
                }
                else {
                    if (folderName === DEFAULT_DIRS[0] || folderName === DEFAULT_DIRS[1]) {
                        require(req.app.set("appPath") + "/lib/ThemeUtil").
                            removeThemeFile(folderName, utils.normalize(theme.name), fileName);
                    }
                    that.setSuccess(req, "File deleted successfully.");
                }
                next(null, req, res);
            });
        });
    }
}

function updateFile(req, res, next) {
    var that = this, params = req.params, DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getInstance(req, THEME_SCHEMA),
        themeHome = getViewsHome(req.app), themeId = params.id,
        folderName = params.folderName, fileName = params.name,
        content = decodeURI(req.query.content), fileUtil = that.FileUtil;
    if (themeId && fileName && folderName) {
        dbAction.get("findByThemeId", themeId, function (err, theme) {
            if (err) {
                that.setError(req, err);
                return next(null, req, res);
            }
            var filePath = themeHome + "/" + theme.path + "/" + folderName + "/" + fileName;
            try {
                fileUtil.writeFile(filePath, content, null, function (err) {
                    if (err) {
                        that.setError(req, err);
                    }
                    else {
                        that.setSuccess(req);
                    }
                    next(null, req, res);
                });
            }
            catch (e) {
                e.header = 404;
                that.setError(req, e);
                next(null, req, res);
            }
        });

    }

}

function getFile(req, res, next) {
    var that = this, params = req.params, DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getInstance(req, THEME_SCHEMA),
        themeHome = getViewsHome(req.app), themeId = params.id,
        folderName = params.folderName, fileName = params.name, fileUtil = that.FileUtil;
    if (themeId && fileName && folderName) {
        dbAction.get("findByThemeId", themeId, function (err, theme) {
            if (err) {
                that.setError(req, err);
                return next(null, req, res);
            }
            var filePath = themeHome + "/" + theme.path + "/" + folderName + "/" + fileName;
            try {
                fileUtil.readFile(filePath, null, function (err, data) {
                    if (err) {
                        that.setError(req, err);
                        return next(null, req, res);
                    }
                    if (data) {
                        that.setSend(req, data);
                        return next(null, req, res);
                    }
                });
            }
            catch (e) {
                e.header = 404;
                that.setError(req, e);
                return next(null, req, res);
            }

        });
    }
}

function openTheme(req, res, next) {
    var that = this, params = req.params, DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getInstance(req, THEME_SCHEMA),
        themeHome = getViewsHome(req.app), themeId = params.id,
        fileUtil = that.FileUtil;
    if (themeId) {
        dbAction.get("findByThemeId", themeId, function (err, theme) {
            if (!err && theme) {
                try {
                    var themePath = themeHome + "/" + theme.path;
                    var dirFiles = {};
                    DEFAULT_DIRS.forEach(function (dirName) {
                        dirFiles[dirName] = fileUtil.readDir(themePath + "/" + dirName);
                    });
                    that.setSuccess(req, "Theme " + theme.name + " opened for edit.",
                        {id: themeId, name: theme.name, files: dirFiles});
                    next(null, req, res);
                }
                catch (e) {
                    that.setError(req, e);
                    return next(null, req, res);
                }
            }
            if (err) {
                that.setError(req, err);
                next(null, req, res);
            }
        });
    }

}

/**
 * Setup watcher for newly created theme for changes
 * @param app
 * @param dbAction
 * @param name
 */
function setupWatcher(app, dbAction, name) {
    dbAction.get("findByName", name, function (err, theme) {
        if (!err && theme) {
            require(app.set("appPath") + "/lib/static/ThemesWatcher").cacheAndWatchTheme(app, theme);
        }
    });
}

function createTheme(req, res, next) {
    var that = this, params = req.params, DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getInstance(req, THEME_SCHEMA),
        app = req.app,
        themeHome = getThemeHome(app),
        name = params.name;

    if (name) {
        var folder = utils.normalize(name), path = "themes/" + folder,
            defaultThemePath = getDefaultThemePath(app),
            newThemePath = themeHome + "/" + folder;
        dbAction.get("findByName", name, function (err, theme) {
            if (err) {
                that.setError(req, err);
                return next(null, req, res);
            }
            if (theme) {
                that.setError(req, new Error("Theme already exists"));
                next(null, req, res);
            }
            else {
                //copy default theme to new theme
                that.FileUtil.copyDir(defaultThemePath, newThemePath, function (err) {
                    if (err) {
                        that.setError(req, err);
                        return next(null, req, res);
                    }
                    dbAction.save({name: name, path: path}, function (err, result) {
                        if (!err && result) {
                            setupWatcher(app, dbAction, name);
                            that.setSuccess(req, "Theme created successfully.");
                        }
                        if (err) {
                            that.setError(req, err);
                        }
                        return next(null, req, res);

                    });
                });
            }
        });


    }
    else {
        that.setError(req, new Error("Theme name is invalid"));
        next(null, req, res);
    }
}


ThemeBuilderPluginController.prototype.render = function (req, res, next) {
    var view = req.params.action;
    view = view || "index";
    var DBActions = this.getDBActionsLib(),
        dbAction = DBActions.getInstance(req, THEME_SCHEMA);
    dbAction.get("getAllExceptDefault", null, function (err, themes) {
        var ret = {
            themes: [],
            isDisabled: true
        };
        if (!err) {
            if (themes.length > 0) {
                ret.themes = themes;
                ret.isDisabled = false;
            }
            next(null, [ view, ret ]);
        }
        else {
            next(err);
        }
    });
};

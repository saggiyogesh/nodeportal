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
    return utils.getViewsPath();
}

function getThemeHome(app) {
    return utils.getThemesDirPath();
}

function getDefaultThemePath(app) {
    return getViewsHome(app) + "/shell/theme/default";
}

function uploadThemeFile(req, res, next) {
    var that = this, params = req.params,
        themeHome = getViewsHome(req.app),
        fileUtil = that.FileUtil;

    var file = req.attrs.file,
        postParams = that.getPluginHelper().getPostParams(req),
        themeId = postParams.themeId,
        folderName = postParams.folderName,
        fileName = file.originalname, tmpPath = file.path;

    var ThemeService = that.getService(THEME_SCHEMA);

//    Debug._li("", file, true);
//    Debug._li("post", req.body, true);
    if (folderName === DEFAULT_DIRS[0] || folderName === DEFAULT_DIRS[1] || folderName === DEFAULT_DIRS[3]) {
        //for css and js files and images
        ThemeService.findById(themeId, function (err, theme) {
            if (err) {
                that.setError(req, err);
                return next(null);
            }
            if (theme) {
                var filePath = themeHome + "/" + theme.path + "/" + folderName + "/" + fileName;
                fileUtil.copyFile(tmpPath, filePath, function (err) {
                    //err ? that.setError(req, err) : that.setSuccess(req, "");
                    next(null);
                });
            }
        });
    }


//    that.setSuccess(req, "File created successfully.");
    // next(null, req, res);
}
function newFile(req, res, next) {
    var that = this, params = req.params, ThemeService = that.getService(THEME_SCHEMA),
        themeHome = getViewsHome(req.app), themeId = params.id,
        folderName = params.folderName, fileName = params.name,
        fileUtil = that.FileUtil;
    if (themeId && fileName && folderName) {
        ThemeService.findById(themeId, function (err, theme) {
            if (err) {
                that.setError(req, err);
                return next(null);
            }

            var filePath = themeHome + "/" + theme.path + "/" + folderName + "/" + fileName;
            fileUtil.createFile(filePath, "", function (err) {
                if (err) {
                    that.setError(req, err);
                }
                else {
                    that.setSuccess(req, "File created successfully.");
                    require(utils.getLibPath() + "/ThemeUtil").
                        setThemeFile(folderName, utils.normalize(theme.name), fileName);
                }
                next(null);
            });
        });
    }
}

function deleteFile(req, res, next) {
    var that = this, params = req.params, ThemeService = that.getService(THEME_SCHEMA),
        themeHome = getViewsHome(req.app), themeId = params.id,
        folderName = params.folderName, fileName = params.name,
        fileUtil = that.FileUtil;
    if (themeId && fileName && folderName) {
        ThemeService.findById(themeId, function (err, theme) {
            if (err) {
                that.setError(req, err);
                return next(null);
            }
            var filePath = themeHome + "/" + theme.path + "/" + folderName + "/" + fileName;
            fileUtil.removeFile(filePath, function (err) {
                if (err) {
                    that.setError(req, err);
                }
                else {
                    if (folderName === DEFAULT_DIRS[0] || folderName === DEFAULT_DIRS[1]) {
                        require(utils.getLibPath() + "/ThemeUtil").
                            removeThemeFile(folderName, utils.normalize(theme.name), fileName);
                    }
                    that.setSuccess(req, "File deleted successfully.");
                }
                next(null);
            });
        });
    }
}

function updateFile(req, res, next) {
    var that = this, params = req.params,
        themeHome = getViewsHome(req.app), themeId = params.id,
        folderName = params.folderName, fileName = params.name,
        content = decodeURI(req.query.content), fileUtil = that.FileUtil;
    if (themeId && fileName && folderName) {
        that.getService(THEME_SCHEMA).findById(themeId, function (err, theme) {
            if (err) {
                that.setError(req, err);
                return next(null);
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
                    next(null);
                });
            }
            catch (e) {
                e.header = 404;
                that.setError(req, e);
                next(null);
            }
        });

    }

}

function getFile(req, res, next) {
    var that = this, params = req.params,
        themeHome = getViewsHome(req.app), themeId = params.id,
        folderName = params.folderName, fileName = params.name, fileUtil = that.FileUtil;
    if (themeId && fileName && folderName) {
        that.getService(THEME_SCHEMA).findById(themeId, function (err, theme) {
            if (err) {
                that.setError(req, err);
                return next(null);
            }
            var filePath = themeHome + "/" + theme.path + "/" + folderName + "/" + fileName;
            try {
                fileUtil.readFile(filePath, null, function (err, data) {
                    if (err) {
                        that.setError(req, err);
                        return next(null);
                    }
                    if (data) {
                        that.setSend(req, data);
                        return next(null);
                    }
                });
            }
            catch (e) {
                e.header = 404;
                that.setError(req, e);
                return next(null);
            }

        });
    }
}

function openTheme(req, res, next) {
    var that = this, params = req.params,
        themeHome = getViewsHome(req.app), themeId = params.id,
        fileUtil = that.FileUtil;
    if (themeId) {
        that.getService(THEME_SCHEMA).findById(themeId, function (err, theme) {
            if (!err && theme) {
                try {
                    var themePath = themeHome + "/" + theme.path;
                    var dirFiles = {};
                    DEFAULT_DIRS.forEach(function (dirName) {
                        dirFiles[dirName] = fileUtil.readDir(themePath + "/" + dirName);
                    });
                    that.setSuccess(req, "Theme " + theme.name + " opened for edit.",
                        {id: themeId, name: theme.name, files: dirFiles});
                    next(null);
                }
                catch (e) {
                    that.setError(req, e);
                    return next(null);
                }
            }
            if (err) {
                that.setError(req, err);
                next(null);
            }
        });
    }

}

/**
 * Setup watcher for newly created theme for changes
 * @param app
 * @param name
 */
function setupWatcher(app, name) {
    app.getService(THEME_SCHEMA).getByName(name, function (err, theme) {
        if (!err && theme) {
            require(utils.getLibPath() + "/static/ThemesWatcher").cacheAndWatchTheme(app, theme);
        }
    });
}

function createTheme(req, res, next) {
    var that = this, params = req.params, ThemeService = that.getService(THEME_SCHEMA),
        app = req.app,
        themeHome = getThemeHome(app),
        name = params.name;

    if (name) {
        var folder = utils.normalize(name), path = "themes/" + folder,
            defaultThemePath = getDefaultThemePath(app),
            newThemePath = themeHome + "/" + folder;
        ThemeService.getByName(name, function (err, theme) {
            if (err) {
                that.setError(req, err);
                return next(null);
            }
            if (theme) {
                that.setError(req, new Error("Theme already exists"));
                next(null);
            }
            else {
                //copy default theme to new theme
                that.FileUtil.copyDir(defaultThemePath, newThemePath, function (err) {
                    if (err) {
                        that.setError(req, err);
                        return next(null);
                    }
                    ThemeService.save({name: name, path: path}, function (err, result) {
                        if (!err && result) {
                            setupWatcher(app, name);
                            that.setSuccess(req, "Theme created successfully.");
                        }
                        if (err) {
                            that.setError(req, err);
                        }
                        return next(null);

                    });
                });
            }
        });


    }
    else {
        that.setError(req, new Error("Theme name is invalid"));
        next(null);
    }
}


ThemeBuilderPluginController.prototype.render = function (req, res, next) {
    var view = req.params.action;
    view = view || "index";
    var ThemeService = this.getService(THEME_SCHEMA);
    ThemeService.getAllExceptDefault(function (err, themes) {
        var ret = {
            themes: [],
            isDisabled: true
        };
        if (!err) {
            if (themes.length > 0) {
                ret.themes = themes;
                ret.isDisabled = false;
            }
            req.pluginRender.setView(view).setLocals(ret);
            next(null);
        }
        else {
            next(err);
        }
    });
};

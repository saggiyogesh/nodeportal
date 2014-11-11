var BasePluginController = require(process.cwd() + "/lib/BasePluginController");
var DEFAULT_LAYOUT = "2-col-70-30", LAYOUT_SCHEMA = "Layout",
    DEFAULT_PLACEHOLDERS = ["col1HTMLTMPL", "col2HTMLTMPL"],
    Forms = require("./forms");
var LayoutBuilderPluginController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route: '/newLayout/:name?', action: createLayout
        });
        that.get({
            route: '/openLayout/:id?', action: openLayout
        });
        that.post({
            route: '/updateLayout',
            action: updateLayoutAction
        });

        that.addCustomValidations(Forms.customValidations);
    });

};

util.inherits(LayoutBuilderPluginController, BasePluginController);

function getViewsHome(app) {
    return utils.getViewsPath();
}

function getLayoutHome(app) {
    return utils.getLayoutsDirPath();
}

function getDefaultLayoutPath(app) {
    return getViewsHome(app) + "/shell/layout/index.jade";
}

function createLayout(req, res, next) {
    var that = this, params = req.params,
        LayoutService = that.getService(LAYOUT_SCHEMA),
        app = req.app,
        layoutHome = getLayoutHome(app),
        name = params.name;

    if (name) {
        var fileName = utils.normalize(name) , path = "layouts/" + fileName,
            defaultLayoutPath = getDefaultLayoutPath(app),
            newLayoutPath = layoutHome + "/" + fileName + ".jade";
        LayoutService.getByName(name, function (err, layout) {
            if (err) {
                that.setError(req, err);
                return next(null);
            }
            if (layout) {
                that.setError(req, new Error("Layout already exists"));
                next(null);
            }
            else {
                that.FileUtil.copyFile(defaultLayoutPath, newLayoutPath, function (err) {
                    LayoutService.save({name: name, path: path, placeHolderNames: DEFAULT_PLACEHOLDERS},
                        function (err, result) {
                            if (!err && result) {
                                that.setSuccess(req, "Layout created successfully.");
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
        that.setError(req, new Error("Layout name is invalid"));
        next(null);
    }
}

function openLayout(req, res, next) {
    var that = this, params = req.params,
        LayoutService = that.getService(LAYOUT_SCHEMA),
        app = req.app,
        layoutHome = getLayoutHome(app),
        layoutId = params.id,
        fileUtil = that.FileUtil;

    if (layoutId) {
        LayoutService.findById(layoutId, function (err, layout) {
            if (err) {
                return next(err);
            }

            else if (layout) {
                layout = layout.toObject();
                fileUtil.readFile(getViewsHome(app) + "/" + layout.path + ".jade", "utf8", function (err, data) {
                    req.query[that.getPluginId()] = utils.cloneExtend(layout,
                        {redirect: that.getRedirectPath(req), layoutName: layout.name,
                            template: data, placeholders: layout.placeHolderNames.join(",")});
                    req.attrs.layoutForm = that.getFormBuilder().DynamicForm(req, utils.clone(Forms.EditForm), "en_US", "add");

                    req.attrs.layoutName = layout.name;

                    params.action = "editLayout";

                    next(err);
                });

            }
            else {
                that.setErrorMessage("Invalid layout id.");
                next(err);
            }

        });
    }
}

function updateLayoutAction(req, res, next) {
    var that = this,
        LayoutService = that.getService(LAYOUT_SCHEMA),
        fileUtil = that.FileUtil, formObj = utils.clone(Forms.EditForm);

    that.ValidateForm(req, formObj, function (err, result) {
        if (err) {
            return next(err);
        }
        var pluginHelper = that.getPluginHelper();
        if (!result.hasErrors) {
            var postParams = pluginHelper.getPostParams(req);
            var redirect = pluginHelper.getPostParam(req, "redirect");
            LayoutService.populateModelAndUpdate(postParams,
                {placeHolderNames: pluginHelper.getPostParam(req, "placeholders").split(",")}, {},
                function (err, result) {
                    if (err) {
                        return next(err);
                    }
                    if (result) {
                        fileUtil.writeFile(getViewsHome(req.app) + "/layouts/" +
                                utils.normalize(pluginHelper.getPostParam(req, "layoutName")) + ".jade",
                            pluginHelper.getPostParam(req, "template"), "utf8",
                            function (err) {
                                that.setRedirect(req, redirect);
                                var msg = "Layout updated successfully.";
                                that.setSuccessMessage(req, msg);
                                next(err);
                            })
                    }

                });
        }
        else {
            that.setErrorMessage(req, "entered-invalid-data");
            req.attrs.layoutForm = that.getFormBuilder().DynamicForm(req, formObj, "en_US");
            req.attrs.layoutName = pluginHelper.getPostParam(req, "layoutName");
            req.params.action = "editLayout";
            next(err);
        }
    });

}

LayoutBuilderPluginController.prototype.render = function (req, res, next) {
    var that = this, view = req.params.action;
    view = view || "index";
    var LayoutService = that.getService(LAYOUT_SCHEMA);

    LayoutService.getAllExceptDefaults(function (err, layouts) {
        var ret = {
            layouts: [],
            isDisabled: true
        };
        if (!err) {
            if (layouts.length > 0) {
                ret.layouts = layouts;
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
var PluginInstanceHandler = require("../PluginInstanceHandler"),
    PermissionValidator = require("../permissions/PermissionValidator"),
    ViewHelper = require("../ViewHelper"),
    Plugins = require("../plugins"),
    PluginHelper = require("../PluginHelper"),
    PluginRender = require("./PluginRender"),
    ThemeUtil = require("../ThemeUtil"),
    BottomIncludes = require("./BottomIncludes"),
    PermissionError = require("../permissions/PermissionError"),
    FileUtil = require("../file/FileUtil"),
    getMsg = require("../i18n").get,
    getProp = require("../AppProperties").get;

var PAGE_SCHEMA = "Page", LAYOUT_SCHEMA = "Layout", THEME_SCHEMA = "Theme",
    PLUGIN_INSTANCE_SCHEMA = "PluginInstance",
    PAGE_PERMISSION_SCHEMA = "model.pageSchema.Page",
    PLUGIN_PERMISSION_SCHEMA = PluginInstanceHandler.permissionSchemaKey,
    LAYOUT_ONE_COLUMN_NAME = "1-col", LOGIN_PLUGIN_ID = "login",
    VIEW_ACTION = "VIEW", ADD_PLUGIN = "ADD_PLUGIN", UPDATE = "UPDATE";

function InvalidNamespaceError(namespace) {
    Error.captureStackTrace(this);
    this.message = "Invalid namespace: " + namespace;
    this.name = "InvalidNamespaceError"
}
InvalidNamespaceError.prototype = Object.create(Error.prototype);

/**
 * Constructor to create PageRenderer to render page for current request
 * @param req
 * @param res
 * @constructor
 */
function PageRenderer(req, res) {
    var page = req.attrs.page, getService = req.app.getService;
    Object.defineProperties(this, {
        req: {
            value: req
        },
        res: {
            value: res
        },
        page: {
            value: page
        },
        getService: {
            value: getService
        },
        themeService: {
            value: getService(THEME_SCHEMA)
        },
        layoutService: {
            value: getService(LAYOUT_SCHEMA)
        },
        pageService: {
            value: getService(PAGE_SCHEMA)
        },
        pluginInstanceService: {
            value: getService(PLUGIN_INSTANCE_SCHEMA)
        },
        pagePermissionValidator: {
            value: new PermissionValidator(req, PAGE_PERMISSION_SCHEMA, PAGE_SCHEMA)
        },
        pluginPermissionValidator: {
            value: new PermissionValidator(req, PLUGIN_PERMISSION_SCHEMA, PLUGIN_INSTANCE_SCHEMA)
        },
        isExclusive: {
            value: req.query && req.query.mode === "exclusive"
        }
    });
}

/**
 * Inits the PageRenderer
 * @param layoutArgs {Object} keys are:
 *                      methodName: {String} name of layout service method
 *                      args: {Array} Arguments that to be passed to the layout service method
 * @param next
 */
PageRenderer.prototype._init = function (layoutArgs, next) {
    var that = this, page = that.page;
    async.parallel([
        function (n) {
            that.themeService.findById(page.themeId, n);
        },
        function (n) {
            // get layout works for both byId & byName
            var args = layoutArgs.args;
            args.push(n);
            that.layoutService[layoutArgs.methodName].apply(that.layoutService, args);
        }
    ], function (err, result) {
        if (!err) {
            Object.defineProperties(that, {
                theme: {
                    get: function () {
                        return result[0]
                    }
                },
                layout: {
                    get: function () {
                        return result[1]
                    }
                }
            });
        }
        next(err);
    });
};

/**
 * Returns look alike object in place of plugin instance model
 * @param ns {String} Namespace of plugin
 * @param [skipTool] {Boolean} if true, then rendering of tools is skipped
 * @returns Object
 */
PageRenderer.prototype._getBasicPluginInstanceModel = function (ns, skipTool) {
    return {
        pluginNamespace: ns,
        title: this._getPluginDefaultTitle(ns),
        skipTool: !!skipTool
    };
};

/**
 * Returns default localized name object of plugin
 * @param ns {String} Namespace of plugin
 * @returns Object
 */
PageRenderer.prototype._getPluginDefaultTitle = function (ns) {
    var pluginId = PluginHelper.getPluginIdAndIId(ns).pluginId;
    return Plugins.get(pluginId).name;
};

/**
 * Method called by async.map to process each namespace
 * @param ns {String} Namespace of plugin
 * @param next {Function} callback
 */
PageRenderer.prototype._eachNS = function (ns, next) {
    var that = this, page = that.page, req = this.req, res = that.res, layout = that.layout,
        theme = that.theme, DEFAULT_INDEX_PAGE = getProp("DEFAULT_INDEX_PAGE");

    if (ns) {
        var pluginInstanceModel;
        async.waterfall([
            function (n) {
                that.pluginInstanceService.getByPluginNamespaceAndPageId(ns, page.pageId, n);
            },
            function (pIModel, n) {
                //check for login in maximized mode not present on index page
                //in this case plugin instance model doesn't exist
                if (!pIModel) {
                    var err, pIModel = that._getBasicPluginInstanceModel(ns, true);

                    if (page.friendlyURL == DEFAULT_INDEX_PAGE && req.query.mode == "maximized"
                        && ns == LOGIN_PLUGIN_ID) {
                        pIModel.title = Plugins.get(LOGIN_PLUGIN_ID).name;
                    }
//                    else if (ns == "error") {
//                        pIModel = {
//                            pluginNamespace: ns,
//                            title: ns
//                        };
//                    }
                    else if (ns == "managePlugin") {  //allow managePlugin to go through
//                        pIModel = {
//                            pluginNamespace: ns,
//                            title: ns
//                        };
                    }
                    else if (ns == "managePermissions") {  //allow managePermissions to go through
//                        pIModel = {
//                            pluginNamespace: ns,
//                            title: ns
//                        };
                    }
                    else if (ns == "threadComments") {  //allow threadComments to go through
                    }
                    else {
                        err = new InvalidNamespaceError(ns);
                        pIModel = null;
                    }
                    pluginInstanceModel = pIModel;
                    n(err, pIModel);
                } else {
                    //check view permission for plugin instance
                    that.pluginPermissionValidator.hasPermission(VIEW_ACTION, pIModel.pluginInstanceId, function (err, perm) {
                        pluginInstanceModel = pIModel;

                        //case when login has no VIEW permission, show login when opened by /app/login
                        // ignore permission error
                        if (page.friendlyURL == DEFAULT_INDEX_PAGE && req.query.mode == "maximized"
                            && ns == LOGIN_PLUGIN_ID && perm && perm.isAuthorized == false) {
                            err = null;
                        }
                        n(err, err ? null : pIModel)
                    });
                }
            }
        ], function (err) {
            var pluginRender = new PluginRender(pluginInstanceModel, that);
            pluginRender.render(err, next);
        });
    }
    else {
        next(new InvalidNamespaceError(ns))
    }
};

/**
 * Method to render page bottom scripts & html
 * @param next {Function} Callback parameters are err & page bottom html
 */
PageRenderer.prototype.renderBottomIncludes = function (next) {
    var bottomIncludes = new BottomIncludes(this);
    bottomIncludes.render(next);
};

/**
 * Internal method to render the page html
 * @param next {Function} callback either have err or final page html
 */
PageRenderer.prototype._render = function (next) {
    var that = this, req = that.req, page = that.page, res = that.res, layout = that.layout,
        theme = that.theme, settingsURL = utils.getAppSettingsURL(req),
        isSettingsURL = that.isSettingsPage();
    //select namespaces present in layout placeholders
    var namespaces = _.flatten(_.values(_.pick(page.data, layout.placeHolderNames)));


    async.map(namespaces, that._eachNS.bind(that), function (err, pluginContents) {
        if (err) {
            next(err);
        }
        else {
            Debug._li("> ", pluginContents, true);
            var pluginContentObj = {};
            pluginContents.forEach(function (arr) {
                pluginContentObj[arr[0]] = arr[1];
            });

            var options = {
                theme: ThemeUtil.getThemeRealPath(theme.path) + "/tmpl/index",
                themeOptions: {
                    locale: "en_US",
                    pageTitle: page.localizedName["en_US"],
                    description: page.description,
                    keywords: page.keywords,
                    req: req
                }
            };

            var layoutOptions = {};
            layout.placeHolderNames.forEach(function (n) {
                var s = [], i = 0;
                page.data[n].forEach(function (ns) {
                    s.push(pluginContentObj[ns]);
                });
                layoutOptions[n] = s.join("");
            });

            async.waterfall([
                function (n) {
                    if (!isSettingsURL) {
                        that.pagePermissionValidator.hasPermission(ADD_PLUGIN, page.pageId, function (err, perm) {
                            err && (err instanceof PermissionError) && (err = null);
                            n(err, perm.isAuthorized);
                        });
                    }
                    else {
                        n(null, false);
                    }
                },
                function (canAddPlugin, n) {
                    var dockbarOpts = {
                        canAddPlugin: canAddPlugin,
                        settingsURL: settingsURL,
                        req: req
                    };
                    //TODO on err page, hide dockbar
                    ThemeUtil.dockbar(dockbarOpts, n);
                },
                function (dockbar, n) {
                    options.themeOptions.dockbar = dockbar;

                    //render layout
                    ViewHelper.render({
                            path: utils.getViewsPath() + "/" + layout.path,
                            cache: true},
                        layoutOptions, n);
                } ,
                function (layout, n) {
                    options.themeOptions.layoutHTMLTMPL = layout;
                    that.renderBottomIncludes(n);
                },
                function (pageBottom, n) {
                    options.themeOptions.bottomIncludes = pageBottom;

                    that.getTopMenu(n);
                },
                function (pages, n) {
                    options.themeOptions.pages = pages;
                    that.themeLocals(options, n);
                },
                function (n) {
                    ViewHelper.render({path: options.theme}, options.themeOptions, n);
                }
            ], next);
        }
    });
};

/**
 * Method returns page models for top menu
 * @param next {Function} callback either have err or page models to be shown on top menu
 */
PageRenderer.prototype.getTopMenu = function (next) {
    var that = this, query = {
        where: {
            parentPageId: 0,
            isHidden: false
        }
    };
    that.pageService.Auth.find(query, that.req.session.roles, next);
};

/**
 * Renders locals for theme's jade tmpl.
 * @param options {Object} Object will be served to theme jade as locals
 * @param next
 */
PageRenderer.prototype.themeLocals = function (options, next) {
    var that = this, theme = that.theme;
    var themeNormalizedName = utils.normalize(theme.name);
    options.themeOptions.themeCSS = ThemeUtil.themeCSS(themeNormalizedName);
    options.themeOptions.themeJS = ThemeUtil.themeJS(themeNormalizedName);
    next();
};

/**
 * Method to check if current page is settings page
 * @returns {Boolean}
 */
PageRenderer.prototype.isSettingsPage = function () {
    var page = this.page;
    return page.friendlyURL === utils.getAppSettingsURL(this.req);
};

/**
 * Render the current page in default mode with configured theme & layout
 * @param next {Function} callback have err and passed to express
 */
PageRenderer.prototype.render = function (next) {
    var that = this, req = that.req, page = that.page, res = that.res;

    async.waterfall([
        function (n) {
            that._init({methodName: "findById", args: [ page.layoutId]}, n);
        },
        function (n) {
            that._render(n);
        }
    ], next);

};

/**
 * Render the current page in maximized mode with configured theme
 * @param next {Function} callback have err and passed to express
 */
PageRenderer.prototype.renderMaximized = function (next) {
    var that = this, req = that.req, page = that.page, res = that.res;
    var namespace = req.params.namespace;


    var pageData = {
        "col1HTMLTMPL": [ namespace ]
    };

    page.data = pageData;
    async.waterfall([
        function (n) {
            if (!namespace) {
                n(new InvalidNamespaceError(namespace));
            }
            else {
                n();
            }
        },
        function (n) {
            that._init({methodName: "getByName", args: [LAYOUT_ONE_COLUMN_NAME]}, n);
        },
        function (n) {
            that._render(n);
        }
    ], next);
};

/**
 * Render the current page in exclusive mode. Only plugin's html will be rendered
 * @param next {Function} callback have err and passed to express
 */
PageRenderer.prototype.renderExclusive = function (next) {
    var that = this, req = that.req, res = that.res, html = [],
        namespace = req.params.namespace;
    async.waterfall([
        function (n) {
            that._eachNS(namespace, n)
        },
        function (arr, n) {
            html.push(arr[1]);
            req.attrs.PageScript.render(n)
        }
    ], function (err, pageScript) {
        if (!err) {
            html.push(pageScript);
        }
        next(err, !err && html.join(""));
    });
};

PageRenderer.prototype.LAYOUT_ONE_COLUMN_NAME = LAYOUT_ONE_COLUMN_NAME;
PageRenderer.prototype.InvalidNamespaceError = InvalidNamespaceError;

module.exports = PageRenderer;
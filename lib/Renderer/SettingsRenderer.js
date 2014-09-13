var PageRenderer = require("./PageRenderer"),
    Plugins = require("../plugins"),
    PermissionValidator = require("../permissions/PermissionValidator"),
    PermissionError = require("../permissions/PermissionError"),
    PluginRender = require("./PluginRender"),
    ThemeUtil = require("../ThemeUtil");

/**
 * Constructor to create Settings Renderer. This will render settings page
 * Settings Renderer will inherit Page Renderer
 * @param req
 * @param res
 * @constructor
 */
function SettingsRenderer(req, res) {
    PageRenderer.call(this, req, res);
}

util.inherits(SettingsRenderer, PageRenderer);

SettingsRenderer.prototype._eachNS = function (ns, next) {
    var that = this, page = that.page, req = this.req;
    if (ns) {
        async.series([
            function (n) {
                n(utils.containsArray(Object.keys(Plugins.getSettingsPlugins()), ns) ?
                    "" : new that.InvalidNamespaceError(ns));

            },
            function (n) {
                that.hasPermission(ns, "VIEW", n);
            }
        ], function (err, result) {
            if (err) {
                Debug._l(err);
                next(err);
            }
            else {
                var showSettingIcon = false;
                var pluginRender = new PluginRender(that._getBasicPluginInstanceModel(ns), that);

                //override _tools() method of plugin renderer for settings renderer
                pluginRender._tools = function (pluginInstance, cb) {
                    async.waterfall([
                        function (n) {
                            that.hasPermission(ns, "SETTINGS", function (err, hasPerm) {
                                hasPerm && (showSettingIcon = hasPerm);
                                if (err instanceof PermissionError) {
                                    err = null;
                                }
                                n(err);
                            });
                        },
                        function (n) {
                            ThemeUtil.pluginTools({
                                id: ns,
                                showTools: showSettingIcon,
                                showSettingIcon: showSettingIcon,
                                showCloseIcon: false
                            }, n)
                        }
                    ], function (err, result) {
                        if (!err) {
                            req.attrs.showTools = showSettingIcon;

                        }
                        cb(err, result);
                    });
                };
                pluginRender.render(err, next);
            }
        });
    }
    else {
        next(new that.InvalidNamespaceError(ns))
    }
};

/**
 * Checks permission of plugin for action
 * @param pluginId {String} plugin id
 * @param action {String} action
 * @param next {Function} callback have err & permission flag
 */
SettingsRenderer.prototype.hasPermission = function (pluginId, action, next) {
    var that = this, req = that.req;
    var permissionSchemaKey = utils.getSettingsPluginPermissionSchemaKey(pluginId);
    var pv = new PermissionValidator(req, permissionSchemaKey, "");
    pv.hasPermissionWithoutModelId(action, function (err, p) {
        if (p && p.hasOwnProperty("isAuthorized") && p.isAuthorized === true) {
            err = null;
            p = true;
        } else {
            p = false;
        }
        next(err, p);
    });
};

SettingsRenderer.prototype.themeLocals = function (options, next) {
    var that = this, req = that.req, plugins = [],
        _eachFn = function (pluginId, n) {
            var plugin = Plugins.getSettingsPlugins()[pluginId];
            if (_.isBoolean(plugin.props.visible) && plugin.props.visible === false) {
                n();
            } else {
                that.hasPermission(pluginId, "VIEW", function (err, perm) {
                    if (!err && perm) {
                        plugins.push(Plugins.get(pluginId));
                    }
                    if (err instanceof PermissionError) {
                        err = null;
                    }
                    n(err);
                });
            }
        };
    async.each(Object.keys(Plugins.getSettingsPlugins()), _eachFn, function (err) {
        if (!err) {
            options.themeOptions.plugins = plugins;
            options.themeOptions.getURL = function (req, pluginId) {

                return utils.getAppSettingsURL(req) + "/" + pluginId;
            };
            PageRenderer.prototype.themeLocals.call(that, options, next);
        }
        else {
            next(err);
        }

    });
};

SettingsRenderer.prototype.getTopMenu = function (next) {
    next(null, []);
};

/**
 * Renders the settings pages
 * @param next {Function} callback have err and passed to express
 */
SettingsRenderer.prototype.render = function (next) {

    var that = this, req = that.req, page = that.page, res = that.res;
    var plugin = req.params.plugin , arr = [];
    if (plugin) {
        arr.push(plugin);
    }

    var pageData = {
        "col1HTMLTMPL": arr
    };

    page.data = pageData;
    async.waterfall([
        function (n) {
            that._init(["findByName", that.LAYOUT_ONE_COLUMN_NAME], n);
        },
        function (n) {
            that._render(n);
        }
    ], next);
};


module.exports = SettingsRenderer;



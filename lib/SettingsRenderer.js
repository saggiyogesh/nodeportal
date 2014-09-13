var Helpers = require("./Helpers"), getMsg = require("./i18n").get, plugins = require("./plugins"),
    getProp = require("./AppProperties").get,
    viewParser = require("./view"), PageScript = require("./PageScript"),
//    PageRenderer = require("./PageRenderer"),
    PluginHelper = require("./PluginHelper"),
    path = require("path"),
    ThemeUtil = require("./ThemeUtil"),
    PermissionValidator = require("./permissions/PermissionValidator"),
    ResponseHelper = require("./ResponseHelper");

function parsePage(settings) {
    var index = settings._settingsHome + "/index",
        options = {};
    viewParser.parseView(settings._app, index, options);
}

function filterSettingsPluginsByRole(req) {
    var settingsPlugins = plugins.getSettingsPlugins();
    var filterPlugin = [];
    _.each(settingsPlugins, function (plugin, pluginId) {
        var permissionSchemaKey = utils.getSettingsPluginPermissionSchemaKey(pluginId);
        var pv = new PermissionValidator(req, permissionSchemaKey, "");
        var perm = pv.hasPermission("VIEW");
        if (perm && perm.isAuthorized) {
            filterPlugin.push(plugin);
        }
    });
    return filterPlugin;
}

function Settings(req, res) {
    this._req = req;
    this._res = res;
    this._app = req.app;
    this._db = this._app.get('db');
    this._settingsHome = utils.getViewsPath() + "/shell/app/settings"
}
Settings.prototype.setErrorMessage = function (key) {
    this._errMsg = getMsg({key: key});
};

Settings.prototype.render = function () {
    var req = this._req, res = this._res, app = req.app, that = this,
        permissionPlugin = "managePermissions";

    var tpl = "",
        render = function () {
            res.render(that._settingsHome + "/index", {
                req: req,
                res: res,
                layoutHTMLTMPL: tpl,
                dockbar: ThemeUtil.dockbar(req),
                bottomIncludes: viewParser.parseView(app, utils.getViewsPath() + '/shell/app/page_bottom', {
                    PermissionValidator: PermissionValidator,
                    getPluginIdAndIId: PluginHelper.getPluginIdAndIId,
                    getUserProfilePicURL: utils.getUserProfilePicURL,
                    getDefaultProfilePicURL: utils.getDefaultProfilePicURL,
                    page: req.attrs.page,
                    user: req.session.user,
                    req: req,
                    props: {
                        appURL: getProp("APP_URL")
                    }
                }) + PageScript.render()
            });
        },
        renderError = function (err) {
            tpl = viewParser.parseView(app, that._settingsHome + "/error", {errorMsg: err});
            render();
        },
        renderMain = function (opts) {
            tpl = viewParser.parseView(app, that._settingsHome + "/main", opts);
            render();
        };
    if (that._errMsg) {
        renderError(that._errMsg);
    } else {
        var settingPlugins = filterSettingsPluginsByRole(req) , pluginId = req.params.plugin;

        var opts = { req: req,
            plugins: settingPlugins,
            getURL: getURL,
            pluginHtml: "",
            tools: "",
            showTools: false
        };

        if (pluginId) {
            if (pluginId == permissionPlugin) {
                PageRenderer.renderPlugin(req, res, function (err, html) {
                    if (err) {
                        return renderError(err);
                    }
                    opts.pluginHtml = html;
                    renderMain(opts);
                });
            } else {
                var permissionSchemaKey = utils.getSettingsPluginPermissionSchemaKey(pluginId);
                var pv = new PermissionValidator(req, permissionSchemaKey, "");
                var perm = pv.hasPermission("VIEW");
                if (perm && perm.isAuthorized) {
                    PageRenderer.renderPlugin(req, res, function (err, html) {
                        if (err) {
                            return renderError(err);
                        }
                        opts.pluginHtml = html;
                        var showSettingIcon = false;
                        var perm = pv.hasPermission("SETTINGS");
                        if (perm && perm.isAuthorized) {
                            showSettingIcon = true;
                        }
                        opts.tools = ThemeUtil.pluginTools(req, {
                            id: pluginId,
                            showTools: showSettingIcon,
                            showSettingIcon: showSettingIcon,
                            showCloseIcon: false});
                        opts.showTools = showSettingIcon;
                        renderMain(opts);
                    });
                }
                else {
                    ResponseHelper.set404StatusCode(res);
                    renderError("Permission Error")
                }
            }
        }
        else {
            renderMain(opts);
        }
    }
};


exports.getInstance = function (req, res) {
    return new Settings(req, res);
};

function getURL(req, pluginId) {
    var url = [req.params.page, pluginId];

    return "/" + url.join("/");
}

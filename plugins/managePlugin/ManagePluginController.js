var BasePluginController = require(process.cwd() + "/lib/BasePluginController"),
    plugins = require(process.cwd() + "/lib/plugins"),
    PluginInstanceHandler = require(process.cwd() + "/lib/PluginInstanceHandler"),
    PageRenderer = require(process.cwd() + "/lib/PageRenderer"),
    PLUGIN_INSTANCE_SCHEMA = "PluginInstance",
    URLCreator = require(process.cwd() + "/lib/URLCreator"),
    Permissions = require(process.cwd() + "/lib/permissions/Permissions");

var ManagePluginController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route:'/show/:pluginNS?/:pageId', action:editPlugin
        });
        that.post({
            route:'/updatePluginTitle', action:updatePluginTitle
        });
        that.post({
            route:'/updatePluginSettings', action:updatePluginSettings
        });
    });
};

util.inherits(ManagePluginController, BasePluginController);

function updatePluginTitle(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        ns = params.pluginNS, pageId = params.pageId;

    var body = req.body;

    PluginInstanceHandler.updateTitle(req, {en_US:body["title.en_US"]}, body.pageId, body.ns, function (err, result) {
        var json = {};
        that.setJSON(req, json);
        if (err) {
            json.err = err.message;
        }
        if (result) {
            json.status = "success";
            json.title = {
                en_US:body["title.en_US"]
            }
        }
        next(err, req, res);
    });
}

function updatePluginSettings(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        body = req.body, ns = body.ns, pageId = body.pageId;
    var dbAction = DBActionsLib.getInstance(req, PLUGIN_INSTANCE_SCHEMA),
        plugin = plugins.get(ns.split("_")[0]),
        pluginId = plugin.id,
        exec = plugin.exec, settingsFn = exec.settings;

    PluginInstanceHandler.getPluginInstance(dbAction, pageId, ns, function (err, instance) {
        var json = {};
        that.setJSON(req, json);
        json.status = "failure";
        if (err || !instance) {
            json.err = err ? err.message : "Invalid plugin instance.";
            return next(err, req, res);
        }
        if (instance) {
            var save = function (err, pluginSettings) {
                if (err) {
                    json.err = err.message;
                    next(err, req, res);
                }
                else if (_.isObject(pluginSettings) && Object.keys(pluginSettings).length > 0) {
                    PluginInstanceHandler.updateSettings_1(dbAction, instance, pluginSettings, function (err, result) {
                        if (result) {
                            json.status = "success";
                        }
                        if (err) {
                            json.err = err.message;
                        }
                        next(err, req, res);
                    });
                }
                else {
                    json.status = "success";
                    next(err, req, res);
                }
            };

            if (settingsFn && _.isFunction(settingsFn)) {
                Debug._l("settings save");

                var obj = {
                    pluginSettings:instance.settings || {},
                    post:body
                };
                settingsFn(obj, save);

            }
        }
    });
}

function editPlugin(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        ns = params.pluginNS, pageId = params.pageId;
    var dbAction = DBActionsLib.getInstance(req, PLUGIN_INSTANCE_SCHEMA),
        plugin = plugins.get(ns.split("_")[0]),
        pluginId = plugin.id,
        exec = plugin.exec, settingsFn = exec.settings;
    PluginInstanceHandler.getPluginInstance(dbAction, pageId, ns, function (err, instance) {
        if (err || !instance) {
            return next(err, req, res);
        }
        if (instance) {
            var instanceId = instance.pluginInstanceId.toString(), managePlugin = {
                title:instance.title,
                ns:ns,
                pageId:pageId,
                instanceId:instanceId,
                showEditPermission:dbAction.hasPermissionSync(instanceId, Permissions.ActionKeys.PERMISSION).isAuthorized
            };
            req.attrs.managePlugin = managePlugin;

            if (settingsFn && _.isFunction(settingsFn)) {
                var obj = {
                    pluginSettings:instance.settings || {}

                };
                var url = URLCreator.createExclusiveURLFromRequest(that.getPluginHelper().cloneRequest(req)).setAction("updatePluginSettings");
                settingsFn(obj, function (err, config) {
                    var viewPath = req.app.set('appPath') + "/plugins/" + pluginId + "/views/"
                        + config.jade , view = PageRenderer.viewParser(req, viewPath, {
                        settings:obj.pluginSettings,
                        settingsURL:url,
                        viewOptions:config.viewOptions
                    });
                    managePlugin["pluginSettingsView"] = view;
                    next(err, req, res);
                });
            }
            else {
                next(err, req, res);
            }
        }
    });
}
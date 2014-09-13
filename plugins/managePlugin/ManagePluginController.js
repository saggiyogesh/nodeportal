var BasePluginController = require(process.cwd() + "/lib/BasePluginController"),
    plugins = require(process.cwd() + "/lib/plugins"),
    PluginInstanceHandler = require(process.cwd() + "/lib/PluginInstanceHandler"),
    PLUGIN_INSTANCE_SCHEMA = "PluginInstance",
    URLCreator = require(process.cwd() + "/lib/URLCreator");

var ManagePluginController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route: '/show/:pluginNS?/:pageId', action: editPlugin
        });
        that.get({
            route: '/settings/:pluginId', action: editSettingsPlugin
        });
        that.post({
            route: '/updatePluginTitle', action: updatePluginTitle
        });
        that.post({
            route: '/updatePluginSettings', action: updatePluginSettings
        });
    });
};

util.inherits(ManagePluginController, BasePluginController);

function updatePluginTitle(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        ns = params.pluginNS, pageId = params.pageId;

    var body = req.body;

    PluginInstanceHandler.updateTitle(req, {en_US: body["title.en_US"]}, body.pageId, body.ns, function (err, result) {
        var json = {};
        that.setJSON(req, json);
        if (err) {
            json.err = err.message;
        }
        if (result) {
            json.status = "success";
            json.title = {
                en_US: body["title.en_US"]
            }
        }
        next(err);
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
            return next(err);
        }
        if (instance) {
            var save = function (err, pluginSettings) {
                if (err) {
                    json.err = err.message;
                    next(err);
                }
                else if (_.isObject(pluginSettings) && Object.keys(pluginSettings).length > 0) {
                    PluginInstanceHandler.updateSettings_1(req, instance, pluginSettings, function (err, result) {
                        if (result) {
                            json.status = "success";
                        }
                        if (err) {
                            json.err = err.message;
                        }
                        next(err);
                    });
                }
                else {
                    json.status = "success";
                    next(err);
                }
            };

            if (settingsFn && _.isFunction(settingsFn)) {
                Debug._l("settings save");

                var obj = {
                    pluginSettings: instance.settings || {},
                    post: body
                };
                settingsFn.apply(exec, [obj, save]);

            }
        }
    });
}


function editSettingsPlugin(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        pluginId = params.pluginId, pageId = params.pageId;
    var permissionSchemaKey = utils.getSettingsPluginPermissionSchemaKey(pluginId);

    var pv = new that.PermissionValidator(req, permissionSchemaKey, "");

    pv.hasPermissionWithoutModelId("PERMISSION", function (err, perm) {
        var plugin = plugins.get(pluginId), title = plugin.name.en_US;
        var managePlugin = {
            title: title,
            ns: pluginId,
            pageId: pageId || 0,
            instanceId: "",
            showEditPermission: perm && perm.isAuthorized,
            showSettingsTab: false,
            settingsPlugin: true
        };
        req.attrs.managePlugin = managePlugin;

        next(null, req, res);
    });
}

function editPlugin(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        ns = params.pluginNS, pageId = params.pageId;
    var dbAction = DBActionsLib.getAuthInstance(req, PLUGIN_INSTANCE_SCHEMA, PluginInstanceHandler.permissionSchemaKey),
        plugin = plugins.get(ns.split("_")[0]),
        pluginId = plugin.id,
        exec = plugin.exec, settingsFn = exec.settings;
    PluginInstanceHandler.getPluginInstance(dbAction, pageId, ns, function (err, instance) {
        if (err || !instance) {
            return next(err);
        }
        if (instance) {
            var instanceId = instance.pluginInstanceId.toString();

            dbAction.hasPermission("PERMISSION", instanceId, function (err, perm) {
                var managePlugin = {
                    title: instance.title,
                    ns: ns,
                    pageId: pageId,
                    instanceId: instanceId,
                    showEditPermission: perm.isAuthorized,
                    showSettingsTab: true
                };
                req.attrs.managePlugin = managePlugin;

                if (settingsFn && _.isFunction(settingsFn)) {
                    var obj = {
                        pluginSettings: instance.settings || {}

                    };
                    var url = URLCreator.createExclusiveURLFromRequest(that.getPluginHelper()
                        .cloneRequest(req, that.getPluginId())).setAction("updatePluginSettings");
                    settingsFn(obj, function (err, config) {
                        var viewPath = utils.realPath(utils.getPluginsPath(), pluginId, "views", config.jade),
                            opts = {
                                settings: obj.pluginSettings,
                                settingsURL: url,
                                viewOptions: config.viewOptions,
                                namespace: ns
                            };
                        if (config.settingsForm) {
                            var fm = config.settingsForm;
                            fm.form.action = url;
                            fm = that.getFormBuilder().SettingsDynamicForm(req.app, ns, fm, "en_US", obj.pluginSettings, "add",
                                req.attrs.PageScript);
                            opts.settingsForm = fm;
                        }

                        that.FileUtil.renderJadeTemplate(viewPath, opts, function (err, view) {
                            !err && (managePlugin["pluginSettingsView"] = view);
                            next(err);
                        });
                    });
                }
                else {
                    next(err);
                }
            });
        }
    });
}
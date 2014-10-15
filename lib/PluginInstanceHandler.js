var PLUGIN_INSTANCE_SCHEMA = "PluginInstance",
    PAGE_SCHEMA = "Page",
    PAGE_PERMISSION_SCHEMA_ENTRY = "model.pageSchema.Page",
    PermissionValidator = require('./permissions/PermissionValidator'),
    PermissionCache = require('./permissions/Cache');

var Permissions = exports.Permissions = {
    actionsValue: {
        "VIEW": 1,
//        "ADD": 2,
//        "DELETE": 4,
        "SETTINGS": 2,
        "PERMISSION": 4
    },
    rolePermissions: {
        Administrator: [1, 2, 4],
        User: [1],
        Guest: [1]
    }
};

exports.permissionSchemaKey = "model.pluginInstanceSchema";

exports.addInstance = function (req, pluginNS, pageId, title, next) {
    var PluginInstanceService = req.app.getService(PLUGIN_INSTANCE_SCHEMA);
    var cacheItem = PermissionCache.getCacheItem(exports.permissionSchemaKey);
    var user = req.session.user,
        obj = {
            pluginNamespace: pluginNS,
            pageId: pageId,
            title: title,
            settings: {},
            rolePermissions: cacheItem.getPermissions(),
            userId: user.userId,
            userName: user.userName
        };

    var pv = new PermissionValidator(req, PAGE_PERMISSION_SCHEMA_ENTRY, PAGE_SCHEMA);
    pv.hasPermission("ADD_PLUGIN", pageId, function (err, perm) {
        if (!err && perm && perm.isAuthorized) {
            PluginInstanceService.save(obj, next);
        }
        else if (err) {
            next(err);
        }
    });
};

exports.deleteInstance = function (req, pluginNS, pageId, next) {
    var PluginInstanceService = req.app.getService(PLUGIN_INSTANCE_SCHEMA);
    var pv = new PermissionValidator(req, PAGE_PERMISSION_SCHEMA_ENTRY, PAGE_SCHEMA);
    pv.hasPermission("REMOVE_PLUGIN", pageId, function (err, perm) {
        if (!err && perm && perm.isAuthorized) {
            getPluginInstance(PluginInstanceService, pageId, pluginNS, function (err, plugin) {
                if (plugin) {
                    PluginInstanceService.remove(plugin.pluginInstanceId, next)
                } else if (err) {
                    next(err);
                }
            });
        } else if (err) {
            next(err);
        }
    });
};

var getPluginInstance = exports.getPluginInstance = function (PluginInstanceService, pageId, ns, next) {
    PluginInstanceService.getByPluginNamespaceAndPageId(ns, pageId, next);
};

exports.getPluginSettings = function (req, pageId, ns, next) {
    var PluginInstanceService = req.app.getService(PLUGIN_INSTANCE_SCHEMA);
    getPluginInstance(PluginInstanceService, pageId, ns, function (err, model) {
        var settings;
        if (model) {
            settings = model.settings;
        }
        next(err, settings);
    });
};


function checkSettingsPermission(pv, id, next) {
    pv.hasPermission("SETTINGS", id, next);
}

exports.updateSettings = function (req, settings, pageId, ns, next) {
    var PluginInstanceService = req.app.getService(PLUGIN_INSTANCE_SCHEMA);
    var pv = new PermissionValidator(req, exports.permissionSchemaKey, PLUGIN_INSTANCE_SCHEMA);
    getPluginInstance(PluginInstanceService, pageId, ns, function (err, model) {
        if (err) {
            return next(err);
        }
        var id = model.pluginInstanceId;
        checkSettingsPermission(pv, id, function (err, perm) {
            if (err) {
                next(err)
            }
            else if (perm.isAuthorized) {
                PluginInstanceService.update({
                    pluginInstanceId: id,
                    settings: settings
                }, next);

            }
        });
    });
};

exports.updateSettings_1 = function (req, pluginInstance, settings, next) {
    var PluginInstanceService = req.app.getService(PLUGIN_INSTANCE_SCHEMA);
    var pv = new PermissionValidator(req, exports.permissionSchemaKey, PLUGIN_INSTANCE_SCHEMA);
    var id = pluginInstance.pluginInstanceId;
    checkSettingsPermission(pv, id, function (err, isAuth) {
        if (err) {
            next(err)
        }
        else if (isAuth) {
            PluginInstanceService.update({
                pluginInstanceId: id,
                settings: settings
            }, next);
        }
    });
};

exports.updateTitle = function (req, title, pageId, ns, next) {
    var PluginInstanceService = req.app.getService(PLUGIN_INSTANCE_SCHEMA);
    var pv = new PermissionValidator(req, exports.permissionSchemaKey, PLUGIN_INSTANCE_SCHEMA);
    getPluginInstance(PluginInstanceService, pageId, ns, function (err, model) {
        if (err) {
            return next(err);
        }
        var id = model.pluginInstanceId;
        checkSettingsPermission(pv, id, function (err, perm) {
            if (err) {
                next(err)
            }
            else if (perm && perm.isAuthorized) {
                PluginInstanceService.update({
                    pluginInstanceId: id,
                    title: title
                }, next);
            }
        });
    });
};
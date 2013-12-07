var DBActions = require('./DBActions'),
    PLUGIN_INSTANCE_SCHEMA = "PluginInstance",
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
    var cacheItem = PermissionCache.getCacheItem(exports.permissionSchemaKey);
    var user = req.session.user,
        obj = {
            pluginNamespace: pluginNS,
            pageId: pageId,
            title: title,
            settings: {},
            rolePermissions: cacheItem.getPermissions()
        },
        dbAction = DBActions.getAuthInstance(req, PLUGIN_INSTANCE_SCHEMA, exports.permissionSchemaKey);
    Debug._li(">> ", obj, true)
    var pv = new PermissionValidator(req, PAGE_PERMISSION_SCHEMA_ENTRY, PAGE_SCHEMA);
    pv.hasPermission("ADD_PLUGIN", pageId, function (err, perm) {
        if (!err && perm && perm.isAuthorized) {
            dbAction.save(obj, next);
        }
        else if (err) {
            next(err);
        }
    });
};

exports.deleteInstance = function (req, pluginNS, pageId, next) {
    var dbAction = DBActions.getAuthInstance(req, PLUGIN_INSTANCE_SCHEMA, exports.permissionSchemaKey);
    var pv = new PermissionValidator(req, PAGE_PERMISSION_SCHEMA_ENTRY, PAGE_SCHEMA);
    pv.hasPermission("REMOVE_PLUGIN", pageId, function (err, perm) {
        if (!err && perm && perm.isAuthorized) {
            getPluginInstance(dbAction, pageId, pluginNS, function (err, plugin) {
                if (plugin) {
                    dbAction.remove(plugin.pluginInstanceId, next)
                } else if (err) {
                    next(err);
                }
            });
        } else if (err) {
            next(err);
        }
    });
};

var getPluginInstance = exports.getPluginInstance = function (dbAction, pageId, ns, next) {
    dbAction.get("findByPluginNamespaceAndPageId", [ns, pageId], next);
};

exports.getPluginSettings = function (req, pageId, ns, next) {
    var dbAction = DBActions.getInstance(req, PLUGIN_INSTANCE_SCHEMA);
    getPluginInstance(dbAction, pageId, ns, function (err, model) {
        var settings;
        if (model) {
            settings = model.settings;
        }
        next(err, settings);
    });
};

function checkPermission(dbAction, id, actionKey, next) {
    dbAction.hasPermission(id, actionKey, next);
}


function checkSettingsPermission(dbAction, id, next) {
    dbAction.hasPermission("SETTINGS", id, next);
}

exports.updateSettings = function (req, settings, pageId, ns, next) {
    var dbAction = DBActions.getAuthInstance(req, PLUGIN_INSTANCE_SCHEMA, exports.permissionSchemaKey);
    getPluginInstance(dbAction, pageId, ns, function (err, model) {
        if (err) {
            return next(err);
        }
        var id = model.pluginInstanceId;
        checkSettingsPermission(dbAction, id, function (err, perm) {
            if (err) {
                next(err)
            }
            else if (perm.isAuthorized) {
                dbAction.update({
                    pluginInstanceId: id,
                    settings: settings
                }, next);
            }
        });
    });
};

exports.updateSettings_1 = function (req, pluginInstance, settings, next) {
    var dbAction = DBActions.getAuthInstance(req, PLUGIN_INSTANCE_SCHEMA, exports.permissionSchemaKey);
    var id = pluginInstance.pluginInstanceId;
    checkSettingsPermission(dbAction, id, function (err, isAuth) {
        if (err) {
            next(err)
        }
        else if (isAuth) {
            dbAction.update({
                pluginInstanceId: id,
                settings: settings
            }, next);
        }
    });
};

exports.updateTitle = function (req, title, pageId, ns, next) {
    var dbAction = DBActions.getAuthInstance(req, PLUGIN_INSTANCE_SCHEMA, exports.permissionSchemaKey);
    getPluginInstance(dbAction, pageId, ns, function (err, model) {
        if (err) {
            return next(err);
        }
        var id = model.pluginInstanceId;
        checkSettingsPermission(dbAction, id, function (err, perm) {
            if (err) {
                next(err)
            }
            else if (perm && perm.isAuthorized) {
                dbAction.update({
                    pluginInstanceId: id,
                    title: title
                }, next);
            }
        });
    });
};
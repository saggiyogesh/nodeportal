var DBActions = require('./DBActions'),
    PLUGIN_INSTANCE_SCHEMA = "PluginInstance";

var PluginPermissions = [ "VIEW", "ADD", "DELETE", "SETTINGS", "PERMISSION"];

var Permissions = exports.Permissions = {
    actionsValue:{
        "VIEW":1,
        "ADD":2,
        "DELETE":4,
        "SETTINGS":8,
        "PERMISSION":16
    },
    rolePermissions:{
        Administrator:[1, 2, 4, 8, 16],
        User:[1],
        Guest:[1]
    }
};

exports.addInstance = function (req, pluginNS, pageId, title, next) {
    var user = req.session.user,
        obj = {
            pluginNamespace:pluginNS,
            pageId:pageId,
            userId:user.userId,
            userName:user.userName,
            rolePermissions:Permissions.rolePermissions,
            title:title,
            settings:{}
        },
        dbAction = DBActions.getInstance(req, PLUGIN_INSTANCE_SCHEMA).setPermissions(Permissions)
            .authorizedSave(obj, next);
};

exports.deleteInstance = function (req, pluginNS, pageId, next) {
    var dbAction = DBActions.getInstance(req, PLUGIN_INSTANCE_SCHEMA).setPermissions(Permissions),
        query = dbAction.getQuery().where("pluginNamespace", pluginNS).where("pageId", pageId);
    dbAction.authorizedRemoveByQuery(query, next);
};

var getPluginInstance = exports.getPluginInstance = function (dbAction, pageId, ns, next) {
    dbAction.permissions || dbAction.setPermissions(Permissions);
    dbAction.get("findByPluginNamespaceAndPageId", [ns, pageId], next);
};

exports.getPluginSettings = function (req, pageId, ns, next) {
    var dbAction = DBActions.getInstance(req, PLUGIN_INSTANCE_SCHEMA).setPermissions(Permissions);
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
    dbAction.hasPermission(id, require("./permissions/Permissions").ActionKeys.SETTINGS, next);
}

exports.updateSettings = function (req, settings, pageId, ns, next) {
    var dbAction = DBActions.getInstance(req, PLUGIN_INSTANCE_SCHEMA).setPermissions(Permissions);
    getPluginInstance(dbAction, pageId, ns, function (err, model) {
        if (err) {
            return next(err);
        }
        var id = model.pluginInstanceId;
        checkSettingsPermission(dbAction, id, function (err, isAuth) {
            if (err) {
                next(err)
            }
            else if (isAuth) {
                dbAction.update({
                    pluginInstanceId:id,
                    settings:settings
                }, next);
            }
        });
    });
};

exports.updateSettings_1 = function (dbAction, pluginInstance, settings, next) {
    dbAction.setPermissions(Permissions);
    var id = pluginInstance.pluginInstanceId;
    checkSettingsPermission(dbAction, id, function (err, isAuth) {
        if (err) {
            next(err)
        }
        else if (isAuth) {
            dbAction.update({
                pluginInstanceId:id,
                settings:settings
            }, next);
        }
    });
};

exports.updateTitle = function (req, title, pageId, ns, next) {
    var dbAction = DBActions.getInstance(req, PLUGIN_INSTANCE_SCHEMA).setPermissions(Permissions);
    getPluginInstance(dbAction, pageId, ns, function (err, model) {
        if (err) {
            return next(err);
        }
        var id = model.pluginInstanceId;
        checkSettingsPermission(dbAction, id, function (err, isAuth) {
            if (err) {
                next(err)
            }
            else if (isAuth) {
                dbAction.update({
                    pluginInstanceId:id,
                    title:title
                }, next);
            }
        });
    });
};
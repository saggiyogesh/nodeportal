var BasePluginController = require(process.cwd() + "/lib/BasePluginController"),
    PluginInstanceHandler = require(process.cwd() + "/lib/PluginInstanceHandler"),
    PLUGIN_PERMISSION_SCHEMA_KEY = PluginInstanceHandler.permissionSchemaKey;
var PermissionController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route: '/:type?/:modelId?/:name?/:modelPermissionSchema?', action: getPermissions
        });
        that.post({
            route: '/updatePermissions', action: updatePermissionsAction
        });
    });
};

util.inherits(PermissionController, BasePluginController);

function updatePermissionsAction(req, res, next) {
    var that = this, PluginHelper = that.getPluginHelper(),
        postParams = PluginHelper.getPostParams(req),
        redirect = postParams.redirect, modelId = postParams.modelId, modelName = postParams.modelName,
        permissionSchemaKey = postParams.modelPermissionSchema,
        isSettingsPlugin = postParams.isSettingsPlugin;
    delete postParams.redirect;
    delete postParams.modelId;
    delete postParams.modelName;
    delete postParams.modelPermissionSchema;
    delete postParams.isSettingsPlugin;

    var PermissionsCache = require(utils.getLibPath() + "/permissions/Cache");
    var Roles = require(utils.getLibPath() + "/permissions/Roles");

    var Service = that.getService(modelName),
        pv = new that.PermissionValidator(req, permissionSchemaKey, modelName);
    var pm, roles;
    if (isSettingsPlugin) {
        pm = PermissionsCache.getCacheItem(permissionSchemaKey);
        roles = [Roles.getUserRole().roleId];
    } else {
        pm = PermissionsCache.getCacheItem(permissionSchemaKey, modelId);
        roles = [Roles.getUserRole().roleId, Roles.getGuestRole().roleId];
    }

    Debug._li(".. ", postParams, true);

    var actionsValue = pm.getActionsValue(), getActionValue = pm.getActionValue;

    var rolePermissions = _.clone(pm.getPermissions());
    Debug._li("rolePermissions ", rolePermissions, true)
    Debug._li("av:  ", pm.getActionsValue(), true)

    roles.forEach(function (roleId) {
        rolePermissions[roleId] = [];
    });

    _.each(postParams, function (val, key) {
        if (val === "on") {
            key = key.split("___");
            var roleId = key[0], action = key[1], actionVal = getActionValue(action);
            var arr = rolePermissions[roleId];
            arr.push(actionVal);
        }
    });
    Debug._li("rolePermissions1 ", rolePermissions, true)

    var modelIdKey = Service.getIdName(),
        action = "PERMISSION";

    if (isSettingsPlugin) {

        Service.getByPermissionSchemaKey(permissionSchemaKey, function (err, model) {
            if (!err) {
                model = model.toObject();
                var permissionSchemaKey = model.permissionSchemaKey;
                delete  model._id;
                delete model.permissionSchemaKey
                Debug._li(">> ", model, true);
                model.rolePermissions = rolePermissions;
                pv.hasPermissionWithoutModelId(action, function (err, perm) {
                    if (perm && perm.isAuthorized) {
                        Service.update(model, function (err, result) {
                            if (result) {
                                Debug._l(">> up " + result);
                                PermissionsCache.updateCacheItem(permissionSchemaKey, null, model);
                                that.setRedirect(req, redirect);
                            }
                            next(err);
                        });
                    }
                    else {
                        err = pv.getPermissionError(action);
                        next(err);
                    }
                });
            }
            else
                next(err);
        });

    }
    else {
        var modelObj = {
            rolePermissions: rolePermissions
        };

        modelObj[ modelIdKey] = modelId;
        async.series([
            function (n) {
                if (modelId) {
                    pv.hasPermission(action, modelId, function (err, perm) {
                        if (perm && perm.isAuthorized === true) {
                            Service.update(modelObj, n);
                        }
                        else n(err);
                    });
                }
                else {
                    n(new Error(modelName + " id is not available in model update"));
                }
            }
        ], function (err, result) {
            if (result) {
                redirect && that.setRedirect(req, redirect);
//            var msg = "Permissions updated successfully.";
//            that.setSuccessMessage(req, msg);
                PermissionsCache.updateCacheItem(permissionSchemaKey, modelId, modelObj);
            }
            next(err);
        });
    }
}


function getPermissions(req, res, next) {
    var that = this, params = req.params, type = params.type, modelId = params.modelId, name = params.name;
    if (type && modelId && name) {
        var PermissionsCache = require(utils.getLibPath() + "/permissions/Cache");
        var Roles = require(utils.getLibPath() + "/permissions/Roles");

        try {
            var pv, permissionSchemaKey;
            if (type == "model") {
                permissionSchemaKey = params.modelPermissionSchema;
                pv = new that.PermissionValidator(req, permissionSchemaKey, name);
            }
            else if (type == "plugin") {
                var PLUGIN_INSTANCE_SCHEMA = "PluginInstance",
                    permissionSchemaKey = PLUGIN_PERMISSION_SCHEMA_KEY;
                pv = new that.PermissionValidator(req, permissionSchemaKey, PLUGIN_INSTANCE_SCHEMA);
                req.params.name = PLUGIN_INSTANCE_SCHEMA;
                req.params.modelPermissionSchema = permissionSchemaKey;
            }
            else if (type == "settings") {
                var SETTINGS_INSTANCE_SCHEMA = "SchemaPermissions",
                    permissionSchemaKey = utils.getSettingsPluginPermissionSchemaKey(name);
                pv = new that.PermissionValidator(req, permissionSchemaKey, SETTINGS_INSTANCE_SCHEMA);
                req.params.name = SETTINGS_INSTANCE_SCHEMA;
                req.params.modelPermissionSchema = permissionSchemaKey;
                pv.hasPermissionWithoutModelId("PERMISSION", function (err, perm) {
                    if (perm && perm.isAuthorized) {
                        var pm = PermissionsCache.getCacheItem(permissionSchemaKey),
                            actionsValue = pm.getActionsValue();
                        var roles = ["", Roles.getUserRole()], actions = Object.keys(actionsValue);

                        req.attrs.hasAuth = true;
                        req.attrs.roles = roles;
                        req.attrs.actions = actions;
                        req.attrs.actionsValue = actionsValue;
                        req.attrs.permissions = pm.getPermissions();
                        req.attrs.guestRoleId = Roles.getGuestRole().roleId;
                        req.attrs.isSettingsPlugin = true;
                    } else {
                        err = pv.getPermissionError("PERMISSION");
                    }
                    return next(err);
                });
                return;
            }

            pv.hasPermission("PERMISSION", modelId, function (err, perm) {
                if (perm && perm.isAuthorized) {
                    req.attrs.hasAuth = true;
                    var pm = PermissionsCache.getCacheItem(permissionSchemaKey, modelId),
                        actionsValue = pm.getActionsValue();
                    var roles = ["", Roles.getUserRole(), Roles.getGuestRole()], actions = Object.keys(actionsValue);

                    req.attrs.roles = roles;
                    req.attrs.actions = actions;
                    req.attrs.actionsValue = actionsValue;
                    req.attrs.permissions = pm.getPermissions();
                    req.attrs.guestRoleId = Roles.getGuestRole().roleId;
                }
                next(err);
            });
        } catch (e) {
            next(e, req, res);
        }
    }
    else {
        that.setErrorMessage(req, "Missing parameters");
        next(null);
    }
}

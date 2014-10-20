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

PermissionController.prototype.permissionFormAction = function (req, res, next) {

    var that = this, p = req.query.p, type = p.type, modelId = p.modelId, name = p.name;

    if (type && modelId && name) {
        var PermissionsCache = require(utils.getLibPath() + "/permissions/Cache");
        var Roles = require(utils.getLibPath() + "/permissions/Roles");

        req.attrs.type = type;
        req.attrs.modelId = modelId;
        req.attrs.name = name;

        try {
            var pv, permissionSchemaKey;
            if (type == "model") {
                permissionSchemaKey = p.modelPermissionSchema;
                pv = new that.PermissionValidator(req, permissionSchemaKey, name);
                req.attrs.modelPermissionSchema = permissionSchemaKey;
            }
            else if (type == "plugin") {
                var PLUGIN_INSTANCE_SCHEMA = "PluginInstance",
                    permissionSchemaKey = PLUGIN_PERMISSION_SCHEMA_KEY;
                pv = new that.PermissionValidator(req, permissionSchemaKey, PLUGIN_INSTANCE_SCHEMA);
                req.attrs.name = PLUGIN_INSTANCE_SCHEMA;
                req.attrs.modelPermissionSchema = permissionSchemaKey;
            }
            else if (type == "settings") {
                var SETTINGS_INSTANCE_SCHEMA = "SchemaPermissions",
                    permissionSchemaKey = utils.getSettingsPluginPermissionSchemaKey(name);
                pv = new that.PermissionValidator(req, permissionSchemaKey, SETTINGS_INSTANCE_SCHEMA);
                req.attrs.name = SETTINGS_INSTANCE_SCHEMA;
                req.attrs.modelPermissionSchema = permissionSchemaKey;
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
};

function updatePermissionsAction(req, res, next) {
    var that = this, PluginHelper = that.getPluginHelper(),
        postParams = PluginHelper.getPostParams(req),
        redirect = postParams.redirect, modelId = postParams.modelId, name = postParams.name,
        permissionSchemaKey = postParams.modelPermissionSchema,
        isSettingsPlugin = postParams.isSettingsPlugin;
    delete postParams.redirect;
    delete postParams.modelId;
    delete postParams.modelPermissionSchema;
    delete postParams.isSettingsPlugin;

    var PermissionsCache = require(utils.getLibPath() + "/permissions/Cache");
    var Roles = require(utils.getLibPath() + "/permissions/Roles");

    var Service = that.getService(name),
        pv = new that.PermissionValidator(req, permissionSchemaKey, name);
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

    postParams.values && _.each(postParams.values.split(","), function (val) {
        var key = val.split("___");
        var roleId = key[0], action = key[1], actionVal = getActionValue(action);
        var arr = rolePermissions[roleId];
        arr.push(actionVal);
    });
    Debug._li("rolePermissions1 ", rolePermissions, true)

    var modelIdKey = Service.getIdName(),
        action = "PERMISSION";

    function setSuccess() {
        var msg = "Permissions updated successfully.";
        that.setSuccessMessage(req, msg);
        req.params.action = "permissionForm";
        req.query.p = {
            type: postParams.type,
            modelId: modelId,
            name: postParams.name,
            modelPermissionSchema: permissionSchemaKey
        };
        utils.tick(function () {
            that.permissionFormAction(req, res, next);
        });

    }

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
                            Debug._l(">> up " + result);
                            if (result) {
                                setSuccess();
                                PermissionsCache.updateCacheItem(permissionSchemaKey, null, model);
                            }
                            else
                                next(err);
                        });
                    }
                    else {
                        next(pv.getPermissionError(action));
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
                    n(new Error(name + " id is not available in model update"));
                }
            }
        ], function (err, result) {
            if (result && result[0]) {
                setSuccess();
                PermissionsCache.updateCacheItem(permissionSchemaKey, modelId, modelObj);
            }
            else
                next(err);
        });
    }
}


function getPermissions(req, res, next) {
    req.attrs.p = {};
    utils.copyObject(req.params, req.attrs.p);
    next();
}

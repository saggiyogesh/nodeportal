var BasePluginController = require(process.cwd() + "/lib/BasePluginController"),
    PluginInstanceHandler = require(process.cwd() + "/lib/PluginInstanceHandler"),
    Permissions = require(process.cwd() + "/lib/permissions/Permissions");
var PermissionController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route:'/:type?/:modelId?/:name?', action:getPermissions
        });
        that.post({
            route:'/updatePermissions', action:updatePermissionsAction
        });
    });
};

util.inherits(PermissionController, BasePluginController);

function updatePermissionsAction(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), params = req.params,
        ns = that.getNamespace(req), PluginHelper = that.getPluginHelper(),
        postParams = PluginHelper.getPostParams(req),
        redirect = postParams.redirect, modelId = postParams.modelId, modelName = postParams.modelName;
    delete postParams.redirect;
    delete postParams.modelId;
    delete postParams.modelName;

    var dbAction = DBActionsLib.getInstance(req, modelName);
    dbAction.permissions = dbAction.permissions || PluginInstanceHandler.Permissions;
    var permissions = dbAction.permissions ,
        actionsValue = permissions.actionsValue,
        modelPermissions = _.clone(DBActionsLib.getPermissionCache(modelId)),
        userPerm = [], guestPerm = [];
    _.each(postParams, function (val, key) {
        if (val == "on") {
            key = key.split("_");
            var role = key[0], action = key[1];
            if (role == "User") {
                userPerm.push(actionsValue[action]);
            }
            else if (role == "Guest") {
                guestPerm.push(actionsValue[action]);
            }
        }
    });
    modelPermissions["User"] = userPerm;
    modelPermissions["Guest"] = guestPerm;
    var modelObj = {
        rolePermissions:modelPermissions
    };
    modelObj[DBActionsLib.getModelIdKey(modelName)] = modelId;
    dbAction.authorizedUpdatePermissions(modelObj, function (err, result) {
        if (result) {
            that.setRedirect(req, redirect);
            var msg = "Permissions updated successfully.";
            that.setSuccessMessage(req, msg);
            DBActionsLib.addPermissionCache({
                modelId:modelId,
                rolePermissions:modelPermissions
            });
        }
        next(err, req, res);
    });
}

function getPermissions(req, res, next) {
    var that = this, params = req.params, type = params.type, modelId = params.modelId, name = params.name;
    if (type && modelId && name) {
        try {
            var dbAction;
            if (type == "model") {
                dbAction = that.getDBActionsLib().getInstance(req, name);
            }
            else if (type == "plugin") {
                var PluginInstanceHandler = require(process.cwd() + "/lib/PluginInstanceHandler"),
                    PLUGIN_INSTANCE_SCHEMA = "PluginInstance";
                dbAction = that.getDBActionsLib().getInstance(req, PLUGIN_INSTANCE_SCHEMA);
                dbAction.setPermissions(PluginInstanceHandler.Permissions);
                req.params.name = PLUGIN_INSTANCE_SCHEMA;
            }

            dbAction.hasPermission(modelId, Permissions.ActionKeys.PERMISSION, function (err, hasAuth) {
                if (hasAuth) {
                    req.attrs.hasAuth = true;
                    var perm = that.getDBActionsLib().getPermissionCache(modelId),
                        permissions = dbAction.permissions;
                    var roles = ["", "User", "Guest"], actions = Object.keys(permissions.actionsValue);

                    req.attrs.roles = roles;
                    req.attrs.actions = actions;
                    req.attrs.actionsValue = permissions.actionsValue;
                    req.attrs.permissions = perm;
                }
                next(err, req, res);
            });
        } catch (e) {
            next(e, req, res);
        }
    }
    else {
        that.setErrorMessage(req, "Missing parameters");
        next(null, req, res);
    }
}

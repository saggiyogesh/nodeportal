/**
 *  Methods of AUTH are merged in DBAction instance, when getAuthInstance of DBAction is called
 */


var AUTH = {},
    PermissionError = require('../permissions/PermissionError'),
    PermissionsCache = require('../permissions/Cache');

exports.Auth = AUTH;

/**
 *
 * @param methodName
 * @param param
 * @param next
 */
AUTH.authorizedGet = function (methodName, param, next) {
    var that = this, action = "VIEW";
    that.hasPermission(action, param, function (err, perm) {
        if (perm && perm.isAuthorized === true) {
            that.get(methodName, param, next);
        }
        else {
            next(err);
        }
    });
};


AUTH.authorizedUpdate = function (modelData, next) {
    var that = this, modelName = that.modelName,
        modelIdValue = that.getModelIdValue(modelData), action = "UPDATE";
    if (!modelIdValue) {
        next(new Error(modelName + " id is not available in model update"));
        return;
    }
    that.hasPermission(action, modelIdValue, function (err, perm) {
        if (perm && perm.isAuthorized === true) {
            that.update(modelData, next);
        }
        else {
            next(err);
        }
    });
};

AUTH.authorizedSave = function (modelData, next) {
    var that = this, action = "ADD";
    var perm = that.hasPermission(action);
    var user = that.getUser();
    if (perm && perm.isAuthorized === true) {
        var modelPermissionSchema = modelData.rolePermissions;
        Debug._l(modelPermissionSchema)
        if (!PermissionsCache.isValidPermissionSchemaKey(modelPermissionSchema)) {
            return next(new Error("Invalid permission schema key for model data"));
        }
        var cacheItem = PermissionsCache.getCacheItem(modelPermissionSchema),
            permissions = cacheItem.getPermissions();
        modelData.userId = user.userId;
        modelData.userName = user.userName;
        modelData.rolePermissions = permissions;
        that.save(modelData, next);
    }
    else {
        next(new PermissionError(null, user.userName, action));
    }
};

/*AUTH.authorizedUpdatePermissions = function (modelData, next) {
    var that = this, modelName = that.modelName,
        modelIdValue = that.getModelIdValue(modelData),
        action = "PERMISSION";
    if (!modelIdValue) {
        next(new Error(modelName + " id is not available in model update"));
        return;
    }

    that.hasPermission(action, modelIdValue, function (err, perm) {
        if (perm && perm.isAuthorized === true) {
            that.update(modelData, next);
        }
        else next(err);
    });
};*/

AUTH.authorizedRemove = function (modelIdValue, next) {
    var that = this;
    that.hasPermission("DELETE", modelIdValue, function (err, perm) {
        if (perm && perm.isAuthorized === true) {
            that.remove(modelIdValue, next);
        }
        else next(err);
    });
};

AUTH.authorizedRemoveByQuery = function (query, next) {
    this.addPermissionInQuery(query, "DELETE").remove(next);
};

//TODO to be tested by giving multiple roles to a user
AUTH.addPermissionInQuery = function (query, action) {
    action = action || "VIEW";
    var that = this, roles = that.getUser().roles, cacheItem = PermissionsCache.getCacheItem(that.permissionSchemaKey),
        actionValue = cacheItem.getActionValue(action);
    var arr = [];
    roles.forEach(function (role) {
        var q = {};
        q["rolePermissions." + role] = actionValue;
        arr.push(q);
    });
    query.or(arr);
//    var that = this, role = that.getUser().roles, roleQueryKey = "rolePermissions." + role;

//    query.where(roleQueryKey, cacheItem.getActionValue(action));
    return query;
};

AUTH.authorizedCount = function (query, next) {
    this.addPermissionInQuery(query).count(next);
};

AUTH.authorizedGetByQuery = function (query, next) {
    this.addPermissionInQuery(query).exec(next);
};
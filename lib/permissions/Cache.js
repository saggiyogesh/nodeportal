/**
 * Utility for Permission Cache
 */
var CacheStore = require("../CacheStore");

//Only memory cache store will be used and therefore sync methods are used
var PERMISSION_CACHE = CacheStore.createMemoryCacheStore({
    id: "permissions.cache"
}), cache = PERMISSION_CACHE.getCacheStore();

var TRIPLE_UNDERSCORE = "___";

/**
 * Constructor to create cache item
 * @param permissionSchemaKey {String} unique key
 * @param actionsValue {Object} Object to Action key with value
 * @param permissions  {Object} Object having array of permissions to each role.
 * @constructor
 */
function CacheItem(permissionSchemaKey, actionsValue, permissions) {
    if (!actionsValue) {
        if (!utils.contains(permissionSchemaKey, TRIPLE_UNDERSCORE)) {
            throw new Error("Invalid permissions schema key.")
        }
        else {
            var key = permissionSchemaKey.split(TRIPLE_UNDERSCORE)[0];
            actionsValue = cache.get(key).actionsValue;
        }
    }

    /**
     * Getter for permissionSchemaKey
     * @returns {String}
     */
    this.getPermissionSchemaKey = function () {
        return permissionSchemaKey;
    };

    /**
     * Returns action value.
     * @param action {String} Action key
     * @returns {String}
     */
    this.getActionValue = function (action) {
        if (!action) {
            throw new Error('No arguments');
        }
        return actionsValue[action];
    };

    /**
     * Returns array of action values for the role
     * @param roleId {Number}
     * @returns {Array}
     */
    this.getRolePermissions = function (roleId) {
        if (!roleId) {
            throw new Error('No arguments');
        }
        return permissions[roleId];
    };

    /**
     * Getter of permissions
     * @returns {Object}
     */
    this.getPermissions = function () {
        return permissions;
    };

    /**
     * Getter of actions values.
     * @returns {Object}
     */
    this.getActionsValue = function () {
        return actionsValue;
    };

    this.permissions = permissions
    this.actionsValue = actionsValue
}

/**
 * Method storing model's role permissions to cache
 * @param model {Object}
 * @param permissionSchemaKey {String}
 */
function storeModel(model, permissionSchemaKey) {
    if (model && model.rolePermissions) {
        var obj = {
            permissionSchemaKey: permissionSchemaKey,
            rolePermissions: model.rolePermissions
        };
        exports.store(obj);
    }
}

/**
 * Method storing role permissions in cache
 * @param obj {Object}.
 * Properties of obj:
 *  permissionSchemaKey {String}
 *  actionsValue {Object}
 *  rolePermissions {Object}
 */
exports.store = function (obj) {
    Debug._l("saved permissionSchemaKey: " + obj.permissionSchemaKey);
    cache.set(obj.permissionSchemaKey, new CacheItem(obj.permissionSchemaKey, obj.actionsValue, obj.rolePermissions));
};

/**
 * Removes permission cache item
 * @param permissionSchemaKey  {String}
 * @param modelId  {Number}
 */
exports.remove = function (permissionSchemaKey, modelId) {
    if (modelId) {
        permissionSchemaKey = generateKeyByModelId(permissionSchemaKey, modelId);
    }
    Debug._l("removed permission cache item: " + permissionSchemaKey)
    delete cache.delete(permissionSchemaKey);
};

/*exports.storeModels = function (permissionSchemaKey, models) {
 if (!permissionSchemaKey) {
 throw new Error("Permission Schema Key is not defined.");
 }
 utils.tick(function () {
 if (!exports.getCacheItem(permissionSchemaKey)) {
 if (_.isArray(models)) {
 models.forEach(function (model) {
 storeModel(model, permissionSchemaKey);
 });
 }
 else { //single model
 storeModel(models, permissionSchemaKey);
 }
 }
 Debug._l("storeModels: " + permissionSchemaKey)
 });
 };*/

/**
 * Stores permission cache by retrieving model from Services using params: modelName & modelId.
 *
 * @param ds {Object} Datasource object
 * @param permissionSchemaKey {String}
 * @param modelName {String}
 * @param modelId {Number}
 * @param [next] {Function}
 */
exports.storeByModelId = function (ds, permissionSchemaKey, modelName, modelId, next) {
    if (!permissionSchemaKey) {
        throw new Error("Permission Schema Key is not defined.");
    }

    function process() {
        permissionSchemaKey = generateKeyByModelId(permissionSchemaKey, modelId);

        if (!exports.getCacheItem(permissionSchemaKey)) {
            ds.getModel(modelName).findById(modelId, function (err, model) {
                if (err) {
                    Debug._l(err);
                }
                else {
                    storeModel(model, permissionSchemaKey);
                }
                next && next(err, true);
            });
        } else {
            next && next(null, true);
        }

    }

    if (next && _.isFunction(next)) {
        process();
    }
    else {
        utils.tick(function () {
            process();
        });
    }
};

/**
 * Returns cache item from cache
 * @param permissionSchemaKey {String}
 * @param [modelId] {Number}
 * @returns {CacheItem}
 */
exports.getCacheItem = function (permissionSchemaKey, modelId) {
    if (modelId) {
        permissionSchemaKey = generateKeyByModelId(permissionSchemaKey, modelId);
    }
    return cache.get(permissionSchemaKey);
};

/**
 * Updates cache, when permissions for roles are updated.
 * @param permissionSchemaKey {String}
 * @param modelId {Number}
 * @param model {Object} model object
 */
exports.updateCacheItem = function (permissionSchemaKey, modelId, model) {
    if (modelId) {
        permissionSchemaKey = generateKeyByModelId(permissionSchemaKey, modelId);
    }
    exports.store({
        permissionSchemaKey: permissionSchemaKey,
        rolePermissions: model.rolePermissions,
        actionsValue: model.actionsValue
    });
};

/**
 * Generates permission schema key as per model id
 * @param permissionSchemaKey {String}
 * @param modelId {Number}
 * @returns {String}
 */
var generateKeyByModelId = exports.generateKeyByModelId = function (permissionSchemaKey, modelId) {
    if (arguments.length !== 2) {
        throw new Error("Invalid number of arguments.")
    }
    return permissionSchemaKey + TRIPLE_UNDERSCORE + modelId;
};

/**
 *
 * @param permissionSchemaKey {String}
 * @returns {boolean}
 */
//Not optimized when large schemas are in cache
//Cache sorted keys of cache obj and perform binary search
exports.isValidPermissionSchemaKey = function (permissionSchemaKey) {
    if (!permissionSchemaKey || !_.isString(permissionSchemaKey)) {
        return false;
    }
    var keys = cache.keys();
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (permissionSchemaKey === key) {
            return true;
        }
    }
    return false;
};


//require('timers').setTimeout(function () {
//    Debug._li("..", cache, true);
//}, 5000);


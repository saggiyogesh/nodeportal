var PermissionActions = require(".././permissions").PermissionActions,
    PermissionValidator = require(".././permissions/PermissionValidator"),
    PermissionsCache = require(".././permissions/Cache");

module.exports = AuthDAOExtras;

/**
 * Provides helper methods in Auth Service.
 * @param ServiceAuth {Object}
 */
function AuthDAOExtras(ServiceAuth) {
    var baseService = ServiceAuth.baseService;
    var name = baseService.definition.name;

    function createPermissionValidator(req, permissionSchemaKey) {
        var pv = new PermissionValidator(req, permissionSchemaKey, name);
        return pv;
    }

    /**
     * Helper to remove the model entry after validating permissions.
     * @param pkValue {Number} value of primary key
     * @param pv {PermissionValidator} instance of PermissionValidator
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    ServiceAuth.remove = function removeAuth(pkValue, pv, next) {
        pv.hasPermission(PermissionActions.DELETE, pkValue, function (err, perm) {
            (perm && perm.isAuthorized === true) ? baseService.remove(pkValue, next) : next(err);
            PermissionsCache.remove(pv.getPermissionSchemaKey(), pkValue);
        });
    };

    /**
     * Helper to update the model by providing data after validating permissions.
     * @param data {Object} model data to be updated. Must have primary key
     * @param pv {PermissionValidator} instance of PermissionValidator
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    ServiceAuth.update = function updateAuth(data, pv, next) {
        pv.hasPermission(PermissionActions.UPDATE, data[baseService.getIdName()], function (err, perm) {
            (perm && perm.isAuthorized === true) ? baseService.update(data, next) : next(err);
        });
    };

    /**
     * Update by request and permissionSchemaKey
     * @param req {Object} Request object
     * @param permissionSchemaKey {String}
     * @param data {Object} model data to be updated. Must have primary key
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    ServiceAuth.updateByReq = function updateByReq(req, permissionSchemaKey, data, next) {
        this.update(data, createPermissionValidator(req, permissionSchemaKey), next);
    };

    /**
     * Helper to save the model data after validating permissions.
     * @param modelData {Object} data to saved in model
     * @param pv {PermissionValidator} instance of PermissionValidator
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    ServiceAuth.save = function saveAuth(modelData, pv, next) {
        async.waterfall([
            function (n) {
                pv.hasPermissionWithoutModelId(PermissionActions.ADD, n);
            },
            function (perm, n) {
                if (perm && perm.isAuthorized === true) {
                    var user = pv.getUser();
                    var modelPermissionSchema = modelData.rolePermissions;
                    Debug._l(modelPermissionSchema)
                    if (!PermissionsCache.isValidPermissionSchemaKey(modelPermissionSchema)) {
                        return n(new Error("Invalid permission schema key for model data"));
                    }
                    var cacheItem = PermissionsCache.getCacheItem(modelPermissionSchema),
                        permissions = cacheItem.getPermissions();
                    modelData.userId = user.userId;
                    modelData.userName = user.userName;
                    modelData.rolePermissions = permissions;
                    baseService.save(modelData, n);
                }
                else {
                    n(pv.getPermissionError(PermissionActions.ADD));
                }
            },
            function (model, n) {
                PermissionsCache.storeByModelId(baseService.getDataSource(),
                    pv.getPermissionSchemaKey(), name, model[baseService.getIdName()], n);
            }
        ], next);
    };

    /**
     * Authorized version of findById
     * @param pkValue {Number} Primary key value of model
     * @param pv {PermissionValidator} instance of PermissionValidator
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    ServiceAuth.findById = function findByIdAuth(pkValue, pv, next) {
        pv.hasPermission(PermissionActions.VIEW, pkValue, function (err, perm) {
            (perm && perm.isAuthorized === true) ? baseService.findById(pkValue, next) : next(err);
        });
    };

    /**
     * findById by request and permissionSchemaKey
     * @param req {Object} Request object
     * @param permissionSchemaKey {String}
     * @param pkValue {Number} Primary key value of model
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    ServiceAuth.findByIdAndReq = function findByIdAndReq(req, permissionSchemaKey, pkValue, next) {
        this.findById(pkValue, createPermissionValidator(req, permissionSchemaKey), next);
    };

    /**
     * Authorized version of deleteById
     * @param pkValue {Number} Primary key value of model
     * @param pv {PermissionValidator} instance of PermissionValidator
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    ServiceAuth.deleteById = function deleteByIdAuth(pkValue, pv, next) {
        pv.hasPermission(PermissionActions.DELETE, pkValue, function (err, perm) {
            (perm && perm.isAuthorized === true) ? baseService.deleteById(pkValue, next) : next(err);
        });
    };

    /**
     * Authorized version of updateById
     * @param pkValue {Number} Primary key value of model
     * @param data {Object} Data to be updated. pkValue must not be in it.
     * @param pv {PermissionValidator} instance of PermissionValidator
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    ServiceAuth.updateById = function updateByIdAuth(pkValue, data, pv, next) {
        pv.hasPermission(PermissionActions.UPDATE, pkValue, function (err, perm) {
            (perm && perm.isAuthorized === true) ? baseService.updateById(pkValue, data, next) : next(err);
        });
    };

    /**
     * Authorized version of find. Finds results after checking permissions in each model
     * Using query hook to find the results
     * @param query {Object} conditions for find method
     * @param roles {Array} User roles
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    ServiceAuth.find = function findAuth(query, roles, next) {
        baseService.getDataSource().queryHook.authorizedFind(roles, modelName, query, next);
    };

    /**
     * Authorized version of count. Count results after checking permissions in each model
     * Using query hook to find the Count
     * @param where {Object} Where clause conditions
     * @param roles {Array} User roles
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    ServiceAuth.count = function countAuth(where, roles, next) {
        baseService.getDataSource().queryHook.authorizedCount(roles, modelName, where, next);
    };

    /**
     * Authorized version of findOne.
     * @param query {Object} conditions for findOne method
     * @param roles {Array} User roles
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    ServiceAuth.findOne = function findOneAuth(query, roles, next) {
        this.find(query, roles, function (err, models) {
            next(err, (!err && models && models.length > 0) && models[0]);
        });
    };
}
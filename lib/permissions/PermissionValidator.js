/**
 * Validations each request for resource access or any action
 */

var _l = Debug._l, _li = Debug._li;
var Cache = require('./Cache'),
    PermissionError = require('./PermissionError');

function validate(rolePermission, actionValue) {
    return rolePermission.indexOf(actionValue) > -1;
}

function getCacheItem(schemaKey) {
    return Cache.getCacheItem(schemaKey);
}

function checkPermissionSync(action, userRoles, cacheItem) {
    var isAuthorized = false;
    var actionValue = cacheItem.getActionValue(action);
    if (!actionValue) {
        _l("Action not defined: " + action);
    }
    else {
        for (var i = 0; isAuthorized == false && i < userRoles.length; i++) {
            var roleId = userRoles[i], rolePermission = cacheItem.getRolePermissions(roleId);
            isAuthorized = !!rolePermission && validate(rolePermission, actionValue);
            _l("Authorized check for role: " + roleId + " :: " + action + " :: " + cacheItem.getPermissionSchemaKey() + " :: " + isAuthorized);
            if (isAuthorized) break;
        }

        if (!isAuthorized) {
            _l(roleId + " is not authorized to " + action);
        }
    }
    return {isAuthorized: isAuthorized, roleId: roleId, action: action};
}

/**
 * Constructor to create permission validator object
 * @param req {Object} request object
 * @param permissionSchemaKey {String}
 * @param modelName {String}
 * @constructor
 */
function PermissionValidator(req, permissionSchemaKey, modelName) {
    if (arguments.length != 3) {
        throw new Error("Invalid no of arguments");
    }

    var user = req.session.user,
        userRoles = user.roles;

    var isValidModelId = function (modelId) {
        return _.isNumber(modelId);
    };

    /**
     *
     * Getter of permissionSchemaKey
     * @returns {String}
     */
    this.getPermissionSchemaKey = function () {
        return permissionSchemaKey;
    };


    this.getUser = function () {
        return user;
    };
    /**
     * Returns permission error object for the action
     * @param action {String}
     * @returns {PermissionError}
     */
    var getPermissionError = this.getPermissionError = function (action) {
        return new PermissionError(null, user.userName, action)
    };

    /**
     * Returns validation result object
     * This object has following keys:
     *      isAuthorized {Boolean}: whether action is authorized
     *      roleId {Number}: Role for which action is validated
     *      action {String}: Action for which permissions are checked
     *
     * @param action {String}
     * @returns {Object}
     */
    function hasPermission1(action) {
        var cacheItem = getCacheItem(permissionSchemaKey);
        var p = checkPermissionSync(action, userRoles, cacheItem);
        /*if (p.isAuthorized === false) {
         throw new PermissionError(null, req.session.user.userName, action);
         }*/
        return  p;
    };

    /**
     * Method useful when model id is not present to assess permissions.
     * Case in which modelName is also not provided, when creating PermissionValidator instance
     *
     * @param action {String}
     * @param next {Function} - Callback will have err & permission result obj as parameters
     */
    this.hasPermissionWithoutModelId = function (action, next) {
        var that = this;
        if (!action || !_.isString(action) || !_.isFunction(next)) {
            throw new Error("Missing arguments.")
        }
        var err;
        var p = hasPermission1(action);
        if (p.isAuthorized === false) {
            err = getPermissionError(action);
        }
        next(err, p);
    };

    /**
     * Method useful to validate multiple permission actions in a single request
     * @param actions {Array} Multiple can be passed
     * @param modelId {Number}
     * @param next {Function} callback. parameter passed: err, object having each
     * permission action result
     */
    this.checkPermissionForActions = function (actions, modelId, next) {
        var that = this, perm = {};
        modelId = parseInt(modelId);
        if (!isValidModelId(modelId)) {
            throw new Error("Invalid model id: " + modelId + " :: modelName: " + modelName);
        }

        async.series([
            function (n) {
                Cache.storeByModelId(req.app.getDataSource(), permissionSchemaKey, modelName, modelId, n);
            } ,
            function (n) {
                var cacheItem = Cache.getCacheItem(permissionSchemaKey, modelId);

                if (cacheItem) {
                    actions.forEach(function (action) {
                        perm[action] = checkPermissionSync(action, userRoles, cacheItem);
                    });
                }
                else {
                    _l("No permissions exists in cache. Pass the callback to hasPermission");
                }
                n();
            }
        ], function (err, result) {
            next(err, !err ? perm : null);
        });
    };

    /**
     * Method check permissions in both sync and async way (if callback is provided)
     * if only action is provided than model permissions is checked (like ADD) but if modelId is also given then
     * model entry permission is checked(like VIEW, can be different for each model entry)
     *
     * @param action {String}
     * @param modelId {Number}
     * @param next {Function}
     * @returns {Object}
     */
    this.hasPermission = function (action, modelId, next) {
        var that = this;
        if (!action || !modelId || !_.isString(action) || !_.isFunction(next)) {
            throw new Error("Missing arguments.")
        }

        modelId = parseInt(modelId);
        if (!isValidModelId(modelId)) {
            throw new Error("Invalid model id: " + modelId + " :: modelName: " + modelName);
        }

        var process = function () {
            var cacheItem = Cache.getCacheItem(permissionSchemaKey, modelId);

            if (cacheItem) {
                return checkPermissionSync(action, userRoles, cacheItem);
            }
            else {
                _l("No permissions exists in cache. Pass the callback to hasPermission");
            }
            return;
        };

        Cache.storeByModelId(req.app.getDataSource(), permissionSchemaKey, modelName, modelId, function (err, done) {
            if (err) {
                return next(err);
            }
            var p;
            if (done) {
                p = process();
                if (p.isAuthorized === false) {
                    err = getPermissionError(action);
                }
            }
            next(err, p);
        });
    }
}

module.exports = PermissionValidator;
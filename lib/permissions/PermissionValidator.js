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

    var userRoles = req.session.roles;

    var isValidModelId = function(modelId){
        return _.isNumber(modelId) ;
    };

    /**
     * Returns permission error object for the action
     * @param action {String}
     * @returns {PermissionError}
     */
    var getPermissionError = this.getPermissionError = function (action) {
        return new PermissionError(null, req.session.user.userName, action)
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
    this.hasPermission1 = function (action) {
        var cacheItem = getCacheItem(permissionSchemaKey);
        var p = checkPermissionSync(action, userRoles, cacheItem);
        /*if (p.isAuthorized === false) {
         throw new PermissionError(null, req.session.user.userName, action);
         }*/
        return  p;
    };

    /**
     * Method check permissions in both sync and async way (if callback is provided)
     * if only action is provided than model permissions is checked (like ADD) but if modelId is also given then
     * model entry permission is checked(like VIEW, can be different for each model entry)
     *
     * @param action {String}
     * @param modelId {Number}
     * @param [next] {Function}
     * @returns {Object}
     */
    this.hasPermission = function (action, modelId, next) {
        var that = this;
        var argsLen = arguments.length;
        if (argsLen === 1) {
            return that.hasPermission1(action);
        }
        if (!action || !modelId) {
            throw new Error("Missing arguments.")
        }

        modelId = parseInt(modelId);
        if(!isValidModelId(modelId)){
            throw new Error("Invalid model id: " +modelId + " :: modelName: " + modelName);
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

        if (next && _.isFunction(next)) { //async version
            Cache.storeByModelId(req.app.set("db"), permissionSchemaKey, modelName, modelId, function (err, done) {
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
        else { //sync version
            return process();
        }

    }

}

module.exports = PermissionValidator;
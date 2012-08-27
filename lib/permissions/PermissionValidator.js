/**
 * Validations each request for resource access or any action
 */

var Permissions = require("./Permissions"), _l = Debug._l;
/**
 *
 * @param type
 */
exports.hasPermission = function (obj) {
    var permission = obj.actionValue;
    var rolePermission = obj.rolePermission;
    return rolePermission.indexOf(permission) > -1 ? true : false;
};

exports.validatePermission = function (actionKey, actionValue, rolePermissions, roles) {
    if (rolePermissions) {
        var isAuthorized = false;
        for (var i = 0; isAuthorized == false && i < roles.length; i++) {
            var role = roles[i], rolePermission = rolePermissions[role];
            isAuthorized = rolePermission && exports.hasPermission({actionValue:actionValue, rolePermission:rolePermission});
//            _l("Authorized check for role: " + role + " :: " + isAuthorized);
        }

        if (!isAuthorized) {
//            _l(role + " is not authorized to " + actionKey);
        }

        return {isAuthorized:isAuthorized, role:role};

    } else {
        _l(actionKey + " :: No permission exists");
        return {};
    }
}
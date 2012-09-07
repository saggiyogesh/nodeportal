/**
 * Reads and parse the Definition.js file
 */

var Definitions = require("./Definitions");
var ActionsKeys = require("./Permissions").ActionKeys,
    path = require("path"), plugins = require("../plugins"),
    fs = require("fs"),
    AsyncIterator = require("../Utils/AsyncIterator").AsyncIterator;

var _l = Debug._l;
var _i = Debug._i;

function process(definitions) {
    var modelPermissions = definitions.ModelPermissions, parsedModelPermissions = {};
    Object.keys(modelPermissions).forEach(function (key) {
        var entry = modelPermissions[key];
        if (!entry.permissions) {
            throw new Error("Permissions are not defined for model: " + key);
        }
        if (!entry.guest) {
            throw new Error("Default guest permissions are not defined for model: " + key);
        }
        if (!entry.user) {
            throw new Error("Default user permissions are not defined for model: " + key);
        }

        var actionsValue = {}, i = 0, total = [];

        //pushing the PERMISSION action to all permission actions
        entry.permissions.push(ActionsKeys.PERMISSION);
        entry.permissions.forEach(function (permission) {
            var val = Math.pow(2, i++);
            actionsValue[permission] = val;
            total.push(val);

        });

        i = 0;
        var guestPermission = [];
        entry.guest.forEach(function (permission) {
            var val = Math.pow(2, i++);
            guestPermission.push(val);
        });

        i = 0;
        var userPermission = [];
        entry.user.forEach(function (permission) {
            var val = Math.pow(2, i++);
            userPermission.push(val);
        });

        parsedModelPermissions["key"] = key;
        parsedModelPermissions["value"] = {actionsValue:actionsValue, rolePermissions:{
            "Guest":guestPermission, // permission for Guest Role
            "User":userPermission, // permission for User Role
            "Administrator":total // permission for Administrator Role
        }};
    });

//    _l(_i(parsedModelPermissions));
    return parsedModelPermissions;
}

var ProcessPermissions = exports.ProcessPermissions = function (app, next) {
    var pluginsHome = app.set('appPath') + "/plugins",
        allPlugins = Object.keys(plugins.getAll()) , appPermissions = app.set("permissions");

    var asycI = new AsyncIterator(allPlugins, next);
    asycI.setAsyncProcess(function () {
        var that = this, i = that.i, pluginId = that.vals[i];
        var permissionDefinitionFile = pluginsHome + "/" + pluginId + "/PermissionDefinition.js";
        var exists = path.exists || fs.exists;
        exists(permissionDefinitionFile, function (exists) {
            if (exists) {
                var permissions = process(require(permissionDefinitionFile));
                appPermissions[permissions.key] = permissions.value;
                _l(_i(app.set("permissions")));
            }
            asycI.iterate();
        });
    });
};


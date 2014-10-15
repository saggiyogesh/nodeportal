/**
 * Reads and parse the Definition.js file
 */

var path = require("path"), plugins = require("../plugins"),
    FileUtil = require("../file/FileUtil"),
    async = require("async"),
    Cache = require('./Cache');

var _l = Debug._l;
var _i = Debug._i, _li = Debug._li;

var PermissionActions = require("./index").PermissionActions,
    permissionActionsKeys = Object.keys(PermissionActions);


/**
 * Returns true if schemaActions exists in allActions
 * @param allActions {Array} all actions in defined in permission definition file
 * @param schemaActions {Array} actions allowed in particular schema entry in definition file
 */
function isActionsExistsInPermissionActions(allActions, schemaActions) {
    return utils.matchArray(allActions, schemaActions);
}

/*function putInAppPermissions(app, permissions) {
 var appPermissions = app.set("permissions");
 appPermissions[permissions.key] = permissions.value;
 }*/

function process(app, definitionsFile) {
    var roles = app.set("roles");
    var definitions = require(definitionsFile);
    //insert permission actions
    if (!definitions.hasOwnProperty("Actions")) {
        throw new Error("No PermissionActions defined in " + definitionsFile);
    }
//    definitions.Actions.forEach(function (key) {
//        PermissionActions[key] = key;
//    });

    var modelPermissions = definitions.ModelPermissions, parsedModelPermissions = {};

    Object.keys(modelPermissions).forEach(function (key) {
        var entry = modelPermissions[key];
        if (!entry.permissions) {
            throw new Error("Permissions are not defined for model: " + key);
        }

        if (!isActionsExistsInPermissionActions(definitions.Actions, entry.permissions)) {
            throw new Error("Unknown Schema actions in schema : " + key);
        }
        /*if (!entry.guest) {
         throw new Error("Default guest permissions are not defined for model: " + key);
         }
         if (!entry.user) {
         throw new Error("Default user permissions are not defined for model: " + key);
         }*/

        if (entry.user) {
            if (!isActionsExistsInPermissionActions(entry.permissions, entry.user)) {
                throw new Error("Unknown Schema actions in schema : " + key);
            }
        }
        var actionsValue = {}, i = 0, total = [];

        //pushing the PERMISSION action to all permission actions
        entry.permissions.push(PermissionActions.PERMISSION.name);
        var entryActions = entry.permissions;

        //re arranging actions so that default actions come on top
        var commons = _.intersection(permissionActionsKeys, entryActions);
        entryActions = _.union(commons, _.difference(entryActions, commons));
        var lastBit = 1;
        entryActions.forEach(function (permission) {
            lastBit = lastBit * 2;
            //assigning already defined bit value
            if (utils.containsArray(permissionActionsKeys, permission)) {
                lastBit = PermissionActions[permission].bit;
            }
            actionsValue[permission] = lastBit;
            total.push(lastBit);
        });

        i = 0;
        var guestPermission = [];
        entry.guest && entry.guest.forEach(function (permission) {
//            var val = Math.pow(2, i++);
            guestPermission.push(actionsValue[permission]);
        });

        i = 0;
        var userPermission = [];
        entry.user && entry.user.forEach(function (permission) {
//            var val = Math.pow(2, i++);
            userPermission.push(actionsValue[permission]);
        });
        var rolePermissions = {};
        rolePermissions[roles.Guest.roleId] = guestPermission;
        rolePermissions[roles.User.roleId] = userPermission;
        rolePermissions[roles.Administrator.roleId] = total;

        parsedModelPermissions[key] = {actionsValue: actionsValue, rolePermissions: rolePermissions};
    });
    return parsedModelPermissions;
}

/**
 * Function used to insert settings plugin schema permissions
 * @param app
 * @param next
 */
function insertSettingsPluginsPermission(app, next) {
    var pluginsHome = utils.getRootPath() + "/plugins",
        settingsPlugins = Object.keys(plugins.getSettingsPlugins());
    var SchemaPermissionsService = app.getService("SchemaPermissions");
    var pluginInstanceHandler = require(utils.getLibPath() + "/PluginInstanceHandler"),
        Roles = require(utils.getLibPath() + "/permissions/Roles"),
        guestRoleId = Roles.getGuestRole().roleId,
        userRoleId = Roles.getUserRole().roleId;

    var mapFunction = function (pluginId, next) {
        var permissions = pluginInstanceHandler.Permissions;
        var model = {
            actionsValue: permissions.actionsValue,
            permissionSchemaKey: utils.getSettingsPluginPermissionSchemaKey(pluginId)
        };
        var rolePermissions = _.clone(permissions.rolePermissions);
        //guest has nothing to do with settings plugin as its a non logged in user
        delete  rolePermissions[guestRoleId];

        //user role only have permission to show user manage plugin, to modify his profile
        if (pluginId != "userManage") {
            rolePermissions[userRoleId] = [];
        }

        model.rolePermissions = rolePermissions;
        Cache.store(model);
        SchemaPermissionsService.save(model, next);
    };

    async.eachSeries(settingsPlugins, mapFunction, function (err, results) {
        next(err, true);
    });


}

var ProcessPermissions = exports.ProcessPermissions = function (app, next) {
    var pluginsHome = utils.getPluginsPath(),
        allPlugins = Object.keys(plugins.getAll());

    var SchemaPermissionsService = app.getService("SchemaPermissions");
    var mapFunction = function (pluginId, n) {
        var permissionDefinitionFile = pluginsHome + "/" + pluginId + "/PermissionDefinition.js";
        if (FileUtil.exists(permissionDefinitionFile)) {
            _l(permissionDefinitionFile);
            try {
                var permissions = process(app, permissionDefinitionFile);

                var arr = [];
                _.each(permissions, function (value, key) {
                    value.permissionSchemaKey = key;
                    Cache.store(value);
                    arr.push(value)
                });
                SchemaPermissionsService.multipleSave(arr, n);
            } catch (e) {
                Debug._l(e);
                n(e);
            }
        } else {
            n(null)
        }
    };

    //finds existing permissions in SchemaPermissions schema,
    // if present put in cache otherwise process permission definition file
    SchemaPermissionsService.find({}, function (err, data) {
        if (err) {
            return next(err);
        }

        if (data.length > 0) {
            data.forEach(function (model) {
                Debug._li("> ",model, true)
                Cache.store({permissionSchemaKey: model.permissionSchemaKey, actionsValue: model.actionsValue, rolePermissions: model.rolePermissions});
            });
            next(null);
        } else {
            async.eachSeries(allPlugins, mapFunction, function (err, results) {
                if(err){
                    return next(err);
                }
                //inserts settings plugins permissions
                insertSettingsPluginsPermission(app, next);
            });
        }

    });
};


/**
 * Startup action to process permission form permissions definition files
 */


var async = require("async");
var pageSchemaKey = "model.pageSchema.Page";
var Cache = require("../permissions/Cache");

module.exports = function (app, done) {
    return function (next) {
        //updating rolePermissions in plugin instances
        var roles = app.set("roles");

        var pluginInstanceHandler = require(utils.getLibPath() + "/PluginInstanceHandler");
        var pluginInstanceRolePermissions = pluginInstanceHandler.Permissions.rolePermissions;
        var adminRole = roles["Administrator"],
            guestRole = roles["Guest"],
            userRole = roles["User"];

        pluginInstanceRolePermissions[adminRole.roleId] = pluginInstanceRolePermissions["Administrator"];
        pluginInstanceRolePermissions[guestRole.roleId] = pluginInstanceRolePermissions["Guest"];
        pluginInstanceRolePermissions[userRole.roleId] = pluginInstanceRolePermissions["User"];

        delete pluginInstanceRolePermissions['Administrator'];
        delete pluginInstanceRolePermissions["Guest"];
        delete pluginInstanceRolePermissions["User"];

        //storing permissions for plugin instances
        Cache.store({
            permissionSchemaKey: pluginInstanceHandler.permissionSchemaKey,
            actionsValue: pluginInstanceHandler.Permissions.actionsValue,
            rolePermissions: pluginInstanceRolePermissions
        });

        Debug._li(":: ", pluginInstanceRolePermissions, true);

        require("../permissions/PermissionDefinitionProcessor").ProcessPermissions(app, function (err, insertPermissions) {
            Debug._li("Insert permissions: ", insertPermissions, true);

            if (!insertPermissions) {
                return next(err, done);
            }

            //insert rolePermissions in collections after processing permissions
            async.parallel([
                function (cb) {
                    app.getService("PluginInstance").updateAll({}, {
                        rolePermissions: JSON.stringify(pluginInstanceRolePermissions)
                    }, cb);
                },
                function (cb) {
                    app.getService("SchemaPermissions").getByPermissionSchemaKey(pageSchemaKey, function (err, schemaP) {
                        if (err) {
                            return cb(err);
                        }

                        if (schemaP) {
                            var rolePermissions = schemaP.rolePermissions;
                            var PageService = app.getService("Page");
                            PageService.getByFriendlyURL("/home", function (err, home) {
                                Debug._l(home);
                                home.rolePermissions = rolePermissions;
                                home.save();
                            });

                            PageService.getByFriendlyURL("/test", function (err, test) {
                                Debug._l(test);
                                test.rolePermissions = rolePermissions;
                                test.save();
                            });

                            var cacheItem = Cache.getCacheItem(pageSchemaKey);
                            var viewActionValue = cacheItem.getActionValue("VIEW");

                            var rolePermissionsSettingsPage = {};
                            rolePermissionsSettingsPage[adminRole.roleId] = [viewActionValue];
                            rolePermissionsSettingsPage[userRole.roleId] = [viewActionValue];

                        }

                        cb(null, true);

                    })
                }

            ], function (err, results) {
                next(err, done);
            });


        });

    };
};
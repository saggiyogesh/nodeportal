/**
 * Startup action to get admin, user and guest roles
 */


var async = require("async"),
    Roles = require('../permissions/Roles');
module.exports = function (app, done) {
    return function (next) {
        var roles = {};
        var RoleService = app.getService("Role"),
            getByName = RoleService.getByName;

        async.parallel([
            function (next) {
                getByName("Administrator", function (err, role) {
                    if (!err) {
                        roles["Administrator"] = role;
                    }
                    next(err);
                });
            },
            function (next) {
                getByName("User", function (err, role) {
                    if (!err) {
                        roles["User"] = role;
                    }
                    next(err);
                });
            },
            function (next) {
                getByName("Guest", function (err, role) {
                    if (!err) {
                        roles["Guest"] = role;
                    }
                    next(err);
                });
            }
        ], function (err, result) {
            if (!err) {
                app.set("roles", roles);
                Roles.init(roles);
            }

            Debug._li("", roles, true);
            next(err, done);
        });
    };
};

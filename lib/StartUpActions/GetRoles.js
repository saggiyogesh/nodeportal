/**
 * Startup action to get admin, user and guest roles
 */


var DBActions = require("../DBActions"),
    async = require("async"),
    Roles = require('../permissions/Roles');
module.exports = function (app, done) {
    return function (next) {
        var roles = {};

        var roleDBAction = DBActions.getSimpleInstance(app, "Role");
        async.parallel([
            function (next) {
                roleDBAction.get("findByName", "Administrator", function (err, role) {
                    if (!err) {
                        roles["Administrator"] = role;
                    }
                    next(err);
                });
            },
            function (next) {
                roleDBAction.get("findByName", "User", function (err, role) {
                    if (!err) {
                        roles["User"] = role;
                    }
                    next(err);
                });
            },
            function (next) {
                roleDBAction.get("findByName", "Guest", function (err, role) {
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

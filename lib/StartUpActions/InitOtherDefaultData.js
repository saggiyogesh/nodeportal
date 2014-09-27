/**
 * This will inits the default roles, default user to app & index page to app
 */


var async = require("async"),
    getProp = require("../AppProperties").get,
    Roles = require('../permissions/Roles');
module.exports = function (app, done) {
    var RoleService = app.getService("Role");
    var UserService = app.getService("User");
    var PageService = app.getService("Page");

    return function (next) {
        var roles = {};

        async.parallel([
            function (n) {
                RoleService.getByName("Administrator", function (err, role) {
                    if (!err) {
                        roles["Administrator"] = role;
                    }
                    n(err);
                });
            },
            function (n) {
                RoleService.getByName("User", function (err, role) {
                    if (!err) {
                        roles["User"] = role;
                    }
                    n(err);
                });
            },
            function (n) {
                RoleService.getByName("Guest", function (err, role) {
                    if (!err) {
                        roles["Guest"] = role.toObject();
                    }
                    n(err);
                });
            },
            function (n) {
                UserService.getDefaultUser(function (err, user) {
                    if (!err) {
                        //set default user to app
                        app.set("Guest", user.toObject());
                    }
                    n(err);
                });

            },
            function (n) {
                PageService.getByFriendlyURL(getProp("DEFAULT_INDEX_PAGE"), function (err, page) {
                        if (!err) {
                            //set index page to app
                            app.set("IndexPage", page.toObject());
                        }
                        n(err);
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

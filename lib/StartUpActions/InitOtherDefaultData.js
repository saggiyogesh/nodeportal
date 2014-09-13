/**
 * This will inits the default roles, default user to app & index page to app
 */


var DBActions = require("../DBActions"),
    async = require("async"),
    getProp = require("../AppProperties").get,
    Roles = require('../permissions/Roles');
module.exports = function (app, done) {
    return function (next) {
        var roles = {};

        var roleDBAction = DBActions.getSimpleInstance(app, "Role");
        async.parallel([
            function (n) {
                roleDBAction.get("findByName", "Administrator", function (err, role) {
                    if (!err) {
                        roles["Administrator"] = role.toObject();
                    }
                    n(err);
                });
            },
            function (n) {
                roleDBAction.get("findByName", "User", function (err, role) {
                    if (!err) {
                        roles["User"] = role.toObject();
                    }
                    n(err);
                });
            },
            function (n) {
                roleDBAction.get("findByName", "Guest", function (err, role) {
                    if (!err) {
                        roles["Guest"] = role.toObject();
                    }
                    n(err);
                });
            },
            function (n) {
                DBActions.getInstanceFromApp(app, "User").get("getDefaultUser", function (err, user) {
                    if (!err) {
                        //set default user to app
                        app.set("Guest", user.toObject());
                    }
                    n(err);
                });

            },
            function (n) {
                DBActions.getInstanceFromApp(app, "Page")
                    .get("findByFriendlyURL", getProp("DEFAULT_INDEX_PAGE"), function (err, page) {
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

var async = require('async');

/**
 * Function returns a function which saves default data in User collection
 * @param app
 * @param data {Object|Array} Default data provided with plugin
 * @returns {Function}
 */
exports.User = function (app, data) {
    var PasswordUtil = require(app.set('appPath') + "/lib/PasswordUtil");
    var DBActions = require(app.set('appPath') + "/lib/DBActions");
    var roleDBAction = DBActions.getSimpleInstance(app, "Role");
    var userDBAction = DBActions.getSimpleInstance(app, "User");

    return function (next) {
        async.parallel({
                guestRole: function (cb) {
                    roleDBAction.get("getGuestRole", null, cb);
                },
                adminRole: function (cb) {
                    roleDBAction.get("getAdministratorRole", null, cb);
                }
            },
            function (err, results) {
                if (!err) {
                    data.admin.roles = [results.adminRole.roleId];
                    data.admin.passwordEnc = PasswordUtil.encryptSync("admin");
                    data.guest.roles = [results.guestRole.roleId];
                    userDBAction.multipleSave(_.values(data), next);
                }
            });
    };
};
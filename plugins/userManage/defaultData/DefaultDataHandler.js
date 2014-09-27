var async = require('async');

/**
 * Function returns a function which saves default data in User collection
 * @param app
 * @param data {Object|Array} Default data provided with plugin
 * @returns {Function}
 */
exports.User = function (app, data) {
    var PasswordUtil = require(utils.getLibPath() + "/PasswordUtil");

    var RoleService = app.getService("Role");
    var UserService = app.getService("User");

    return function (next) {
        async.parallel({
                guestRole: function (cb) {
                    RoleService.getGuestRole(cb);
                },
                adminRole: function (cb) {
                    RoleService.getAdministratorRole(cb);
                }
            },
            function (err, results) {
                if (!err) {
                    data.admin.roles = [results.adminRole.roleId];
                    data.admin.passwordEnc = PasswordUtil.encryptSync("admin");
                    data.guest.roles = [results.guestRole.roleId];
                    UserService.multipleSave(_.values(data), next);
                }
            });
    };
};
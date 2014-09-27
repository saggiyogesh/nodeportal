/**
 * Default data handler for Page schema
 */
var async = require('async');

/**
 * Function returns a function which saves default data in Page collection
 * @param app
 * @param data {Object|Array} Default data provided with plugin
 * @returns {Function}
 */
exports.Page = function (app, data) {
    var ThemeService = app.getService("Theme");
    var LayoutService = app.getService("Layout");
    var UserService = app.getService("User");
    var PageService = app.getService("Page");
    var RoleService = app.getService("Role");

    return function (next) {
        async.parallel({
                theme: function (cb) {
                    ThemeService.getDefault(cb);
                },
                defaultLayout: function (cb) {
                    LayoutService.getDefault(cb);
                },
                oneColLayout: function (cb) {
                    LayoutService.getOneCol(cb);
                },
                user: function (cb) {
                    UserService.getByEmailId("admin@nodeportal.com", cb);
                },
                role: function (cb) {
                    RoleService.getAll(cb);
                }
            },
            function (err, results) {
                if (err)
                    throw  err;
                var themeId = results.theme.themeId, oneColLayoutId = results.oneColLayout.layoutId,
                    defaultLayoutId = results.defaultLayout.layoutId, userId = results.user.userId,
                    userName = results.user.userName;

                var home = data.home, test = data.test;
                home.themeId = test.themeId = themeId;
                home.layoutId = defaultLayoutId;
                test.layoutId = oneColLayoutId;
                home.userId = test.userId = userId;
                home.userName = test.userName = userName;

                //getting all role id & creates empty role permissions object
                var roles = _.map(results.role, function (role) {
                    return role.roleId;
                });

                var rP = {};
                roles.forEach(function (rID) {
                    rP[rID] = [];
                });
                home.rolePermissions = rP;
                test.rolePermissions = rP;

                PageService.multipleSave(_.values(data), next);
            });
    };
};

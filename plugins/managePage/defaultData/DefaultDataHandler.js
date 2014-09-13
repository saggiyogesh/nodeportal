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
    var DBActions = require(utils.getLibPath() + "/DBActions");
    var themeDBAction = DBActions.getSimpleInstance(app, "Theme");
    var layoutDBAction = DBActions.getSimpleInstance(app, "Layout");
    var userDBAction = DBActions.getSimpleInstance(app, "User");

    return function (next) {
        async.parallel({
                theme: function (cb) {
                    themeDBAction.get("getDefault", null, cb);
                },
                defaultLayout: function (cb) {
                    layoutDBAction.get("getDefault", null, cb);
                },
                oneColLayout: function (cb) {
                    layoutDBAction.get("getOneCol", null, cb);
                },
                user: function (cb) {
                    userDBAction.get("findByEmailId", "admin@nodeportal.com", cb);
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

                DBActions.getSimpleInstance(app, "Page").multipleSave(_.values(data), next);
            });
    };
};

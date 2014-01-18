var async = require('async');

/**
 * Function returns a function which saves default data in PluginInstance collection
 * @param app
 * @param data {Object|Array} Default data provided with plugin
 * @returns {Function}
 */
exports.PluginInstance = function (app, data) {
    var DBActions = require(utils.getLibPath() + "/DBActions");
    var pluginDBAction = DBActions.getSimpleInstance(app, "PluginInstance");
    var userDBAction = DBActions.getSimpleInstance(app, "User");
    var pageDBAction = DBActions.getSimpleInstance(app, "Page");

    return function (next) {
        async.parallel({
                homePage: function (cb) {
                    pageDBAction.get("findByFriendlyURL", '/home', cb);
                },
                admin: function (cb) {
                    userDBAction.get("findByEmailId", "admin@nodeportal.com", cb);
                }
            },
            function (err, results) {
                if (!err) {
                    var pageId = results.homePage.pageId,
                        userId = results.admin.userId,
                        userName = results.admin.userName;

                    var login = data.login, displayArt = data.displayArticle;

                    login.pageId = displayArt.pageId = pageId;
                    login.userId = displayArt.userId = userId;
                    login.userName = displayArt.userName = userName;

                    pluginDBAction.multipleSave(_.values(data), next);
                }
            });
    };
};
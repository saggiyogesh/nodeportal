var async = require('async');

/**
 * Function returns a function which saves default data in PluginInstance collection
 * @param app
 * @param data {Object|Array} Default data provided with plugin
 * @returns {Function}
 */
exports.PluginInstance = function (app, data) {
    var PluginService = app.getService("PluginInstance");
    var UserService = app.getService("User");
    var PageService = app.getService("Page");

    return function (next) {
        async.parallel({
                homePage: function (cb) {
                    PageService.getByFriendlyURL('/home', cb);
                },
                admin: function (cb) {
                    UserService.getByEmailId("admin@nodeportal.com", cb);
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

                    PluginService.multipleSave(_.values(data), next);
                }
            });
    };
};
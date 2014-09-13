/**
 * Only logged in users are allowed to open settings page
 * Middleware for app settings page only
 */


var PermissionError = require("./PermissionError"),
    DBActions = require("../DBActions");

module.exports = function (req, res, next) {
    var err;
    if (!req.session || !req.session.loggedIn) {
        err = new PermissionError();
        next(err);
    }
    else {
        DBActions.getInstance(req, "Theme").get("getDefaultSettingsTheme", function (err, t) {
            if (!err) {
                var url = utils.getAppSettingsURL(req);
                req.attrs.page = {
                    localizedName: {
                        en_US: "App Settings"
                    },
                    data: {
                        col1HTMLTMPL: []
                    },
                    friendlyURL: url,
                    themeId: t.themeId
                };

                req.attrs.isAppSettings = true;

                req.params.page = url;
            }
            next(err);
        });
    }
};
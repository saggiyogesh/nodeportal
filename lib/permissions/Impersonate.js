/**
 * Should be used only in Dev mode.
 * Using this with doAsUserId parameter in request will impersonate the session with the user
 */

var USER_SCHEMA = "User", getProp = require("../AppProperties").get,
    LoginUtil = require("../login/LoginUtil");

var SESSION_MAX_AGE = getProp("SESSION_MAX_AGE");

module.exports = function (req, res, next) {
    if (req.query && req.query.doAsUserId) {
        var userId = req.query.doAsUserId;
        var UserService = req.app.getService(USER_SCHEMA);
        UserService.findById(userId, function (err, user) {
            if (user) {
                LoginUtil.regenerateSession(user, req);
            }
            next(err, req, res);
        });
    } else {
        next(null, req, res);
    }

};

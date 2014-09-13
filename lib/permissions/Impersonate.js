/**
 * Should be used only in Dev mode.
 * Using this with doAsUserId parameter in request will impersonate the session with the user
 */

var DBActions = require("../DBActions"), USER_SCHEMA = "User", getProp = require("../AppProperties").get,
    LoginUtil = require("../login/LoginUtil");

var SESSION_MAX_AGE = getProp("SESSION_MAX_AGE");

module.exports = function (req, res, next) {
    if (req.query && req.query.doAsUserId) {
        var userId = req.query.doAsUserId;
        DBActions.getInstance(req, USER_SCHEMA).get("findByUserId", userId, function (err, user) {
            if (user) {
                LoginUtil.regenerateSession(user.toObject(), req);
            }
            next(err, req, res);
        });
    } else {
        next(null, req, res);
    }

};

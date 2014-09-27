/**
 * Lib for handling login
 */

//var Step = require('step'), mongoose = require('mongoose');
var getProp = require("../AppProperties").get;
var Helpers = require("../Helpers");
var getMsg = require("../i18n").get;
var URLCreator = require("../URLCreator"), ResponseHelper = require("../ResponseHelper"),
    PasswordUtil = require("../PasswordUtil"), PassportUtil = require("./PassportUtil");
var _ = require("underscore"), PLuginHelper = require("../PluginHelper"),
    USER_SCHEMA = "User";
var SESSION_MAX_AGE = getProp("SESSION_MAX_AGE");

exports.getRedirect = function (req, loginPostData) {
    var redirect = loginPostData && loginPostData.redirect || req.query && req.query.redirect
        || getProp("REDIRECT_AFTER_LOGIN") || getProp("DEFAULT_INDEX_PAGE");

    return redirect;

};

exports.processLogin = function (req, res, loginPostData, next) {

    var email = loginPostData.email, password = loginPostData.password,
        redirect = exports.getRedirect(req, loginPostData), app = req.app;

    var setErr = function () {
            Helpers.setMessage({req: req, type: Helpers.Types.ERROR, msg: getMsg({key: "authentication-failed"})});
            // call should be made to next otherwise page will not render
            return next(null);
        };

    PassportUtil.passport.authenticate('local', function (err, user) {
        if (err) {
            return next(err)
        }
        if (!user) {
            return setErr();
        }
        regenerateSession(user, req, function () {
            ResponseHelper.setRedirect(req, redirect);
            next(null);
        });
    })(req, res, next);
};

var regenerateSession = exports.regenerateSession = function (user, req, next) {
    var session = req.session;
    session.regenerate(function () {
        session = session.req.session; //workaround for cloned request to get correct session
        session.loggedIn = true;
        session.user = utils.clone(user);
        session.roles = user.roles;
        session.cookie.expires = new Date(Date.now() + SESSION_MAX_AGE);
        session.cookie.maxAge = SESSION_MAX_AGE;
        next && next();
    });
};

exports.doLogout = function (req, res) {
    req.session.destroy();
    res.redirect(getProp("REDIRECT_AFTER_LOGOUT") || getProp("DEFAULT_INDEX_PAGE"));
};

exports.showLogin = function (req, res) {
    var url = URLCreator.createMaximizedURL().setAction("doLogin").setPageFriendlyURL(getProp("DEFAULT_INDEX_PAGE"))
        .setNamespace("login");
    if (req.query.hasOwnProperty("redirect")) {
        url.setParameter("redirect", req.query.redirect);
    }
    res.redirect(url.toString());
};

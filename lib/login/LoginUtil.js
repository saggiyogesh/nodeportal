/**
 * Lib for handling login
 */

//var Step = require('step'), mongoose = require('mongoose');
var getProp = require("../AppProperties").get;
var Helpers = require("../Helpers");
var getMsg = require("../i18n").get;
var URLCreator = require("../URLCreator"), ResponseHelper = require("../ResponseHelper"),
    PasswordUtil = require("../PasswordUtil");
var _ = require("underscore"), DBActions = require("../DBActions"), PLuginHelper = require("../PluginHelper"),
    USER_SCHEMA = "User";

exports.processLogin = function (req, res, login, next) {
    var SESSION_MAX_AGE = getProp("SESSION_MAX_AGE");

    var email = login.email, password = login.password, redirect = login.redirect || req.query.redirect
        || getProp("REDIRECT_AFTER_LOGIN") || getProp("DEFAULT_INDEX_PAGE"), app = req.app;
    var modelPath = app.set('appPath') + "/services/shell/model", db = app.set('db');

    require(modelPath + "/UserSchema");

    var get = DBActions.get,
        setErr = function(){
            Helpers.setMessage({req:req, type:Helpers.Types.ERROR, msg:getMsg({key:"authentication-failed"})});
            // call should be made to next otherwise page will not render
            return next(null, req, res);
        };

    DBActions.getInstance(req, USER_SCHEMA).get("findByEmailId", email, function (err, user) {
        if (err) {
            return next(err, req, res);
        }

        if (user) {
            PasswordUtil.check(password, user.passwordEnc, function (err, result) {
                if (err) {
                    return next(err, req, res);
                }

                if (result && result === true) {
                    var session = req.session;
                    session.regenerate(function () {
                        session = session.req.session; //workaround for cloned request to get correct session
                        session.loggedIn = true;
                        session.user = _.clone(user);
                        session.roles = user.roles;
                        session.cookie.expires = new Date(Date.now() + SESSION_MAX_AGE);
                        session.cookie.maxAge = SESSION_MAX_AGE;
                        ResponseHelper.setRedirect(req, redirect);

                        //The Page response next function should be called here as this is in other function
                        //This is due to asynchronous execution of flow
                        next(null, req, res);
                    });
                } else {
                    setErr();
                }
            });
        }
        else{
            setErr()
        }
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

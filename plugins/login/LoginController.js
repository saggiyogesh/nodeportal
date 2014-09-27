/**
 *
 */
var util = require("util");
var BasePluginController = require(utils.getLibPath() + "/BasePluginController"),
    PasswordUtil = require(utils.getLibPath() + "/PasswordUtil"),
    LoginUtil = require(utils.getLibPath() + "/login/LoginUtil"),
    PassportUtil = require(utils.getLibPath() + "/login/PassportUtil");
var loginForms = require("./loginForms"), USER_SCHEMA = "User";
var gravatar = require('gravatar');


var LoginController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route: '/:action' // by this route /home/login/login, /home/login/register is called. Generic one
        });
        that.get({
            route: '/oauth/:account', action: oAuthLoginAction, isAppRoute: true
        });

        that.get({
            route: '/oauthCallback/:account', action: oAuthCallbackAction, isAppRoute: true
        });

        that.post({
            route: '/doLogin',
            action: doLoginAction
        });
        that.post({
            route: '/doRegister',
            action: doRegister
        });
        that.post({
            route: '/oauthRegister',
            action: oauthRegister
        });

        that.addCustomValidations(loginForms.customValidations);
    });
};

util.inherits(LoginController, BasePluginController);

function loginProcess(req, res, next, post) {
    return function (err) {
        if (err) {
            next(err);
        }
        LoginUtil.processLogin(req, res, post, next);
    }
}

function getGravatar(req, that) {
    utils.tick(function () {
        var emailId = that.getPluginHelper().getPostParam(req, "email"),
            gravatar = require('gravatar'),
            sessionUser = req.session.user,
            userId, profilePic = sessionUser.profilePic || {}, hash;
        async.series([
                function (n) {
                    //get user
                    dbAction.get("findByEmailId", emailId, function (err, m) {
                        if (m && m.userId) {
                            userId = m.userId;
                        }
                        n(err);
                    });
                },
                function (n) {
                    //checking  gravatar url
                    var url = gravatar.url(emailId);
                    hash = url.split("/").pop();
                    n(null);
                },
                function (n) {
                    //saving gravatar hash
                    profilePic.gravatar = hash;
                    profilePic.uploaded = false;
                    dbAction.update({
                        userId: userId,
                        profilePic: profilePic
                    }, n);
                }
            ],
            function (err, results) {
                if (!err) {
                    sessionUser.profilePic = profilePic;
                }

            })

    });
}

var oauthRegister = function (req, res, next) {
    var that = this,
        UserService = that.getService(USER_SCHEMA), dbUser,
        email = that.getPluginHelper().getPostParam(req, "email"),
        hasFormError;
    req.params.action = "registerOAuthUser";

    //get user form email typed by user
    UserService.getByEmailId(email, function (err, u) {
        if (err) {
            return next(err);
        }
        if (u) {
            dbUser = u.toObject();
            that.registerOAuthUserAction(req);
        }
        else {
            async.series([
                function (n) {
                    //validate the form for new user
                    var formObj = utils.clone(loginForms.OAuthRegisterForm);
                    that.ValidateForm(req, formObj, function (err, result) {
                        if (result.hasErrors) {
                            that.setErrorMessage(req, "complete-your-profile");
                            req.attrs.validationResult = result;

                            //create dynamic form
                            var OAuthRegisterForm = that.getFormBuilder().DynamicForm(req, formObj, "en_US");
                            req.attrs.OAuthRegisterForm = OAuthRegisterForm;

                            if (!err) {
                                hasFormError = true;
                            }
                            err = err || new Error("Invalid form data");
                        }

                        n(err, result);
                    });
                },
                function (n) {
                    //update if dbUser exists else save a new user
                    var userRole = require(utils.getLibPath() + "/permissions/Roles").getUserRole();
                    var oAuthUser = getUserInfoFromOAuthUser(req),
                        oAuthInfo = {};
                    oAuthInfo[oAuthUser.provider] = req.session.oAuthUser;

                    UserService.save({
                        emailId: email,
                        firstName: oAuthUser.firstName,
                        lastName: oAuthUser.lastName,
                        roles: [userRole.roleId ],
                        oauthInfo: oAuthInfo
                    }, n)
                },
                function (n) {
                    //get current saved user from db
                    UserService.getByEmailId(email, function (err, u) {
                        if (u) {
                            dbUser = u.toObject();
                        }
                        n(err, true);
                    });
                },
                function (n) {
                    if (dbUser) {
                        getGravatar(req, that);
                        LoginUtil.regenerateSession(dbUser, req, function () {
                            n(null, true);
                        });
                    }
                }
            ], function (err, result) {
                if (!err && dbUser) {
                    oauthSuccessRedirect(req, dbUser, next, err, res);
                }
                if (hasFormError) {
                    //to show validation form error
                    err = null;
                }
                next(err);

            });
        }

    });


};

var doRegister = function (req, res, next) {
    var that = this, formObj = loginForms.RegisterForm;
    that.ValidateForm(req, formObj, function (err, result) {
        if (err) {
            return next(err);
        }
        if (!result.hasErrors) { // this means data is valid
            var postParams = that.getPluginHelper().getPostParams(req);
            PasswordUtil.encrypt(postParams.password, function (err, hash) {
                if (err) {
                    return next(err);
                }
                var userRole = require(utils.getLibPath() + "/permissions/Roles").getUserRole();
                that.getService(USER_SCHEMA).populateModelAndSave(postParams, {roles: [userRole.roleId ],
                        passwordEnc: hash}, {emailId: "email"},
                    function (err) {
                        loginProcess(req, res, next, postParams)(err);
                        getGravatar(req, that);
                    }
                );
            });
        }
        else {
            that.setErrorMessage(req, "entered-invalid-data");
            req.params.action = "doRegister";
            req.attrs.validationResult = result;
            next(err);
        }

    });

};

function oAuthCallbackAction(req, res, next) {
    var that = this, params = req.params, account = params.account;
    PassportUtil.oAuthCallbackAction(account, req, res);
}

function oAuthLoginAction(req, res, next) {
    var that = this, params = req.params, account = params.account;
    req.session.redirect = req.query.redirect;
    PassportUtil.startOAuthAction(account, req, res);
}

var doLoginAction = function (req, res, next) {
    var formObj = loginForms.LoginForm;
    var that = this;

    that.ValidateForm(req, formObj, function (err, result) {
        if (err) {
            return next(err);
        }
        if (!result.hasErrors) { // this means data is valid
            // POST Actions
            var params = that.parseParams(req);
            loginProcess(req, res, next, params.post)();
        }
        else {
            that.setErrorMessage(req, "entered-invalid-data");
            next(err);
        }
    });
};

function getUserInfoFromOAuthUser(req) {
    var oAuthUser = req.session.oAuthUser;
    if (oAuthUser) {
        var provider = oAuthUser.provider,
            email = oAuthUser.emails && oAuthUser.emails[0].value,
            userName = oAuthUser.userName || (email && email.split("@")[0]),
            name = oAuthUser.name,
            firstName = name && name.givenName || "",
            lastName = name && name.familyName || "";

        if (!firstName || !lastName) {
            var split = oAuthUser.displayName.split(" ");
            firstName = split[0];
            lastName = split[split.length - 1];
        }

        return {
            email: email,
            userName: userName,
            firstName: firstName,
            lastName: lastName,
            provider: provider
        };

    }
}

function oauthSuccessRedirect(req, dbUser, next, err, res) {
    var redirect = req.session.redirect || LoginUtil.getRedirect(req);
    LoginUtil.regenerateSession(dbUser, req, function () {

        req.attrs.redirect = redirect;
        next(err);
    });
}
LoginController.prototype.registerOAuthUserAction = function (req, res, next) {
    var that = this, UserService = that.getService(USER_SCHEMA);

    var oAuthUser = getUserInfoFromOAuthUser(req);
    if (oAuthUser) {
        var email = oAuthUser.email || that.getPluginHelper().getPostParam(req, "email"), provider = oAuthUser.provider;
        delete oAuthUser.provider;

        req.query[that.getPluginId()] = oAuthUser;
        var dbUser;
        async.series([
            function (n) {
                //get user by email
                if (email) {
                    UserService.getByEmailId(email, function (err, u) {
                        if (u) {
                            dbUser = u.toObject();
                        }
                        n(err, true);
                    });
                }
                else {
                    n(null, true);
                }
            },
            function (n) {
                Debug._li("> ", dbUser, true)
                if (dbUser) {
                    //update oauth data to user collection
                    var oauthInfo = dbUser.oauthInfo || {};
                    oauthInfo[provider] = req.session.oAuthUser;
                    UserService.update({
                        userId: dbUser.userId,
                        oauthInfo: oauthInfo
                    }, n);
                }
                else {
                    //validate data with form so that form can be rendered in edit mode
                    var formObj = utils.clone(loginForms.OAuthRegisterForm);
                    that.ValidateForm(req, formObj, function (err, result) {
                        if (err) {
                            return n(err);
                        }
                        if (result.hasErrors) {
                            that.setErrorMessage(req, "complete-your-profile");
                            req.attrs.validationResult = result;
                        }
                        //create dynamic form
                        var OAuthRegisterForm = that.getFormBuilder().DynamicForm(req, formObj, "en_US");
                        req.attrs.OAuthRegisterForm = OAuthRegisterForm;

                        n(null, true);
                    });
                }
            }
        ], function (err, result) {
            if (!err && dbUser) {
                oauthSuccessRedirect(req, dbUser, next, err, res);
            } else {
                next(err);
            }

        });
    }
    else {
        next(new Error("Invalid oauth session"), req, res);
    }
};

LoginController.prototype.render = function (req, res, next) {
    var params = this.parseParams(req);
    var page = 0;
    var view = "index";
    var ret = {};

    if (params.params.action === "registerOAuthUser") {
        view = params.params.action
    }
    else {
        var DynamicForm = this.getFormBuilder().DynamicForm;

        if (!req.session.loggedIn) {
            if (params.params && (params.params.action === "register" || params.params.action === "Update" || params.params.action === "doRegister")) {
                view = "register";
                page = 1;
                var formObj = utils.clone(loginForms.RegisterForm);
                ret.registerForm = DynamicForm(req, formObj, "en_US");
            }
            if (page === 0) {
                var formObj = utils.clone(loginForms.LoginForm);
                ret.loginForm = DynamicForm(req, formObj, "en_US", null, true);
            }
        }
    }

    req.pluginRender.setView(view).setLocals(ret);

    next(null);
};

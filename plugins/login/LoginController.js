/**
 *
 */
var util = require("util");
var BasePluginController = require(process.cwd() + "/lib/BasePluginController"),
    PasswordUtil = require(process.cwd() + "/lib/PasswordUtil"),
    LoginUtil = require(process.cwd() + "/lib/login/LoginUtil");
var loginForms = require("./loginForms"), USER_SCHEMA = "User";
var gravatar = require('gravatar');

var LoginController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route: '/:action' // by this route /home/login/login, /home/login/register is called. Generic one
        });
        that.post({
            route: '/doLogin',
            action: doLoginAction
        });
        that.post({
            route: '/doRegister',
            action: doRegister
        });

        that.addCustomValidations(loginForms.customValidations);
    });
};

util.inherits(LoginController, BasePluginController);

function loginProcess(req, res, next, post) {
    return function (err) {
        if (err) {
            next(err, req, res);
        }
        LoginUtil.processLogin(req, res, post, next);
    }
}

function getGravatar(req, that) {
    utils.tick(function () {
        var emailId = that.getPluginHelper().getPostParam(req, "email"),
            gravatar = require('gravatar'),
            DBActions = that.getDBActionsLib(),
            dbAction = DBActions.getInstance(req, USER_SCHEMA),
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

    })
}
var doRegister = function (req, res, next) {
    var that = this, formObj = loginForms.RegisterForm;
    that.ValidateForm(req, formObj, function (err, result) {
        if (err) {
            return next(err, req, res);
        }
        if (!result.hasErrors) { // this means data is valid
            var postParams = that.getPluginHelper().getPostParams(req);
            PasswordUtil.encrypt(postParams.password, function (err, hash) {
                if (err) {
                    return next(err, req, res);
                }
                var userRole = require(utils.getLibPath() + "/permissions/Roles").getUserRole();
                that.getDBActionsLib().populateModelAndSave(req, USER_SCHEMA, {roles: [userRole.roleId ],
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
            next(err, req, res);
        }
    });

};

var doLoginAction = function (req, res, next) {
    var formObj = loginForms.LoginForm;
    var that = this;

    that.ValidateForm(req, formObj, function (err, result) {
        if (err) {
            return next(err, req, res);
        }
        if (!result.hasErrors) { // this means data is valid
            // POST Actions
            var params = that.parseParams(req);
            loginProcess(req, res, next, params.post)();
        }
        else {
            that.setErrorMessage(req, "entered-invalid-data");
            next(err, req, res);
        }
    });
};

LoginController.prototype.render = function (req, res, next) {
    var params = this.parseParams(req);
    var page = 0;
    var view = "index";
    var ret = {

    };

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
            ret.loginForm = DynamicForm(req, formObj, "en_US");
        }
    }
    next(null, [ view, ret ]);
};

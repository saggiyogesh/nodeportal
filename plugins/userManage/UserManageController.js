/***
 * plugin to manage users
 */
var BasePluginController = require(process.cwd() + "/lib/BasePluginController.js");
var settingsPageURL = require(process.cwd() + "/lib/AppProperties").get("SETTINGS_PAGE_URL");

var forms = require("./forms.js"), USER_SCHEMA = "User";
var UserManageController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route:'/view'
//            , action:viewUserProfileAction
        });
        that.post({
            route:'/updateProfile',
            action:updateUserProfileAction
        });
    });
};

util.inherits(UserManageController, BasePluginController);

function updateUserProfileAction(req, res, next) {
    var formObj = forms.ProfileForm, that = this;

    that.ValidateForm(req, formObj, function (err, result) {
        if (err) {
            next(err, req, res);
            return;
        }
        if (!result.hasErrors) {
            var redirect = that.getPluginHelper().getPostParam(req, "redirect"),
                dbAction = that.getDBActionsLib().getInstance(req, USER_SCHEMA);
            that.getDBActionsLib().populateModelAndUpdate(req, USER_SCHEMA, {}, {emailId:"email"}, function (err, result) {
                if (err) {
                    return next(err, req, res);
                }
                dbAction.get("findByEmailId", req.session.user.emailId, function (err, user) {
                    if (user) {
                        req.session.user = user;
                    }
                    that.setRedirect(req, redirect);
                    next(err, req, res);
                });
            });
        }
        else {
            that.setErrorMessage(req, "entered-invalid-data");
            next(err, req, res);
        }
    });

}


UserManageController.prototype.render = function (req, res, next) {
    var view = "view";
    var ret = {};
    req.query[this.getPluginId()] = utils.cloneExtend(req.session.user, {redirect:settingsPageURL, email:req.session.user.emailId });

    ret.profileForm = this.getFormBuilder().DynamicForm(req, forms.ProfileForm, "en_US", "add");
    next(null, [ view, ret ]);
};

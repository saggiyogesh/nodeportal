/***
 * plugin to manage users
 */
var BasePluginController = require(process.cwd() + "/lib/BasePluginController.js");

var forms = require("./forms.js");
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
            var redirect = that.getPluginHelper().getPostParam(req, "redirect");
            that.getDBActionsLib().authorizedPopulateModelAndUpdate(req, "User", {}, {emailId:"email"}, function (err, user) {
                that.setRedirect(req, redirect);
                req.session.user = user;
                next(err, req, res);
            });
        }
        else {
            this.setErrorMessage(req, "entered-invalid-data");
            next(err, req, res);
        }
    });

}


UserManageController.prototype.render = function (req, res, next) {
    var view = "view";
    var ret = {};
    req.query[this.getPluginId()] = utils.cloneExtend(req.session.user, {redirect:"/settings", email:req.session.user.emailId });

    ret.profileForm = this.getFormBuilder().DynamicForm(req, forms.ProfileForm, "en_US", "add");
    next(null, [ view, ret ]);
};

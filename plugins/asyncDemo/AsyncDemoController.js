/***
 * plugin to manage pages
 */
var BasePluginController = require(process.cwd() + "/lib/BasePluginController.js");

//var forms = require("./forms");
var AsyncDemoController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route:'/:action1'
//            , action:viewUserProfileAction
        });
//        that.post({
//            route:'/updateProfile',
//            action:updateUserProfileAction
//        });
    });
};

util.inherits(AsyncDemoController, BasePluginController);


AsyncDemoController.prototype.render = function (req, res) {
    var view = req.params.action1;
    view = view || "view";
    var ret = {
        name:"asyncDemo",
        req:req
    };
    return [ view, ret ];
};
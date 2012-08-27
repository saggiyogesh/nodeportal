/***
 * Handles the errors in app. Used for displaying them
 */

var BasePluginController = require(process.cwd() + "/lib/BasePluginController.js");
var getProp = require(process.cwd() + "/lib/AppProperties").get;
var Debug = global.Debug;
var getMsg = require(process.cwd() + "/lib/i18n").get;

var ErrorController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
};

util.inherits(ErrorController, BasePluginController);

ErrorController.prototype.render = function (req, res, next) {
    var view = "index";
    var ret = {

    };

    this.setErrorMessage(req, getMsg({key:req.attrs.errorMsgKey}));

    next(null, [ view, ret ]);
};


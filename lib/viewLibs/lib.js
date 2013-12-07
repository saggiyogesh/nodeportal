/**
 * helper lib to be used as fn's in jade
 */

var Messages = require("../Helpers").Messages;
var URLCreator = require("../URLCreator"), PluginHelper = require("../PluginHelper");

/*function getPluginIdAndIId(req){
 return req.params.iId ?  req.params.plugin + "_" + req.params.iId : req.params.plugin;
 }*/

exports.getURL = function (req, action, isIncludeQuery) {
    var url = URLCreator.createURL(isIncludeQuery ? req.query : {}).setNamespace(PluginHelper.getNamespace(req)).
        setPageFriendlyURL(req.params.page).setAction(action);

    return url.toString();
};

exports.createURL = function (req, params) {
    var pluginId = req.params.plugin, page = req.params.page,
        url = URLCreator.createURL().setAction(params.route).setNamespace(PluginHelper.getNamespace(req))
            .setPageFriendlyURL(page);
    if (params && params.mode && params.mode === "maximized") {
        url.setParameters({"mode":"maximized"});
    }
    return url.toString();
};

exports.getParamName = function (req, name) {
    var str = req.params.plugin;
    if (req.params.iId) {
        str += "_" + req.params.iId;
    }
    str += "[" + name + "]";
    return str;
};

exports.Messages = Messages;

exports.PermissionValidator = require('../permissions/PermissionValidator');
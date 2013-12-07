var BasePluginController = require(process.cwd() + "/lib/BasePluginController.js");

var ManageRolePluginController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
};

util.inherits(ManageRolePluginController, BasePluginController);
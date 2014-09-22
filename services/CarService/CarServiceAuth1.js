// this file is autogenerated
var CarBaseService = require("./CarBaseService"),
    _ = require("underscore"),
    util = require("util");

var modelName = CarBaseService.definition.name;

var PermissionValidator = require(utils.getLibPath() + "/permissions/PermissionValidator");

function Auth(req, permissionSchemaKey, modelName) {
    PermissionValidator.call(this, req, permissionSchemaKey, modelName);
    this.req = req;
    this.modelName = modelName;
    this.queryHook = req.app.dataSource.queryHook;
}

util.inherits(Auth, PermissionValidator);

//auth methods
Auth.prototype.findOne = function findOneAuth(query, next) {
    var that = this;
    that.hasPermission(that.VIEW, function (err, perm) {
        if (perm && perm.isAuthorized === true) {

            CarBaseService.findOne(query, next)
        }
        else {
            next(err);
        }
    });

};

Auth.prototype.getPagesByThemeId = function getCarsByModelAuth(themeId, next) {
    var that = this;
    var filter ={where: {themeId: themeId}, order: "themeId ASC" }; //autogenerated from js configs

    this.queryHook.authorizedFind(this.req, modelName, filter, next);


};


module.exports = Auth;
// this file is autogenerated
var CarBaseService = require("./CarBaseService"),
//    _ = require("underscore"),
//    util = require("util"),
//    extend = util._extend,
    PermissionActions = require(utils.getLibPath() + "/permissions").PermissionActions;

var modelName = CarBaseService.definition.name;


function CarServiceAuth() {
}

CarServiceAuth.count = function countAuth(where, roles, next) {
    CarBaseService.getDataSource().queryHook.authorizedCount(roles, modelName, where, next);
};

CarServiceAuth.findOne = function findOneAuth(query, pv, next) {
    pv.hasPermission(PermissionActions.VIEW, function (err, perm) {
        (perm && perm.isAuthorized === true) ? CarBaseService.findOne(query, next) : next(err);
    });
};

CarServiceAuth.find = function findAuth(query, roles, next) {
    CarBaseService.getDataSource().queryHook.authorizedFind(roles, modelName, query, next);
};

CarServiceAuth.getPagesByThemeId = function getPagesByThemeIdAuth(themeId, roles, next) {
    var query = {where: {themeId: themeId}, order: "themeId ASC" }; //autogenerated from js configs
    this.find(query, roles, next);
};

CarServiceAuth.create = function createAuth(data, pv, next) {
    pv.hasPermissionWithoutModelId(PermissionActions.ADD, function (err, perm) {
        (perm && perm.isAuthorized === true) ? CarBaseService.create(query, next) : next(err);
    });
};

CarServiceAuth.deleteById = function deleteByIdAuth(id, pv, next) {
    pv.hasPermission(PermissionActions.DELETE, id, function (err, perm) {
        (perm && perm.isAuthorized === true) ? CarBaseService.deleteById(id, next) : next(err);
    });
};

CarServiceAuth.updateById = function updateByIdAuth(id, data, pv, next) {
    pv.hasPermission(PermissionActions.UPDATE, function (err, perm) {
        (perm && perm.isAuthorized === true) ? CarBaseService.updateById(id, data, next) : next(err);
    });
};


module.exports = CarServiceAuth;
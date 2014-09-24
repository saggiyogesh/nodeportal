// this file is autogenerated
var ResourceBaseService = require("./ResourceBaseService"),
    PermissionActions = require(utils.getLibPath() + "/permissions").PermissionActions;

var modelName = ResourceBaseService.definition.name;


function ResourceServiceAuth() {
}

ResourceServiceAuth.create = function createAuth(data, pv, next) {
    pv.hasPermissionWithoutModelId(PermissionActions.ADD, function (err, perm) {
        (perm && perm.isAuthorized === true) ? ResourceBaseService.create(query, next) : next(err);
    });
};

ResourceServiceAuth.update = function updateAuth(data, pv, next) {
    pv.hasPermission(PermissionActions.UPDATE, function (err, perm) {
        (perm && perm.isAuthorized === true) ? ResourceBaseService.update(data, next) : next(err);
    });
};

ResourceServiceAuth.remove = function removeAuth(pkValue, pv, next) {
    pv.hasPermission(PermissionActions.DELETE, function (err, perm) {
        (perm && perm.isAuthorized === true) ? ResourceBaseService.remove(pkValue, next) : next(err);
    });
};

ResourceServiceAuth.findById = function findByIdAuth(pkValue, pv, next) {
    pv.hasPermission(PermissionActions.VIEW, pkValue, function (err, perm) {
        (perm && perm.isAuthorized === true) ? ResourceBaseService.findById(pkValue, next) : next(err);
    });
};

ResourceServiceAuth.deleteById = function deleteByIdAuth(pkValue, pv, next) {
    pv.hasPermission(PermissionActions.DELETE, pkValue, function (err, perm) {
        (perm && perm.isAuthorized === true) ? ResourceBaseService.deleteById(pkValue, next) : next(err);
    });
};

ResourceServiceAuth.updateById = function updateByIdAuth(pkValue, data, pv, next) {
    pv.hasPermission(PermissionActions.UPDATE, pkValue, function (err, perm) {
        (perm && perm.isAuthorized === true) ? ResourceBaseService.updateById(pkValue, data, next) : next(err);
    });
};

ResourceServiceAuth.find = function findAuth(query, roles, next) {
    ResourceBaseService.getDataSource().queryHook.authorizedFind(roles, modelName, query, next);
};
ResourceServiceAuth.count = function countAuth(where, roles, next) {
    ResourceBaseService.getDataSource().queryHook.authorizedCount(roles, modelName, where, next);
};

ResourceServiceAuth.findOne = function findOneAuth(query, roles, next) {
    this.find(query, roles, function (err, models) {
        next(err, (!err && models && models.length > 0) && models[0]);
    });
};



//finders implementation
ResourceServiceAuth.getByNameAndFolderId = function getByNameAndFolderIdAuth(name,folderId, roles, next) {
    this.find({"where":{"name":name,"folderId":folderId}}, roles, next); //autogenerated from js configs
};


ResourceServiceAuth.getByFolderId = function getByFolderIdAuth(folderId, roles, next) {
    this.find({"where":{"folderId":"folderId"}}, roles, next); //autogenerated from js configs
};




module.exports = ResourceServiceAuth;
//generated file
// not modified directly
var loopback = require("loopback"),
    DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-schema_permissions.js");

var SchemaPermissions = loopback.createModel(config);

DAOExtras(SchemaPermissions);

//create finders form finders property
SchemaPermissions.getByPermissionSchemaKey = function getByPermissionSchemaKey(permissionSchemaKey, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"permissionSchemaKey":permissionSchemaKey}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = SchemaPermissions;
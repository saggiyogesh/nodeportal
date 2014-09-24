//generated file
// not modified directly
var loopback = require("loopback"),
DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
config = require(utils.getRootPath() + "/services/modelConf/np-model-role.js");

var Role = loopback.createModel(config);

DAOExtras(Role);

//create finders form finders property
Role.getByName = function getByName(name, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"name":name}}, next);
};


Role.getByIdAndVersion = function getByIdAndVersion(id,version, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"id":id,"version":version}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = Role;
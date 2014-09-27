//generated file
// not modified directly
var loopback = require("loopback"),
    DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-role.js");

var Role = loopback.createModel(config);

DAOExtras(Role);

//create finders form finders property
Role.getGuestRole = function getGuestRole( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"name":"Guest"}}, next);
};


Role.getAdministratorRole = function getAdministratorRole( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"name":"Administrator"}}, next);
};


Role.getAll = function getAll( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({}, next);
};


Role.getByName = function getByName(name, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"name":name}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = Role;
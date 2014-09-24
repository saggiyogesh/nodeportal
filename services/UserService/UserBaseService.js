//generated file
// not modified directly
var loopback = require("loopback"),
DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
config = require(utils.getRootPath() + "/services/modelConf/np-model-user.js");

var User = loopback.createModel(config);

DAOExtras(User);

//create finders form finders property
User.getById = function getById(id, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"id":id}}, next);
};


User.getByIdAndVersion = function getByIdAndVersion(id,version, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"id":id,"version":version}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = User;
//generated file
// not modified directly
var loopback = require("loopback"),
    DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-resource.js");

var Resource = loopback.createModel(config);

DAOExtras(Resource);

//create finders form finders property
Resource.getByNameAndFolderId = function getByNameAndFolderId(name,folderId, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"name":name,"folderId":folderId}}, next);
};


Resource.getByFolderId = function getByFolderId(folderId, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"folderId":folderId}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = Resource;
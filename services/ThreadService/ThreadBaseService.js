//generated file
// not modified directly
var loopback = require("loopback"),
    DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-thread.js");

var Thread = loopback.createModel(config);

DAOExtras(Thread);

//create finders form finders property
Thread.getByLinkedModelIdAndLinkedModelName = function getByLinkedModelIdAndLinkedModelName(linkedModelId,linkedModelName, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"linkedModelId":linkedModelId,"linkedModelName":linkedModelName}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = Thread;
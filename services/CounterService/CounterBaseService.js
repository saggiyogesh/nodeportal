//generated file
// not modified directly
var loopback = require("loopback"),
DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
config = require(utils.getRootPath() + "/services/modelConf/np-model-counter.js");

var Counter = loopback.createModel(config);

DAOExtras(Counter);

//create finders form finders property



//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = Counter;
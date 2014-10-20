//generated file
// not modified directly
var loopback = require("loopback"),
    DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-layout.js");

var Layout = loopback.createModel(config);

DAOExtras(Layout);

//create finders form finders property
Layout.getDefault = function getDefault( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"name":"2-col-70-30"}}, next);
};


Layout.getOneCol = function getOneCol( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"name":"1-col"}}, next);
};


Layout.getByName = function getByName(name, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"name":name}}, next);
};


Layout.getAllExceptDefaults = function getAllExceptDefaults( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"and":[{"name":{"neq":"2-col-70-30"}},{"name":{"neq":"1-col"}}]}}, next);
};


Layout.getAll = function getAll( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = Layout;
//generated file
// not modified directly
var loopback = require("loopback"),
    DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-theme.js");

var Theme = loopback.createModel(config);

DAOExtras(Theme);

//create finders form finders property
Theme.getDefault = function getDefault( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"name":"Default","type":"page"}}, next);
};


Theme.getByName = function getByName(name, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"name":name,"type":"page"}}, next);
};


Theme.getAllExceptDefault = function getAllExceptDefault( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"name":{"neq":"Default"},"type":"page"}}, next);
};


Theme.getAll = function getAll( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({}, next);
};


Theme.getDefaultSettingsTheme = function getDefaultSettingsTheme( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"name":"Settings","type":"settings"}}, next);
};


Theme.getAllPageType = function getAllPageType( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"type":"page"}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = Theme;
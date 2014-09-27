//generated file
// not modified directly
var loopback = require("loopback"),
    DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-article_location.js");

var ArticleLocation = loopback.createModel(config);

DAOExtras(ArticleLocation);

//create finders form finders property
ArticleLocation.getById = function getById(id, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"id":id}}, next);
};


ArticleLocation.getByPageIdAndNamespace = function getByPageIdAndNamespace(pageId,namespace, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"pageId":pageId,"namespace":namespace}}, next);
};


ArticleLocation.getByPageIdAndNamespaceAndId = function getByPageIdAndNamespaceAndId(pageId,namespace,id, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"pageId":pageId,"namespace":namespace,"id":id}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = ArticleLocation;
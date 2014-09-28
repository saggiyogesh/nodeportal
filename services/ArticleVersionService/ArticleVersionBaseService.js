//generated file
// not modified directly
var loopback = require("loopback"),
    DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-article_version.js");

var ArticleVersion = loopback.createModel(config);

DAOExtras(ArticleVersion);

//create finders form finders property
ArticleVersion.getById = function getById(id, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"id":id}}, next);
};


ArticleVersion.getByIdAndVersion = function getByIdAndVersion(id,version, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"id":id,"version":version}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = ArticleVersion;
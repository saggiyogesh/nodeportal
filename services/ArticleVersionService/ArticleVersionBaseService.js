//generated file
// not modified directly
var loopback = require("loopback"),
    DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-article_version.js");

var ArticleVersion = loopback.createModel(config);

DAOExtras(ArticleVersion);

//create finders form finders property



//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = ArticleVersion;
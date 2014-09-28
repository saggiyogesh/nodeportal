//generated file
// not modified directly
var loopback = require("loopback"),
    DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-article.js");

var Article = loopback.createModel(config);

DAOExtras(Article);

//create finders form finders property
Article.getById = function getById(id, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"id":id}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = Article;
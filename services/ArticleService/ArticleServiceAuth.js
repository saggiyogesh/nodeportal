// this file is autogenerated
var ArticleBaseService = require("./ArticleBaseService"),
    PermissionActions = require(utils.getLibPath() + "/permissions").PermissionActions,
    AuthDAOExtras = require(utils.getLibPath() + "/ServicesHelper/AuthDAOExtras");

var modelName = ArticleBaseService.definition.name;


function ArticleServiceAuth() {
}
ArticleServiceAuth.baseService = ArticleBaseService;
AuthDAOExtras(ArticleServiceAuth);


//finders implementation
ArticleServiceAuth.getById = function getByIdAuth(id, roles, next) {
    this.findOne({"where":{"id":id}}, roles, next); //autogenerated from js configs
};


ArticleServiceAuth.getByIdAndVersion = function getByIdAndVersionAuth(id,version, roles, next) {
    this.findOne({"where":{"id":id,"version":version}}, roles, next); //autogenerated from js configs
};




module.exports = ArticleServiceAuth;
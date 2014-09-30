//main service file to be called & used
//custom methods should be written here
// this file is created initially and extending the BaseService Class
// on updating model conf file this file will not generate again

var ArticleBaseService = require("./ArticleBaseService");


var ArticleServiceAuth = require("./ArticleServiceAuth");

ArticleBaseService.Auth = ArticleServiceAuth;

var DateUtil = require(utils.getLibPath() + "/Utils/DateUtil");

var ArticleVersionService = ArticleBaseService.getService("ArticleVersion");


ArticleBaseService.ArticleNotFoundError = ArticleNotFoundError;

function ArticleNotFoundError(id, idName) {
    idName = idName || "id";
    this.name = "ArticleNotFoundError";
    this.message = "Article not found in with " + idName + ": " + id;
    this.localizedMessageKey = "article-not-found-error";
}
util.inherits(ArticleNotFoundError, Error);

//Custom methods

/**
 * Override generated method and throw ArticleNotFoundError
 *
 * @param id
 * @param roles
 * @param next
 */
ArticleServiceAuth.getById = function getByIdAuth(id, roles, next) {
    ArticleServiceAuth.findOne({"where": {"id": id}}, roles, function (err, article) {
        if (!article) {
            err = new ArticleNotFoundError(id);
        }
        next(err, article);
    });
};


ArticleServiceAuth.getArticleVersions = function (id, roles, next) {
    var json = [];
    async.waterfall([
        function (n) {
            ArticleServiceAuth.getById(id, roles, n);
        },
        function (art, n) {
            json.push([art.version, DateUtil.formatArticleDate(art.createDate)]);
            ArticleVersionService.getById(id, n);

        },
        function (versions, n) {
            if (versions) {
                versions.forEach(function (version) {
                    json.push([version.version, DateUtil.formatArticleDate(version.createDate)])
                });
            }
            n({"values": json});
        }
    ], next);

};


module.exports = ArticleBaseService;



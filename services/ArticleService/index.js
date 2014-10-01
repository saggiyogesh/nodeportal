//main service file to be called & used
//custom methods should be written here
// this file is created initially and extending the BaseService Class
// on updating model conf file this file will not generate again

var ArticleBaseService = require("./ArticleBaseService");


var ArticleServiceAuth = require("./ArticleServiceAuth");

ArticleBaseService.Auth = ArticleServiceAuth;

var DateUtil = require(utils.getLibPath() + "/Utils/DateUtil"),
    PermissionValidator = require(utils.getLibPath() + "/permissions/PermissionValidator");

var ArticleVersionService = ArticleBaseService.getService("ArticleVersion"),
    ArticleLocationService = ArticleBaseService.getService("ArticleLocation");


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
 *
 * @param id
 * @param [version]
 * @param req
 * @param next
 */
ArticleServiceAuth.getByIdAndVersion = function getByIdAndVersionAuth(id, version, req, next) {
    if (isNaN(id)) {
        // err invalid id
        return next(new ArticleNotFoundError(id));
    }

    if (id && !version) {
        ArticleServiceAuth.getById(id, req.session.roles, function (err, article) {
            if (!article) {
                err = new ArticleNotFoundError(id);
            }
            next(err, article);
        });
    }
    else {
        async.waterfall([
            function (n) {
                ArticleBaseService.getByIdAndVersion(id, version, n); //latest article
            },
            function (article, n) {
                if (article) {
                    //check article view permission
                    var pv = new PermissionValidator(req, "model.articleSchema.Article", "Article");
                    pv.hasPermission("VIEW", article.articleId, function (err, perm) {
                        n(err, (perm && perm.isAuthorized && article));
                    });
                }
                else {
                    //check for version in Article Version
                    ArticleVersionService.getByIdAndVersion(id, version, n);
                }
            } ,
            function (article, n) {
                var err;
                if (!article) {
                    err = new ArticleNotFoundError(id + ", version: " + version);
                }
                n(err, article);
            }
        ], next);
    }
};


ArticleServiceAuth.getArticleVersions = function getArticleVersionsAuth(id, roles, next) {
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

/**
 * Deletes article, its versions & locations entries.
 * @param id {Number} id of article
 * @param roles {Array} user roles
 * @param next {Function} callback. parameters are err & result
 *              result exists if article is deleted
 */
ArticleServiceAuth.removeArticleById = function removeArticleByIdAuth(id, roles, next) {
    async.waterfall([
        function (n) {
            ArticleServiceAuth.remove({id: id}, roles, n);
        },
        function (result, n) {
            //remove all article versions, if article is deleted
            result && ArticleVersionService.destroyAll({id: id}, function (err) {
                n(err, !err && result);
            });
            n(result);
        } ,
        function (result, n) {
            // remove all article locations
            result && ArticleLocationService.removeArticleLocationsById(id, function (err) {
                n(err, !err && result);
            });
            n(result);
        }
    ], next);
};


module.exports = ArticleBaseService;



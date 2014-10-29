//main service file to be called & used
//custom methods should be written here
// this file is created initially and extending the BaseService Class
// on updating model conf file this file will not generate again

var ArticleBaseService = require("./ArticleBaseService");


var ArticleServiceAuth = require("./ArticleServiceAuth");

ArticleBaseService.Auth = ArticleServiceAuth;

var DateUtil = require(utils.getLibPath() + "/Utils/DateUtil"),
    PermissionValidator = require(utils.getLibPath() + "/permissions/PermissionValidator"),
    PluginHelper = require(utils.getLibPath() + "/PluginHelper");


ArticleBaseService.ArticleNotFoundError = ArticleNotFoundError;

function ArticleNotFoundError(id, idName) {
    idName = idName || "id";
    this.name = "ArticleNotFoundError";
    this.message = "Article not found in with " + idName + ": " + id;
    this.localizedMessageKey = "article-not-found-error";
}
util.inherits(ArticleNotFoundError, Error);

//Custom methods

function incrementVersion(version) {
    return (parseInt(version) + 1);
}

/**
 *
 * @param id
 * @param [version]
 * @param req
 * @param next
 */
ArticleServiceAuth.getByIdAndVersion = function getByIdAndVersionAuth(id, version, req, next) {
    var ArticleVersionService = ArticleBaseService.getService("ArticleVersion");

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
    var ArticleVersionService = ArticleBaseService.getService("ArticleVersion");

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
            n(null, {"values": json});
        }
    ], next);

};

/**
 * Deletes article, its versions & locations entries.
 * @param id {Number} id of article
 * @param req {Object} req
 * @param next {Function} callback. parameters are err & result
 *              result exists if article is deleted
 */
ArticleServiceAuth.removeArticleById = function removeArticleByIdAuth(id, req, next) {
    var ArticleVersionService = ArticleBaseService.getService("ArticleVersion"),
        ArticleLocationService = ArticleBaseService.getService("ArticleLocation");

    var pv = new PermissionValidator(req, "model.articleSchema.Article", "Article");

    async.waterfall([
        function (n) {
            ArticleBaseService.getById(id, n);
        },
        function (article, n) {
            article ? ArticleServiceAuth.deleteById(article.articleId, pv, n)
                : n(new ArticleNotFoundError(id));
        },
        function (result, n) {
            //remove all article versions, if article is deleted
            result && ArticleVersionService.destroyAll({id: id}, function (err) { //not fire delete model event
                n(err, !err && result);
            });
            !result && n(new Error("Error occurred while deleting article id: " + id));
        },
        function (result, n) {
            // remove all article locations
            result && ArticleLocationService.destroyAll({id: id}, function (err) { //not fire delete model event
                n(err, !err && result);
            });
            !result && n(new Error("Error occurred while deleting article version id: " + id));
        }
    ], next);
};

ArticleServiceAuth.saveArticle = function saveArticleAuth(req, otherValues, keyMapObj, next) {
    var post = PluginHelper.getPostParams(req);
    var pv = new PermissionValidator(req, "model.articleSchema", "Article");
    delete post[ArticleBaseService.getIdName()]; //delete primary key

    !post.displayDate && delete post.displayDate;
    !post.expiryDate && delete post.expiryDate;

    async.waterfall([
        function (n) {
            ArticleBaseService.incrementCounter(n);
        },
        function (c, n) {
            post.id = post.id || c; //when updateArticle call saveArticle, it already has id
            n();
        } ,
        function (n) {
            ArticleServiceAuth.populateModelAndSave(post,
                otherValues, keyMapObj, pv, n);

        }
    ], next);
};

ArticleServiceAuth.updateArticle = function updateArticleAuth(req, otherValues, keyMapObj, next) {
    var ArticleVersionService = ArticleBaseService.getService("ArticleVersion");

    //article is not updated, instead a new version is created.
    //current article is moved to article version & new article is saved with incremented version

    var post = PluginHelper.getPostParams(req);
    var id = post.id;
    async.waterfall([
        function (n) {
            ArticleBaseService.getById(id, n);
        },
        function (article, n) {
            if (article) {
                //current version copied to  article version
                delete article.articleId;
                Debug._li(">>", article, true)
                ArticleVersionService.save(article.toObject(), n);
            }
            else {
                n(new ArticleNotFoundError(id));
            }
        },
        function (result, n) {
            if (result) {
                // current article is removed
                ArticleBaseService.destroyAll({id: id}, n);
            }
            else {
                n(new ArticleNotFoundError(id));
            }
        },
        function (result, n) {
            if (result) {
                // save new article version

                // increment article version
                post.version = incrementVersion(post.version);
                ArticleServiceAuth.saveArticle(req, otherValues, keyMapObj, next);
            }
            else {
                n(new ArticleNotFoundError(id));
            }
        }
    ], next);
};


module.exports = ArticleBaseService;



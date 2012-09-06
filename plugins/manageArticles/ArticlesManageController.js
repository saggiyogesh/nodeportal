var BasePluginController = require(process.cwd() + "/lib/BasePluginController"),
    defaultView = require(process.cwd() + "/lib/articles/DefaultView")(),
    articleForms = require("./articleForms"),
    ARTICLE_SCHEMA = "Article", ARTICLE_VERSION_SCHEMA = "ArticleVersion",
    ArticleManager = require("./ArticleManager"),
    DEFAULT_VERSION = 1;

var ArticlesManageController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route:'/add', action:editArticleAction
        });
        that.get({
            route:'/edit/:id?', action:editArticleAction
        });
        that.get({
            route:'/remove/:id?', action:removeArticleAction
        });
        that.get({
            route:'/getArticles', action:getArticlesAction
        });
        that.get({
            route:'/getArticleVersions/:id?', action:getArticleVersions
        });
        that.get({
            route:'/preview/:id?/:version?', action:previewArticleAction
        });
        that.post({
            route:'/updateArticle', action:updateArticleAction
        });

    });
};

util.inherits(ArticlesManageController, BasePluginController);


function incrementVersion(version) {
    return (parseInt(version) + 1);
}

function getArticleVersions(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        id = params.id, ns = that.getNamespace(req), redirect = "/" + params.page + "/" + ns;
    var dbAction = DBActionsLib.getInstance(req, ARTICLE_SCHEMA),
        dbActionVersion = DBActionsLib.getInstance(req, ARTICLE_VERSION_SCHEMA);
    ArticleManager.getLatestArticleById(id, dbAction, function (err, latestArticle) {
        if (err) {
            return next(err, req, res);
        }
        var json = [];
        if (latestArticle) {
            json.push([latestArticle.version, latestArticle.createDate.toDateString()]);
            dbActionVersion.get("findById", id, function (err, articleVersions) {
                if (articleVersions) {
                    articleVersions.forEach(function (articleVersion) {
                        json.push([articleVersion.version, articleVersion.createDate.toDateString()])
                    });
                    that.setJSON(req, {"values":json});
                }
                next(err, req, res);
            });
        }
        else {
            that.setErrorMessage(req, "Wrong id.");
            that.setRedirect(req, redirect);
            return next(null, req, res);
        }
    });
}

var str;
function previewArticleAction(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), params = req.params,
        id = params.id, ns = that.getNamespace(req), version = params.version;

    var redirect = "/" + params.page + "/" + ns,
        setErrMsg = function () {
            that.setErrorMessage(req, "Wrong article Id");
            that.setRedirect(req, redirect);
        };
    if (id) {
        //check number validity of id
        if (isNaN(id)) {
            setErrMsg();
            return next(null, req, res);
        }
        if (version) {
            that.setErrorMessage(req, "Wrong article version number.");
            that.setRedirect(req, redirect);
            return next(null, req, res);
        }
        var dbAction = DBActionsLib.getInstance(req, ARTICLE_SCHEMA);
        ArticleManager.getLatestArticleById(id, dbAction, function (err, latestArticle) {
            if (err) {
                return next(err, req, res);
            }
            var html = defaultView({article:latestArticle, req:req});
            params.action = "preview";
            req.attrs.preview = html;
            return next(null, req, res);
        });
    }
    else {
        setErrMsg();
        return next(null, req, res);
    }
}

function removeArticleAction(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        idStr = params.id, ns = that.getNamespace(req);
    if (idStr) {
        var redirect = "/" + params.page + "/" + ns;
        var ids = idStr.split("~"),
            dbAction = DBActionsLib.getInstance(req, ARTICLE_SCHEMA),
            dbActionVersion = DBActionsLib.getInstance(req, ARTICLE_VERSION_SCHEMA);
        var AsyncIterator = that.AsyncIterator;
        var asycI = new AsyncIterator(ids, function (err, result) {
            if (!err && result) {
                that.setRedirect(req, redirect);
                that.setSuccessMessage(req, "Article(s) deleted successfully.");
            }
            next(err, req, res);
        });
        var asyncProcess = function () {
            var self = this, i = self.i, ids = self.vals;
            var query = dbAction.getQuery();
            query.where('id', ids[i]);
            dbAction.authorizedRemoveByQuery(query, function (err, result) {
                if (!err && result == 0) {
                    err = new that.PermissionError();
                }
                if (err) {
                    return asycI.next(err);
                }
                // remove versions
                //no need to check permissions as latest article already removed
                dbActionVersion.removeByQuery(dbActionVersion.getQuery().where('id', ids[i]), function (err, result) {
                    if (err)
                        Debug._l(err);
                    //Debug._l("Versions removed: " + result);
                });
                asycI.iterate();
            });
        };
        asycI.setAsyncProcess(asyncProcess);
    }
}

function getArticlesAction(req, res, next) {
    var that = this, dbAction = that.getDBActionsLib().getInstance(req, ARTICLE_SCHEMA),
        queryParams = req.query;
//    Debug._li("req, que: ", req.query, true);
    ArticleManager.getArticles(dbAction, queryParams, function (err, results) {
        var articles = results.data, count = results.count;
        if (!err && articles) {
//            Debug._l("ar len : " + articles.length);
//            Debug._l("ar cunrt : " + count);
            var aaData = [], ret = {
                "sEcho":queryParams["sEcho"],
                "iTotalRecords":count,
                "iTotalDisplayRecords":count,
                "aaData":aaData
            };

            articles.forEach(function (article) {
                var arr = [article.articleId, article.id, article.localizedTitle["en_US"],
                    article.createDate.toDateString(), article.displayDate.toDateString()];
                aaData.push(arr);
            });
            that.setJSON(req, ret);
        }
        next(err, req, res);
    });
}

function updateArticleAction(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        ns = that.getNamespace(req), PluginHelper = that.getPluginHelper();
//    params.action = "edit";

    that.ValidateForm(req, articleForms.ArticleEditForm, function (err, result) {
        if (err) {
            return next(err, req, res);
        }

        if (!result.hasErrors) {
            var post = PluginHelper.getPostParams(req),
                afterSave = function (err, article) {
                    if (err) {
                        return  next(err, req, res);
                    }
                    else {
                        var redirect = PluginHelper.getPostParam(req, "redirect");
                        that.setRedirect(req, redirect);
                        var msg = "Article " + (post.id ? "updated" : "added" ) + " successfully.";
                        that.setSuccessMessage(req, msg);
                        next(err, req, res);
                    }
                },
                save = function (id, version) {
                    DBActionsLib.authorizedPopulateModelAndSave(req, ARTICLE_SCHEMA, {
                            id:id,
                            localizedTitle:{en_US:PluginHelper.getPostParam(req, "title") },
                            localizedContent:{en_US:PluginHelper.getPostParam(req, "content") },
                            version:version
                        }, {},
                        afterSave);
                };

            if (!post.id) { //save, new article initial version
                DBActionsLib.DBActions.prototype.incrementCounter.call({db:db}, function (err, counter) {
                    if (err) {
                        return next(err);
                    }
                    save(counter.counter, DEFAULT_VERSION);
                });
            }
            else { // create new version with same id, but different articleId, move old version to Article_Version
                var id = PluginHelper.getPostParam(req, "id"),
                    version = PluginHelper.getPostParam(req, "version");
                version = incrementVersion(version);
                req.body[ns].version = version;
                ArticleManager.moveArticleToArticleVersion(id, DBActionsLib.getInstance(req, ARTICLE_SCHEMA),
                    DBActionsLib.getInstance(req, ARTICLE_VERSION_SCHEMA), function (err, result) {
                        if (err) {
                            return next(err);
                        }
                        if (result) {
                            save(id, version);
                        }
                    });
            }
        }
        else {
            that.setErrorMessage(req, "entered-invalid-data");
            req.attrs.articleForm = that.getFormBuilder().DynamicForm(req, articleForms.ArticleEditForm, "en_US");
            req.params.action = "edit";
            next(err, req, res);
        }
    });
}

function editArticleAction(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        id = params.id, ns = that.getNamespace(req);
    params.action = "edit";

    if (id) {
        //process edit

        var redirect = "/" + params.page + "/" + ns;
        //check number validity of id
        if (parseInt(id).toString() == "NaN") {
            that.setErrorMessage(req, "Wrong article Id");
            that.setRedirect(req, redirect);
            return next(null, req, res);
        }

        var dbAction = DBActionsLib.getInstance(req, ARTICLE_SCHEMA);
        ArticleManager.getLatestArticleById(id, dbAction, function (err, latestArticle) {
            if (err) {
                return next(err, req, res);
            }
            req.query[ns] = utils.cloneExtend(latestArticle, {redirect:redirect,
                title:latestArticle.localizedTitle["en_US"], content:latestArticle.localizedContent["en_US"] });
            params.action = "edit";
            req.attrs.articleForm = that.getFormBuilder().DynamicForm(req, articleForms.ArticleEditForm, "en_US", "add");
            next(err, req, res);
        });

    }
    else {
        req.query[ns] = {redirect:"/" + params.page + "/" + ns };
        req.attrs.articleForm = that.getFormBuilder().DynamicForm(req, articleForms.ArticleEditForm, "en_US", "add");
        next(null, req, res);
    }
}

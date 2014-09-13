var BasePluginController = require(process.cwd() + "/lib/BasePluginController"),
    defaultView = require(process.cwd() + "/lib/articles/DefaultView"),
    PermissionCache = require(process.cwd() + "/lib/permissions/Cache"),
    articleForms = require("./articleForms"),
    ARTICLE_SCHEMA = "Article", ARTICLE_VERSION_SCHEMA = "ArticleVersion",
    PLUGIN_INSTANCE_SCHEMA = "PluginInstance", ARTICLE_LOCATION_SCHEMA = "ArticleLocation",
    ARTICLE_PERMISSION_SCHEMA_ENTRY = "model.articleSchema.Article",
    ARTICLE_PERMISSION_SCHEMA = "model.articleSchema",
    ArticleManager = require("./ArticleManager"),
    DEFAULT_VERSION = 1;

var ArticlesManageController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route: '/add', action: editArticleAction
        });
        that.get({
            route: '/edit/:id?', action: editArticleAction
        });
        that.get({
            route: '/remove/:id?', action: removeArticleAction
        });
        that.get({
            route: '/getArticles', action: getArticlesAction
        });
        that.get({
            route: '/getArticleVersions/:id?', action: getArticleVersions
        });
        that.get({
            route: '/preview/:id?/:version?', action: previewArticleAction
        });
        that.post({
            route: '/updateArticle', action: updateArticleAction
        });


        that.getModelEvent(PLUGIN_INSTANCE_SCHEMA).handleUpdate(handleDisplayArticleSettingsUpdate, that);
        that.getModelEvent(PLUGIN_INSTANCE_SCHEMA).handleDelete(handleDisplayArticleRemove, that);
    });
};

util.inherits(ArticlesManageController, BasePluginController);

function handleDisplayArticleSettingsUpdate(event) {
    var schemaName = event.schemaName, modelId = event.modelId, modelData = event.modelData,
        that = this, app = that.getApp();
    var displayArticlePluginId = "displayArticle", ns = modelData.pluginNamespace;
    if (utils.contains(ns, displayArticlePluginId)) {
        var pageId = modelData.pageId, locations, id, articleId;
        var dbAction = that.getDBActionsLib().getInstanceFromDB(that.getDB(), ARTICLE_SCHEMA);
        var dbActionPlugin = that.getDBActionsLib().getInstanceFromDB(that.getDB(), PLUGIN_INSTANCE_SCHEMA);
        var dbActionAL = that.getDBActionsLib().getInstanceFromDB(that.getDB(), ARTICLE_LOCATION_SCHEMA);
        async.series([
            function (n) {
                //get plugin instance model
                dbActionPlugin.get("findByPluginInstanceId", modelData.pluginInstanceId, function (err, plugin) {
                    if (plugin) {
                        if (plugin.settings) {
                            id = plugin.settings.id;
                            Debug._l(">> " + id)
                        }
                    }
                    else {
                        err = err || new Error("Plugin not found by instanceId: " + modelData.pluginInstanceId);
                    }
                    n(err, true);
                });
            },
            function (n) {
                //get article
                dbAction.get("findById", id, function (err, art) {
                    if (art) {
                        Debug._l(">> " + art)

                        articleId = art.articleId;
//                        locations = getArticleLocations(art, pageId, ns);
                    } else {
                        err = err || new Error("Article Not Found id:" + id);
                    }
                    n(err, true);
                });
            },
            function (n) {
                //check for already configured model & remove it.
                var q = dbActionAL.getQuery(true);
                q.where("pageId", pageId).where("namespace", ns);
                dbActionAL.removeByQuery(q, n);
            },
            function (n) {
                dbActionAL.save({
                    namespace: ns,
                    pageId: pageId,
                    id: id
                }, n);
            }
        ], function (err, result) {
            Debug._l(err);
        });
    }

}

function handleDisplayArticleRemove(event) {
    var schemaName = event.schemaName, modelId = event.modelId, modelData = event.modelData,
        that = this, app = that.getApp();
    var displayArticlePluginId = "displayArticle", ns = modelData.pluginNamespace;
    Debug._l(">>> " + schemaName);
    if (utils.contains(ns, displayArticlePluginId)) {
        var pageId = modelData.pageId, locations, id, articleId;
        var dbActionAL = that.getDBActionsLib().getInstanceFromDB(that.getDB(), ARTICLE_LOCATION_SCHEMA);
        async.series([
            function (n) {
                //check for already configured model & remove it.
                var q = dbActionAL.getQuery(true);
                q.where("pageId", pageId).where("namespace", ns);
                dbActionAL.removeByQuery(q, n);
            }
        ], function (err, result) {
            Debug._l(err);
        });
    }

}

function incrementVersion(version) {
    return (parseInt(version) + 1);
}

function getArticleVersions(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        id = params.id, ns = that.getNamespace(req), redirect = "/" + params.page + "/" + ns;
    var dbAction = DBActionsLib.getAuthInstance(req, ARTICLE_SCHEMA, ARTICLE_PERMISSION_SCHEMA_ENTRY),
        dbActionVersion = DBActionsLib.getInstance(req, ARTICLE_VERSION_SCHEMA);
    ArticleManager.getLatestArticleById(id, dbAction, function (err, latestArticle) {
        if (err) {
            return next(err);
        }
        var json = [];
        if (latestArticle) {
            Debug._l(">> " + latestArticle.localizedTitle["en_US"] + " : " + that.DateUtil.formatArticleDate(latestArticle.createDate))
            json.push([latestArticle.version, that.DateUtil.formatArticleDate(latestArticle.createDate)]);
            dbActionVersion.get("findById", id, function (err, articleVersions) {
                if (articleVersions) {
                    articleVersions.forEach(function (articleVersion) {
                        json.push([articleVersion.version, that.DateUtil.formatArticleDate(articleVersion.createDate)])
                        Debug._l(">> " + articleVersion.localizedTitle["en_US"] + " : " + that.DateUtil.formatArticleDate(latestArticle.createDate))
                    });
                    Debug._li("", json)
                    that.setJSON(req, {"values": json});
                }
                next(err);
            });
        }
        else {
            that.setErrorMessage(req, "Wrong id.");
            that.setRedirect(req, redirect);
            return next(null, req, res);
        }
    });
}

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
            return next(null);
        }
        if (version) {
            that.setErrorMessage(req, "Wrong article version number.");
            that.setRedirect(req, redirect);
            return next(null);
        }
        var dbAction = DBActionsLib.getAuthInstance(req, ARTICLE_SCHEMA, ARTICLE_PERMISSION_SCHEMA_ENTRY);
        ArticleManager.getLatestArticleById(id, dbAction, function (err, latestArticle) {
            if (err) {
                return next(err);
            }
            if (!latestArticle) {
                return next(dbAction.getPermissionError("VIEW"), req, res);
            }
            defaultView({article: latestArticle, req: req}, function (err, html) {
                params.action = "preview";
                req.attrs.preview = html;
                next(null);
            });
        });
    }
    else {
        setErrMsg();
        return next(null);
    }
}

function removeArticleAction(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        idStr = params.id, ns = that.getNamespace(req);
    if (idStr) {
        var redirect = "/" + params.page + "/" + ns;
        var ids = idStr.split("~"),
            dbAction = DBActionsLib.getAuthInstance(req, ARTICLE_SCHEMA, ARTICLE_PERMISSION_SCHEMA_ENTRY),
            dbActionVersion = DBActionsLib.getInstance(req, ARTICLE_VERSION_SCHEMA),
            dbActionAL = that.getDBActionsLib().getInstanceFromDB(that.getDB(), ARTICLE_LOCATION_SCHEMA);

        var AsyncIterator = that.AsyncIterator;
        var asycI = new AsyncIterator(ids, function (err, result) {
            if (!err && result) {
                that.setRedirect(req, redirect);
                that.setSuccessMessage(req, "Article(s) deleted successfully.");
            }
            next(err);
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

                //delete article locations
                dbActionAL.get("findById", ids[i], function (err, models) {
                    if (models) {
                        var alIds = _.pluck(models, "articleLocationId");
                        dbActionAL.multipleRemove(alIds, function (err, r) {
                            if (err) {
                                Debug._l(err);
                            }
                        });
                    }
                });
                asycI.iterate();
            });
        };
        asycI.setAsyncProcess(asyncProcess);
    }
}

function getArticlesAction(req, res, next) {
    var that = this, dbAction = that.getDBActionsLib().getAuthInstance(req, ARTICLE_SCHEMA, ARTICLE_PERMISSION_SCHEMA_ENTRY),
        queryParams = req.query;
//    Debug._li("req, que: ", req.query, true);
    ArticleManager.getArticles(dbAction, queryParams, function (err, results) {
        var articles = results.data, count = results.count;
        if (!err && articles) {
//            Debug._l("ar len : " + articles.length);
//            Debug._l("ar cunrt : " + count);
            var aaData = [], ret = {
                "sEcho": queryParams["sEcho"],
                "iTotalRecords": count,
                "iTotalDisplayRecords": count,
                "aaData": aaData
            };

            articles.forEach(function (article) {
                var arr = [article.articleId, article.id, article.localizedTitle["en_US"],
                    that.DateUtil.formatArticleDate(article.createDate), that.DateUtil.formatArticleDate(article.displayDate)];
                aaData.push(arr);
            });
            that.setJSON(req, ret);
        }
        next(err);
    });
}

function updateArticleAction(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        ns = that.getNamespace(req), PluginHelper = that.getPluginHelper();
//    params.action = "edit";

    that.ValidateForm(req, articleForms.getArticleEditForm(), function (err, result) {
        if (err) {
            return next(err);
        }

        if (!result.hasErrors) {
            var post = PluginHelper.getPostParams(req),
                afterSave = function (err, article) {
                    if (err) {
                        return  next(err);
                    }
                    else {
                        var redirect = PluginHelper.getPostParam(req, "redirect");
                        that.setRedirect(req, redirect);
                        var msg = "Article " + (post.id ? "updated" : "added" ) + " successfully.";
                        that.setSuccessMessage(req, msg);
                        next(err);
                    }
                },
                save = function (id, version, oldArticleId) {
                    var permissionSchemaKey = ARTICLE_PERMISSION_SCHEMA_ENTRY;
                    if (oldArticleId) {
                        permissionSchemaKey = PermissionCache.generateKeyByModelId(permissionSchemaKey, oldArticleId);
                    }

                    DBActionsLib.authorizedPopulateModelAndSave(req, ARTICLE_SCHEMA, {
                            id: id,
                            localizedTitle: {en_US: PluginHelper.getPostParam(req, "title") },
                            localizedContent: {en_US: PluginHelper.getPostParam(req, "content") },
                            version: version,
                            rolePermissions: permissionSchemaKey
                        }, {},
                        ARTICLE_PERMISSION_SCHEMA,
                        afterSave);
                };

            if (!post.id) { //save, new article initial version
                DBActionsLib.DBActions.prototype.incrementCounter.call({db: db}, function (err, counter) {
                    if (err) {
                        return next(err);
                    }
                    save(counter.counter, DEFAULT_VERSION);
                });
            }
            else { // create new version with same id, but different articleId, move old version to Article_Version
                var id = PluginHelper.getPostParam(req, "id"),
                    version = PluginHelper.getPostParam(req, "version"),
                    articleId = PluginHelper.getPostParam(req, "articleId");
                version = incrementVersion(version);
                req.body[ns].version = version;
                ArticleManager.moveArticleToArticleVersion(
                    id,
                    DBActionsLib.getAuthInstance(req, ARTICLE_SCHEMA, ARTICLE_PERMISSION_SCHEMA_ENTRY),
                    DBActionsLib.getInstance(req, ARTICLE_VERSION_SCHEMA), function (err, result) {
                        if (err) {
                            return next(err);
                        }
                        if (result) {
                            save(id, version, articleId);
                        }
                    });
            }
        }
        else {
            that.setErrorMessage(req, "entered-invalid-data");
            req.attrs.articleForm = that.getFormBuilder().DynamicForm(req, articleForms.getArticleEditForm(), "en_US");
            req.params.action = "edit";
            next(err);
        }
    });
}

function editArticleAction(req, res, next) {
    var that = this, DBActionsLib = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        id = params.id, ns = that.getNamespace(req);
    params.action = "edit";

    if (id) {
        //process edit

        var redirect = that.getRedirectPath(req);
        //check number validity of id
        if (parseInt(id).toString() == "NaN") {
            that.setErrorMessage(req, "Wrong article Id");
            that.setRedirect(req, redirect);
            return next(null);
        }

        var dbAction = DBActionsLib.getAuthInstance(req, ARTICLE_SCHEMA, ARTICLE_PERMISSION_SCHEMA_ENTRY);
        ArticleManager.getLatestArticleById(id, dbAction, function (err, latestArticle) {
            if (err) {
                return next(err);
            }
            req.query[ns] = utils.cloneExtend(latestArticle, {redirect: redirect,
                title: latestArticle.localizedTitle["en_US"], content: latestArticle.localizedContent["en_US"] });
            params.action = "edit";
            req.attrs.articleForm = that.getFormBuilder().DynamicForm(req, articleForms.getArticleEditForm(), "en_US", "add");
            next(err);
        });

    }
    else {
        req.query[ns] = {redirect: that.getRedirectPath(req) };
        req.attrs.articleForm = that.getFormBuilder().DynamicForm(req, articleForms.getArticleEditForm(), "en_US", "add");
        next(null);
    }
}

ArticlesManageController.prototype.render = function (req, res, next) {
    var that = this, ret = {};

    var pv = new that.PermissionValidator(req, ARTICLE_PERMISSION_SCHEMA, "");
    pv.hasPermissionWithoutModelId("ADD", function (err, perm) {
        if (!err) {
            ret.hasAdd = perm.isAuthorized;
            req.pluginRender.setLocals(ret).setView(req.params.action);
        }
        next(err);
    });
};

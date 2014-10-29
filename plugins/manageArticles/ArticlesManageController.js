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
        var ArticleService = app.getService(ARTICLE_SCHEMA),
            PluginInstanceService = app.getService(PLUGIN_INSTANCE_SCHEMA),
            ArticleLocationService = app.getService(ARTICLE_LOCATION_SCHEMA);
        async.series([
            function (n) {
                //get plugin instance model
                PluginInstanceService.findById(modelData.pluginInstanceId, function (err, plugin) {
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
                ArticleService.getById(id, function (err, art) {
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
                ArticleLocationService.deleteAll({
                    pageId: pageId,
                    namespace: ns
                }, n);
            },
            function (n) {
                ArticleLocationService.save({
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
    if (utils.contains(ns, displayArticlePluginId)) {
        var pageId = modelData.pageId, locations, id, articleId;
        var ArticleLocationService = app.getService(ARTICLE_LOCATION_SCHEMA);
        async.series([
            function (n) {
                //check for already configured model & remove it.
                ArticleLocationService.deleteAll({
                    pageId: pageId,
                    namespace: ns
                }, n);
            }
        ], function (err, result) {
            Debug._l(err);
        });
    }

}

function getArticleVersions(req, res, next) {
    var that = this, params = req.params,
        id = params.id, ns = that.getNamespace(req), redirect = "/" + params.page + "/" + ns;
    var ArticleServiceAuth = req.app.getService(ARTICLE_SCHEMA).Auth;

    ArticleServiceAuth.getArticleVersions(id, req.session.roles, function (err, json) {
        if (err) {
            that.setRedirect(req, redirect);
        }
        else {
            that.setJSON(req, json);
            Debug._li("", json)
        }
        next(err);
    });
}

function previewArticleAction(req, res, next) {
    var that = this, params = req.params,
        id = params.id, ns = that.getNamespace(req), version = params.version;

    var ArticleService = that.getService(ARTICLE_SCHEMA);

    async.waterfall([
        function (n) {
            ArticleService.Auth.getByIdAndVersion(id, version, req, n);
        } ,
        function (article, n) {
            defaultView({article: article, req: req}, n);
        },
        function (html, n) {
            params.action = "preview";
            req.attrs.preview = html;
            n();
        }
    ], next);
}

function removeArticleAction(req, res, next) {

    var that = this, params = req.params,
        idStr = params.id, ns = that.getNamespace(req);
    if (idStr) {
        var redirect = params.page + "/" + ns, ids = idStr.split("~");

        var ArticleService = that.getService(ARTICLE_SCHEMA);

        var nonDeletedIds = [];

        async.each(ids, function (id, cb) {
            ArticleService.Auth.removeArticleById(id, req, function (err, result) {
                if (!result) {
                    nonDeletedIds.push(id);
                }
                cb();
            });
        }, function (err, result) {
            if (!err) {
                that.setRedirect(req, redirect);
                nonDeletedIds.length > 0 &&
                that.setInfoMessage(req, "Article with following ids are not deleted: " + nonDeletedIds.join());

                nonDeletedIds.length < ids.length &&
                that.setSuccessMessage(req, "Article(s) deleted successfully.");
            }
            next(err);
        });
    }
}

function getArticlesAction(req, res, next) {
    var that = this,
        queryParams = req.query;
    var ArticleServiceAuth = that.getService(ARTICLE_SCHEMA).Auth;
//    Debug._li("req, que: ", req.query, true);
    var colNames = ["", "id", "localizedTitle", "createDate", "displayDate"];
    ArticleServiceAuth.paginate(req.query, colNames, req.session.roles, function (err, results) {
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
    var that = this, ArticleServiceAuth = that.getService(ARTICLE_SCHEMA).Auth,
        PluginHelper = that.getPluginHelper();
//    params.action = "edit";

    that.ValidateForm(req, articleForms.getArticleEditForm(), function (err, result) {
        if (err) {
            return next(err);
        }

        var post = PluginHelper.getPostParams(req),
            permissionSchemaKey = ARTICLE_PERMISSION_SCHEMA_ENTRY,
            afterSave = function (err) {
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
            };

        if (!result.hasErrors) {
            if (!post.id) { //save, new article initial version
                ArticleServiceAuth.saveArticle(req, {
                    localizedTitle: {en_US: PluginHelper.getPostParam(req, "title") },
                    localizedContent: {en_US: PluginHelper.getPostParam(req, "content") },
                    rolePermissions: permissionSchemaKey
                }, {}, afterSave);
            }
            else {
                permissionSchemaKey = PermissionCache.generateKeyByModelId(permissionSchemaKey, post.articleId);
                ArticleServiceAuth.updateArticle(req, {
                    localizedTitle: {en_US: PluginHelper.getPostParam(req, "title") },
                    localizedContent: {en_US: PluginHelper.getPostParam(req, "content") },
                    rolePermissions: permissionSchemaKey
                }, {}, afterSave);
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
    var that = this, params = req.params, ArticleServiceAuth = that.getService(ARTICLE_SCHEMA).Auth,
        id = params.id, ns = that.getNamespace(req);
    params.action = "edit";

    if (id) {
        //process edit

        var redirect = that.getRedirectPath(req);

        ArticleServiceAuth.getByIdAndVersion(id, null, req, function (err, article) {
            if (article) {
                article = article.toObject();
                req.query[ns] = utils.cloneExtend(article, {redirect: redirect,
                    title: article.localizedTitle["en_US"],
                    content: article.localizedContent["en_US"] });
                params.action = "edit";
                req.attrs.articleForm = that.getFormBuilder().DynamicForm(req, articleForms.getArticleEditForm(), "en_US", "add");
            }
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

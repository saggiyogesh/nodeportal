var cwd = process.cwd(),
    BasePluginController = require(cwd + "/lib/BasePluginController"),
    defaultView = require(cwd + "/lib/articles/DefaultView"),
    ARTICLE_SCHEMA = "Article", ARTICLE_PERMISSION_SCHEMA = "model.articleSchema.Article",
    SettingsForm = require('./settingsForm');

var DisplayArticleController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
};

util.inherits(DisplayArticleController, BasePluginController);

function getArticle(req, that, next) {
    that.getSettings(req, function (err, settings) {
        settings = settings || {};
        var id = settings.id,
            setErrMsg = function (msg) {
                that.setErrorMessage(req, msg);
            },
            setExpiryMsg = function () {
                that.setInfoMessage(req, "Article is expired.");
            };

        var ArticleService = that.getService(ARTICLE_SCHEMA),
            ArticleServiceAuth = ArticleService.Auth;

        if (id) {
            ArticleServiceAuth.getByIdAndVersion(id, null, req, function (err, latestArticle) {
                if (latestArticle) {
                    defaultView({article: latestArticle, req: req}, function (err, html) {
                        req.attrs.articleHTML = html;
                    });
                }
                next(err);
            });
        }
        else {
            that.setInfoMessage(req, "Article not selected.");
            next();
        }
    });
}

function displayArticleAction(req, res, next) {
    var that = this;

    getArticle(req, that, function (err) {
        next(err);
    });
}


/**
 * Method used in both render and save settings.
 * If obj has post then go for save settings.
 *    in this case obj has pluginSettings, post . next is saveHandler persists the settings
 * Other case is render the settings view for this particular plugin.
 *    in this case  pass a config object having jade file(jade) and its render options(viewOptions)
 * @param obj
 * @param next
 */
DisplayArticleController.prototype.settings = function (obj, next) {
    var that = this;

    if (obj.post) { //save instance settings
        var post = obj.post;
        var ns = post.ns;
        var id = post[ns].id;
        var settings = {id: id, enableComments: post[ns].enableComments};
        next(null, settings);

        return;
    }

    //else render instance settings
    var formObj = SettingsForm.settingsForm();
    var jade = "settings.jade",
        config = {
            jade: jade,
            viewOptions: {},
            settingsForm: formObj
        };
    next(null, config);
};


DisplayArticleController.prototype.render = function (req, res, next) {
    var view = req.params.action;
    view = view || "index";
    var ret = {}, that = this;

    ret.settings = that.getSettings(req, function (err, settings) {
        if (err) {
            req.pluginRender.setView(view).setLocals(ret);
            next(err);
        }
        else {
            getArticle(req, that, function (err) {
                ret.settings = settings || {
                    id: 0,
                    enableComments: false
                };
                req.pluginRender.setView(view).setLocals(ret);
                next(err);
            });
        }
    });
};

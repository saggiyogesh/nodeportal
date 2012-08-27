var cwd = process.cwd(),
    BasePluginController = require(cwd + "/lib/BasePluginController"),
    defaultView = require(cwd + "/lib/articles/DefaultView")(),
    DateUtil = require(cwd + "/lib/Utils/DateUtil"),
    ARTICLE_SCHEMA = "Article";

var DisplayArticleController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
};

util.inherits(DisplayArticleController, BasePluginController);

function getArticle(req, that, next) {
    var DBActionsLib = that.getDBActionsLib();
    that.getSettings(req, function (err, settings) {
        settings = settings || {};
        var id = settings.id,
            setErrMsg = function (msg) {
                that.setErrorMessage(req, msg);
            },
            setExpiryMsg = function () {
                that.setInfoMessage(req, "Article is expired.");
            };
        if (id) {
            if (isNaN(id)) {
                // err invalid id
                that.setErrorMessage(req, "Wrong article Id");
                return next();
            }

            var dbAction = DBActionsLib.getInstance(req, ARTICLE_SCHEMA);
            dbAction.authorizedGet("findById", id, function (err, latestArticle) {
                if (err) return next(err);

                var html;
                if (latestArticle) {
                    var expiryDate = latestArticle.expiryDate;
                    if (latestArticle.isExpired) {
                        setExpiryMsg();
                        next();
                        return;
                    }
                    else if (expiryDate && (DateUtil.datePassed(expiryDate) || DateUtil.equalToToday(expiryDate))) {
                        dbAction.update({articleId:latestArticle.articleId, isExpired:true}, function (err, result) {
                            if (!err) {
                                setExpiryMsg();
                            }
                            next(err);
                        });
                        return;
                    }

                    html = defaultView({article:latestArticle, req:req});
                    req.attrs.articleHTML = html;
                }
                else {
                    setErrMsg("Wrong article Id");
                }
                next();
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
        next(err, req, res);
    });
}

function Settings(jade, params) {
    this.jade = jade;
    this.params = params
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
    if (obj.post) { //save instance settings
        var id = obj.post.id;
        var settings = {id:id};
        next(null, settings);

        return;
    }

    //else render instance settings
    var jade = "settings.jade",
        config = {
            jade:jade,
            viewOptions:{}
        };
    next(null, config);
};


DisplayArticleController.prototype.render = function (req, res, next) {
    var view = req.params.action;
    view = view || "index";
    var ret = {}, that = this;

    getArticle(req, that, function (err) {
        next(err, [ view, ret ]);
    });

};

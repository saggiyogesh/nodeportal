//main service file to be called & used
//custom methods should be written here
// this file is created initially and extending the BaseService Class
// on updating model conf file this file will not generate again

var PageBaseService = require("./PageBaseService");


var PageServiceAuth = require("./PageServiceAuth");

var PermissionValidator = require(utils.getLibPath() + "/permissions/PermissionValidator"),
    getAppProperty = require(utils.getLibPath() + "/AppProperties").get,
    PluginHelper = require(utils.getLibPath() + "/PluginHelper");


PageBaseService.Auth = PageServiceAuth;

function PageNotFoundError(arg) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);

    this.name = "PageNotFoundError";
    this.message = "Page not found: " + arg;
    this.localizedMessageKey = "page-not-found-error";
}
util.inherits(PageNotFoundError, Error);

function IndexPageDeleteError() {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);

    this.name = "IndexPageDeleteError";
    this.message = "Cannot delete index page.";
    this.localizedMessageKey = "index-page-delete-error";
}
util.inherits(IndexPageDeleteError, Error);

function ChildPagesDeleteError(parentPageId) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);

    this.name = "ChildPagesDeleteError";
    this.message = "Delete all child pages.";
    this.localizedMessageKey = "has-child-pages-delete-error";

}
util.inherits(ChildPagesDeleteError, Error);


PageBaseService.PageNotFoundError = PageNotFoundError;


//custom methods

PageBaseService.shufflePageData = function shufflePageData(page, layout) {
    var plugins = [];
    _.each(page.data, function (arr, placeHolder) {
        plugins = _.flatten([plugins, arr]);
    });

    Debug._l(plugins);

    var placeHolders = layout.placeHolderNames;
    var data = {};
    placeHolders.forEach(function (name) {
        data[name] = [];
    });
    data[placeHolders[0]] = plugins;
    return data;
};

PageBaseService.updatePageOrder = function updatePageOrder(pageIds, next) {
    var i = 0;
    async.each(pageIds, function (pageId, cb) {
        PageBaseService.update({
            pageId: pageId,
            order: i++
        }, cb);
    }, next);
};

PageServiceAuth.updatePage = function updatePageAuth(req, otherValues, keyMapObj, next) {
    var post = PluginHelper.getPostParams(req);
    var pv = new PermissionValidator(req, "model.pageSchema.Page", "Page");
    var LayoutService = PageBaseService.getService("Layout");

    post.isHidden = post.isHidden || false;
    var friendlyURL = post.friendlyURL;
    if (friendlyURL.charAt(0) != '/') {
        post.friendlyURL = "/" + friendlyURL;
    }

    async.waterfall([
        function (n) {
            LayoutService.findById(post.layout, n);
        },
        function (layout, n) {
            PageBaseService.findById(post.pageId, function (err, page) {
                if (!err) {
                    //update plugins from old layout to new layout
                    if (page.layoutId != post.layout) {
                        var data = PageBaseService.shufflePageData(page, layout);
                        Debug._li("data ", data, true);
                        otherValues.data = data;
                    }

                    PageServiceAuth.populateModelAndUpdate(post, otherValues,
                    keyMapObj, pv, n);
                }
                else {
                    n(new PageNotFoundError(post.pageId));
                }
            });
        }
    ], next);
};

PageServiceAuth.addPage = function addPageAuth(req, otherValues, keyMapObj, next) {
    var post = PluginHelper.getPostParams(req);
    var pv = new PermissionValidator(req, "model.pageSchema", "Page");
    var LayoutService = PageBaseService.getService("Layout");

    delete post.pageId;

    async.waterfall([
        function (n) {
            LayoutService.findById(post.layout, n);
        },
        function (layout, n) {
            var placeHolders = layout.placeHolderNames;
            var data = {};
            placeHolders.forEach(function (name) {
                data[name] = [];
            });

            otherValues.data = data;

            //get children by parentPageId
            var parentPageId = post.parentPageId;
            PageBaseService.getChildren(parentPageId, function (err, pages) {
                if (!err) {
                    otherValues.order = pages.length;
                    PageServiceAuth.populateModelAndSave(post,
                        otherValues, keyMapObj, pv, n);
                }
                else {
                    n(err);
                }
            });

        }
    ], next);
};

PageServiceAuth.deletePage = function deletePageAuth(id, pv, next) {

    async.waterfall([
        function (n) {
            PageBaseService.findById(id, n);
        },
        function (p, n) {
            if (p) {
                // check for index page delete
                (getAppProperty("DEFAULT_INDEX_PAGE") == p.friendlyURL) ?
                    n(new IndexPageDeleteError()) : n(null, p);
            }
            else {
                n(new PageNotFoundError(id));
            }
        },
        function (p, n) {
            //check for child pages, if exists then throw err
            PageBaseService.getChildren(id, function (err, pages) {
                if (pages && pages.length > 0) {
                    err = new ChildPagesDeleteError(id);
                }
                n(err, p);
            });
        },
        function (p, n) {
            // delete page
            PageServiceAuth.deleteById(p.pageId, pv, function (err) {
                n(err, err ? null : p);
            });
        },
        function (p, n) {
            // get above siblings and update page order
            PageBaseService.getAboveSiblings(p.parentPageId, p.order, function (err, aboveSiblings) {
                if (aboveSiblings && aboveSiblings.length > 0) {
                    var decrementPageOrder = function (page, cb) {
                        var order = page.order;
                        --order;
                        PageBaseService.update({
                            pageId: page.pageId,
                            order: order
                        }, cb);
                    };

                    async.each(aboveSiblings, decrementPageOrder, n);
                }
                else{
                    n();
                }
            });

        }
    ], next);

}


module.exports = PageBaseService;



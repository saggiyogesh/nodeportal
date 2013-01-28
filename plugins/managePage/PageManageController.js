/***
 * plugin to manage pages
 */
var BasePluginController = require(process.cwd() + "/lib/BasePluginController.js");
var PageManager = require("./PageManager.js"), pageForm = require("./pageForms.js"),
    PAGE_SCHEMA = "Page", LAYOUT_SCHEMA = "Layout";
//var forms = require("./forms");

var PageManageController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route:'/getPagesListJSON', action:getPagesListJSON
        });
        that.get({
            route:'/edit/:id?', action:editPageAction
        });
        that.get({ //:ppId is parent page id
            route:'/add/:ppId?', action:addPageAction
        });
        that.get({
            route:'/:action'
        });
        that.post({
            route:'/updatePage',
            action:updatePageAction
        });
        that.post({
            route:'/updatePageOrder',
            action:updatePageOrderAction
        });
        that.post({
            route:'/delete/:id?',
            action:deletePage
        });

        that.addCustomValidations(pageForm.customValidations);

        //Listen layout update event and update page data field
        that.getModelEvent(LAYOUT_SCHEMA).handleUpdate(function (event) {
            var schemaName = event.schemaName, modelId = event.modelId;
            if (schemaName === LAYOUT_SCHEMA) {
                var DBActions = that.getDBActionsLib();
                var dbAction = DBActions.getSimpleInstance(app, PAGE_SCHEMA);
                dbAction.get("findByLayoutId", modelId, function (err, pages) {
                    if (err) {
                        Debug._l(err);
                        return;
                    }
                    if (pages) {
                        DBActions.getSimpleInstance(app, LAYOUT_SCHEMA).get("findByLayoutId", modelId, function (err, layout) {
                            if (err) {
                                return Debug._l(err);
                            }
                            if (layout) {
                                pages.forEach(function (page) {
                                    var data = shufflePageData(page, layout);

                                    var model = {
                                        pageId : page.pageId,
                                        data:data
                                    };

                                    dbAction.update(model, function(err, result){
                                        if(err){
                                            Debug._l(err);
                                        }
                                        if(result){
                                            Debug._l("Page updated by model event, " + page.pageId);
                                        }
                                    })

                                });
                            }
                        });

                    }
                });
            }
        });
    });
};

util.inherits(PageManageController, BasePluginController);

/**
 * only single page is deleted at a time, ie if a page doesn't have any children
 * @param req
 * @param res
 * @param next
 */
function deletePage(req, res, next) {
    var that = this, db = that.getDB(), DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getInstance(req, PAGE_SCHEMA);
    var params = req.params;
    var pageId = params.id;
    if (!pageId) {
        that.setErrorMessage(req, "No page is selected");
        return next(null, req, res);
    }
    var redirect = "/" + req.params.page + "/" + req.params.plugin;
    if (that.getAppProperty("DEFAULT_INDEX_PAGE_ID") == pageId) {
        that.setErrorMessage(req, "Cannot delete index page.");
        that.setRedirect(req, redirect);
        return next(null, req, res);
    }
    PageManager.hasChildren(dbAction, pageId, function (err, pages) {
        if (pages.length > 0) {
            that.setRedirect(req, redirect);
            that.setErrorMessage(req, "Delete all child pages.");
            next(err, req, res);
        } else {
            dbAction.authorizedRemove(pageId, function (err, result) {
                if (result) {
                    that.setRedirect(req, redirect);
                    that.setSuccessMessage(req, "Page deleted successfully.");
                }
                next(err, req, res);
            });
        }
    });
}

function updatePageOrderAction(req, res, next) {
    var that = this, db = that.getDB();
    var DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getInstance(req, PAGE_SCHEMA);
    var postParams = that.getPluginHelper().getPostParams(req);
    if (!postParams) {
        return next(null, req, res);
    }
    var pageOrder = postParams["pageOrder"];
    pageOrder = pageOrder.split(",");
    var AsyncIterator = that.AsyncIterator;

    var asycI = new AsyncIterator(pageOrder, function (err, result) {
        if (result) {
            var redirect = that.getPluginHelper().getPostParam(req, "redirect");
            that.setRedirect(req, redirect);
            that.setSuccessMessage(req, "Pages re-ordered successfully.");
        }
        next(err, req, res);
    });

    var asyncProcess = function () {
        var that = this, i = that.i, pageOrder = that.vals;
        var query = {pageId:pageOrder[i]}, param = {order:i};
        var obj = {
            pageId:pageOrder[i],
            order:i
        };
        dbAction.authorizedUpdate(obj, function (err, page) {
            if (err) {
                asycI.next(err);
                return;
            }
            asycI.iterate();
        });

    };

    asycI.setAsyncProcess(asyncProcess);
}

function addPageAction(req, res, next) {
//    Debug._l("add page");
    var that = this, db = that.getDB();
    var DBActions = that.getDBActionsLib();
    var params = req.params;
    var ppId = params.ppId;
    ppId = ppId || 0;
    var dbAction = DBActions.getInstance(req, PAGE_SCHEMA);

    dbAction.get("findByPageId", ppId, function (err, page) {
        if (err) {
            return next(err, req, res);
        }
        if (ppId != 0 && !page) {
            that.setErrorMessage(req, "Parent page not exists");
            return next(err, req, res);
        }
        pageForm.PageForm(req, DBActions, function (err, formObj) {
            if (err) {
                return next(err, req, res);
            }

            req.query[that.getPluginId()] = {redirect:"/" + params.page + "/" + that.getPluginId() + "/view", parentPageId:ppId };
            req.attrs.pageForm = that.getFormBuilder().DynamicForm(req, formObj, "en_US", "add");
            params.action = "edit";
            next(err, req, res);
        });
    });
}

function getPageJSON(page) {
    var json = {
        title:page.localizedName["en_US"],
        key:page.pageId,
        expand:true,
        icon:false,
        children:[]
    };
    return json;
}

function getPagesListJSON(req, res, next) {
    var that = this;
    PageManager.viewAll(that.getDBActionsLib().getInstance(req, PAGE_SCHEMA), function (err, models) {
        if (err) {
            return  next(err, req, res);
        }
        var siteRoot = {title:"Site Root", key:"0", expand:true, icon:false, children:[]}, json = [siteRoot], pagesJSON = {
            0:siteRoot
        };
        models.forEach(function (model) {
            var pageJSON = getPageJSON(model);
            pagesJSON[model.pageId] = pageJSON;


            var parent = pagesJSON[model.parentPageId];
            var children = parent.children; // array
            var order = model.order;
            if (order == 0) {
                if (!children[order]) {
                    children[order] = pageJSON;
                }
                else {
                    children[children.length] = pageJSON;
                }
            }
            else {
                children[order] = pageJSON;
            }
        });
        that.setSend(req, JSON.stringify(json));
        next(err, req, res);
    });
}

function shufflePageData(page, layout) {
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
}
function updatePageAction(req, res, next) {
    var that = this, db = that.getDB(),
        DBActions = that.getDBActionsLib(), dbAction = DBActions.getInstance(req, PAGE_SCHEMA);
    pageForm.PageForm(req, DBActions, function (err, formObj) {
        if (err) {
            return next(err, req, res);
        }
        that.ValidateForm(req, formObj, function (err, result) {
            if (err) {
                return next(err, req, res);
            }
            if (!result.hasErrors) {
                var post = that.getPluginHelper().getPostParams(req);
                var updateOrSave = function (err, page) {
                    if (page) {
                        var redirect = that.getPluginHelper().getPostParam(req, "redirect");
                        that.setRedirect(req, redirect);
                        var msg = "Page " + (post.pageId ? "updated" : "added" ) + " successfully."
                        that.setSuccessMessage(req, msg);
                    }
                    next(err, req, res);
                };

                that.getDBActionsLib().getInstance(req, "Layout").get("findByLayoutId", post.layout,
                    function (err, layout) {
                        if (err) {
                            return next(err, req, res);
                        }
                        if (!post.pageId) { //save a new model called
                            //initiate the page data as per layout

                            var placeHolders = layout.placeHolderNames;
                            var data = {};
                            placeHolders.forEach(function (name) {
                                data[name] = [];
                            });
                            DBActions.authorizedPopulateModelAndSave(req, PAGE_SCHEMA,
                                {localizedName:{en_US:req.body[that.getPluginId()].name}, data:data}, {layoutId:"layout", themeId:"theme"},
                                updateOrSave);

                        } else {
                            post.isHidden = post.isHidden || false;
                            var friendlyURL = post.friendlyURL;
                            if (friendlyURL.charAt(0) != '/') {
                                post.friendlyURL = "/" + friendlyURL;
                            }


                            that.getDBActionsLib().getInstance(req, PAGE_SCHEMA).get("findByPageId", post.pageId,
                                function (err, page) {
                                    var updateObj = {localizedName:{en_US:req.body[that.getPluginId()].name}};
                                    //update plugins from old layout to new layout
                                    if (page.layoutId != post.layout) {
                                        var data = shufflePageData(page, layout);
                                        Debug._li("data ", data, true);
                                        updateObj["data"] = data;
                                    }

                                    DBActions.authorizedPopulateModelAndUpdate(req, PAGE_SCHEMA,
                                        updateObj, {layoutId:"layout", themeId:"theme"}, updateOrSave);

                                });
                        }
                    });
            }
            else {
                that.setErrorMessage(req, "entered-invalid-data");
                var db = that.getDB();
                pageForm.PageForm(req, DBActions, function (err, formObj) {
                    if (!err) {
                        req.attrs.pageForm = that.getFormBuilder().DynamicForm(req, formObj, "en_US");
                        req.params.action = "edit";
                    }
                    next(err, req, res);
                });
            }

        });
    });
}

function editPageAction(req, res, next) {
    var params = req.params,
        pageId = params.id,
        that = this, db = that.getDB(),
        DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getInstance(req, PAGE_SCHEMA);
    if (!pageId) {
        that.setInfoMessage(req, "Page not exists");
        return  next(null, req, res);
    }
    dbAction.authorizedGet("findByPageId", pageId, function (err, page) {
        if (err) {
            return next(err, req, res);
        }
        pageForm.PageForm(req, DBActions, function (err, formObj) {
            if (!err) {
                req.query[that.getPluginId()] = utils.cloneExtend(page, {redirect:"/" + params.page + "/" + that.getPluginId() + "/view",
                    name:page.localizedName["en_US"], theme:page.themeId, layout:page.layoutId});
                req.attrs.pageForm = that.getFormBuilder().DynamicForm(req, formObj, "en_US", "add");
                params.action = "edit";
            }
            next(err, req, res);
        });
    });
}

PageManageController.prototype.render = function (req, res, next) {
    var view = req.params.action;
    // view is default will show the list of pages in tree view on left hand side
    // and index page in edit/view mode

    view = view || "view";
    var ret = {};
    var that = this, formObj = pageForm.updatePageOrderForm, DynamicForm = that.getFormBuilder().DynamicForm;
    req.query[that.getPluginId()] = {redirect:"/" + req.params.page + "/" + that.getPluginId() + "/view" };
    ret.updatePageOrderForm = DynamicForm(req, formObj, "en_US");
    next(null, [ view, ret ]);
};
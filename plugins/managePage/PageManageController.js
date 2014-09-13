/***
 * plugin to manage pages
 */
var BasePluginController = require(process.cwd() + "/lib/BasePluginController.js");
var PageManager = require("./PageManager.js"), pageForm = require("./pageForms.js"),
    PAGE_SCHEMA = "Page", LAYOUT_SCHEMA = "Layout", THEME_SCHEMA = "Theme",
    PAGE_PERMISSION_SCHEMA_ENTRY = "model.pageSchema.Page",
    PAGE_PERMISSION_SCHEMA = "model.pageSchema";
//var forms = require("./forms");

var PageManageController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route: '/getPagesListJSON', action: getPagesListJSON
        });
        that.get({
            route: '/edit/:id?', action: editPageAction
        });
        that.get({ //:ppId is parent page id
            route: '/add/:ppId?', action: addPageAction
        });
        that.get({
            route: '/:action'
        });
        that.post({
            route: '/updatePage',
            action: updatePageAction
        });
        that.post({
            route: '/updatePageOrder',
            action: updatePageOrderAction
        });
        that.post({
            route: '/delete/:id?',
            action: deletePage
        });

        that.addCustomValidations(pageForm.customValidations);

        //Listen layout update event and update page data field
        that.getModelEvent(LAYOUT_SCHEMA).handleUpdate(handleLayoutUpdate, that);
        that.getModelEvent(LAYOUT_SCHEMA).handleDelete(handleLayoutDelete, that);
        that.getModelEvent(THEME_SCHEMA).handleDelete(handleThemeDelete, that);
    });
};

util.inherits(PageManageController, BasePluginController);

function handleThemeDelete(event) {
    var schemaName = event.schemaName, modelId = event.modelId, that = this, app = that.getApp();
    var DBActions = that.getDBActionsLib();
    if (schemaName === THEME_SCHEMA) {
        var dbActionP = DBActions.getSimpleInstance(app, PAGE_SCHEMA);
        var dbActionT = DBActions.getSimpleInstance(app, THEME_SCHEMA);
        async.parallel({
            pages: function (next) {
                dbActionP.get("findByThemeId", modelId, next);
            },
            theme: function (next) {
                dbActionT.get("getDefault", next);
            }
        }, function (err, results) {
            if (!err && results.pages && results.theme) {
                results.pages.forEach(function (page) {
                    var model = {
                        pageId: page.pageId,
                        themeId: results.theme.themeId
                    };

                    dbActionP.update(model, function (err, result) {
                        if (err) {
                            Debug._l(err);
                        }
                        if (result) {
                            Debug._l("Page updated by model event, " + page.pageId);
                        }
                    });

                })
            }

        });
    }
}

function handleLayoutDelete(event) {
    var schemaName = event.schemaName, modelId = event.modelId, that = this, app = that.getApp();
    var DBActions = that.getDBActionsLib();
    if (schemaName === LAYOUT_SCHEMA) {
        var dbActionP = DBActions.getSimpleInstance(app, PAGE_SCHEMA);
        var dbActionL = DBActions.getSimpleInstance(app, LAYOUT_SCHEMA);
        async.parallel({
            pages: function (next) {
                dbActionP.get("findByLayoutId", modelId, next);
            },
            layout: function (next) {
                dbActionL.get("getDefault", next);
            }
        }, function (err, results) {
            Debug._li(">> ", results, true);
            if (!err && results.pages && results.layout) {
                results.pages.forEach(function (page) {
                    var layout = results.layout;
                    var data = shufflePageData(page, layout);
                    var model = {
                        pageId: page.pageId,
                        layoutId: layout.layoutId,
                        data: data
                    };

                    dbActionP.update(model, function (err, result) {
                        if (err) {
                            Debug._l(err);
                        }
                        if (result) {
                            Debug._l("Page updated by model event, " + page.pageId);
                        }
                    });

                })
            }

        });

    }
}
function handleLayoutUpdate(event) {
    var schemaName = event.schemaName, modelId = event.modelId, that = this, app = that.getApp();
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
                                pageId: page.pageId,
                                data: data
                            };

                            dbAction.update(model, function (err, result) {
                                if (err) {
                                    Debug._l(err);
                                }
                                if (result) {
                                    Debug._l("Page updated by model event, " + page.pageId);
                                }
                            });

                        });
                    }
                });

            }
        });
    }
}

/**
 * only single page is deleted at a time, ie if a page doesn't have any children
 * @param req
 * @param res
 * @param next
 */
function deletePage(req, res, next) {
    var that = this, db = that.getDB(), DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getAuthInstance(req, PAGE_SCHEMA, PAGE_PERMISSION_SCHEMA_ENTRY);
    var params = req.params;
    var pageId = params.id;
    if (!pageId) {
        that.setErrorMessage(req, "No page is selected");
        return next(null);
    }
    var redirect = req.params.page + "/" + req.params.plugin;
    dbAction.get("findByPageId", pageId, function (err, page) {
        if (err) {
            return next(err);
        }
        page && (page = page.toObject());
        if (page && (that.getAppProperty("DEFAULT_INDEX_PAGE") == page.friendlyURL)) {
            that.setErrorMessage(req, "Cannot delete index page.");
            that.setRedirect(req, redirect);
            return next(null);
        }
        PageManager.hasChildren(dbAction, pageId, function (err, pages) {
            if (pages.length > 0) {
                that.setRedirect(req, redirect);
                that.setErrorMessage(req, "Delete all child pages.");
                next(err);
            } else {
                var aboveSiblings;
                async.series([
                    function (n) {
                        dbAction.authorizedRemove(pageId, n);
                    },
                    function (n) {
                        PageManager.getAboveSiblings(dbAction, page, function (err, pages) {
                            if (pages) {
                                aboveSiblings = pages;
                            }
                            n(err, pages);
                        });
                    },
                    function (n) {
                        if (!aboveSiblings || aboveSiblings.length == 0) {
                            return n(null, true);
                        }

                        var dbAction1 = DBActions.getInstance(req, PAGE_SCHEMA);
                        var decrementPageOrder = function (page, n) {
                            var order = page.order;
                            --order;
                            dbAction1.update({
                                pageId: page.pageId,
                                order: order
                            }, n);
                        };

                        async.each(aboveSiblings, decrementPageOrder, n);
                    }
                ], function (err, result) {
                    if (!err) {
                        that.setRedirect(req, redirect);
                        that.setSuccessMessage(req, "Page deleted successfully.");
                    }
                    next(err);
                });
            }
        });
    })
}

function updatePageOrderAction(req, res, next) {
    var that = this, db = that.getDB();
    var DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getAuthInstance(req, PAGE_SCHEMA, PAGE_PERMISSION_SCHEMA_ENTRY);
    var postParams = that.getPluginHelper().getPostParams(req);
    if (!postParams) {
        return next(null);
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
        next(err);
    });

    var asyncProcess = function () {
        var that = this, i = that.i, pageOrder = that.vals;
        var query = {pageId: pageOrder[i]}, param = {order: i};
        var obj = {
            pageId: pageOrder[i],
            order: i
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
    var that = this, db = that.getDB();
    var DBActions = that.getDBActionsLib();
    var params = req.params;
    var ppId = params.ppId;
    ppId = ppId || 0;
    var dbAction = DBActions.getInstance(req, PAGE_SCHEMA);

    dbAction.get("findByPageId", ppId, function (err, page) {
        if (err) {
            return next(err);
        }
        if (ppId != 0 && !page) {
            that.setErrorMessage(req, "Parent page not exists");
            return next(err);
        }
        pageForm.PageForm(req, DBActions, function (err, formObj) {
            if (err) {
                return next(err);
            }

            req.query[that.getPluginId()] = {redirect: that.getRedirectPath(req, ["view"]), parentPageId: ppId };
            req.attrs.pageForm = that.getFormBuilder().DynamicForm(req, formObj, "en_US", "add");
            params.action = "edit";
            req.attrs.showToolbar = false;
            next(err);
        });
    });
}

function getPageJSON(page) {
    var json = {
        title: page.localizedName["en_US"],
        key: page.pageId,
        expand: true,
        icon: false,
        children: []
    };
    return json;
}

function getPagesListJSON(req, res, next) {
    var that = this;
    PageManager.viewAll(that.getDBActionsLib().getAuthInstance(req, PAGE_SCHEMA, PAGE_PERMISSION_SCHEMA_ENTRY), function (err, models) {
        if (err) {
            return  next(err);
        }
        var siteRoot = {title: "Site Root", key: "0", expand: true, icon: false, children: []}, json = [siteRoot], pagesJSON = {
            0: siteRoot
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
        next(err);
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
        DBActions = that.getDBActionsLib(),
        dbAction = DBActions.getAuthInstance(req, PAGE_SCHEMA, PAGE_PERMISSION_SCHEMA_ENTRY);

    pageForm.PageForm(req, DBActions, function (err, formObj) {
        if (err) {
            return next(err);
        }
        that.ValidateForm(req, formObj, function (err, result) {
            if (err) {
                return next(err);
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
                    next(err);
                };

                that.getDBActionsLib().getInstance(req, "Layout").get("findByLayoutId", post.layout,
                    function (err, layout) {
                        if (err) {
                            return next(err);
                        }
                        if (!post.pageId) { //save a new model called
                            //initiate the page data as per layout
                            var placeHolders = layout.placeHolderNames;
                            var data = {};
                            placeHolders.forEach(function (name) {
                                data[name] = [];
                            });
                            //get children by parentPageId
                            var parentPageId = that.getPluginHelper().getPostParam(req, "parentPageId");
                            PageManager.getChildrenCount(dbAction, parentPageId, function (err, count) {
                                if (err) {
                                    return next(err);
                                }

                                DBActions.authorizedPopulateModelAndSave(req, PAGE_SCHEMA,
                                    {localizedName: {en_US: req.body[that.getPluginId()].name}, data: data,
                                        rolePermissions: PAGE_PERMISSION_SCHEMA_ENTRY, order: count},
                                    {layoutId: "layout", themeId: "theme"},
                                    PAGE_PERMISSION_SCHEMA,
                                    updateOrSave);
                            });
                        } else {
                            post.isHidden = post.isHidden || false;
                            var friendlyURL = post.friendlyURL;
                            if (friendlyURL.charAt(0) != '/') {
                                post.friendlyURL = "/" + friendlyURL;
                            }

                            that.getDBActionsLib().getInstance(req, PAGE_SCHEMA).get("findByPageId", post.pageId,
                                function (err, page) {
                                    page = page.toObject();
                                    var updateObj = {localizedName: {en_US: req.body[that.getPluginId()].name}};
                                    //update plugins from old layout to new layout
                                    if (page.layoutId != post.layout) {
                                        var data = shufflePageData(page, layout);
                                        Debug._li("data ", data, true);
                                        updateObj["data"] = data;
                                    }

                                    DBActions.authorizedPopulateModelAndUpdate(req, PAGE_SCHEMA,
                                        updateObj, {layoutId: "layout", themeId: "theme"}, PAGE_PERMISSION_SCHEMA_ENTRY, updateOrSave);

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
                    next(err);
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
        dbAction = DBActions.getAuthInstance(req, PAGE_SCHEMA, PAGE_PERMISSION_SCHEMA_ENTRY);
    if (!pageId) {
        that.setInfoMessage(req, "Page not exists");
        return  next(null);
    }
    var page, pv;
    async.waterfall([
        function (n) {
            dbAction.authorizedGet("findByPageId", pageId, n);
        },
        function (p, n) {
            page = p.toObject();
            pageForm.PageForm(req, DBActions, n);
        },
        function (formObj, n) {
            formObj.fields.forEach(function (el) {
                if (el.type != "hidden") {
                    el.disabled = true;
                }
            });
            req.query[that.getPluginId()] = utils.cloneExtend(page, {redirect: that.getRedirectPath(req, ["view"]),
                name: page.localizedName["en_US"], theme: page.themeId, layout: page.layoutId});
            req.attrs.pageForm = that.getFormBuilder().DynamicForm(req, formObj, "en_US", "add");
            req.attrs.pageId = pageId;
            params.action = "edit";
            req.attrs.showToolbar = true;
            n(null, true);
        },
        function (flag, n) {
            pv = new that.PermissionValidator(req, PAGE_PERMISSION_SCHEMA_ENTRY, PAGE_SCHEMA)
            var actions = ["UPDATE", "PERMISSION", "DELETE"];
            pv.checkPermissionForActions(actions, pageId, function(err, perms){
                !err && (req.attrs.actionsPermission = perms);
                n(err, !err);
            });
        },
        function (flag, n) {
            var pv = new that.PermissionValidator(req, PAGE_PERMISSION_SCHEMA, "")
            pv.hasPermissionWithoutModelId("ADD", function(err, perm){
                req.attrs.actionsPermission = req.attrs.actionsPermission || {};
                req.attrs.actionsPermission.ADD = perm;
                n(null, true);
            });
        }
    ], function (err, result) {
        next(err);
    });
}

PageManageController.prototype.render = function (req, res, next) {
    var view = req.params.action;
    // view is default will show the list of pages in tree view on left hand side
    // and index page in edit/view mode

    view = view || "view";
    var ret = {};
    var that = this, formObj = pageForm.updatePageOrderForm(), DynamicForm = that.getFormBuilder().DynamicForm;
    req.query[that.getPluginId()] = {redirect: that.getRedirectPath(req, ["view"])};
    ret.updatePageOrderForm = DynamicForm(req, formObj, "en_US");

    req.pluginRender.setView(view).setLocals(ret);

    var pv = new that.PermissionValidator(req, PAGE_PERMISSION_SCHEMA, "");
    pv.hasPermissionWithoutModelId("ADD", function (err, perm) {
        if (!err) {
            req.pluginRender.addLocal("hasAdd", perm.isAuthorized)
        }
        next(err);
    });
};
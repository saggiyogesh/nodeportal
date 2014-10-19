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
    var schemaName = event.schemaName, modelId = event.modelId, that = this;
    if (schemaName === THEME_SCHEMA) {
        var ThemeService = that.getService(THEME_SCHEMA),
            PageService = that.getService(PAGE_SCHEMA);

        async.parallel({
            pages: function (next) {
                PageService.getByThemeId(modelId, next);
            },
            theme: function (next) {
                ThemeService.getDefault(next);
            }
        }, function (err, results) {
            if (!err && results.pages && results.theme) {
                results.pages.forEach(function (page) {
                    var model = {
                        pageId: page.pageId,
                        themeId: results.theme.themeId
                    };

                    PageService.update(model, function (err, result) {
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
    var schemaName = event.schemaName, modelId = event.modelId, that = this;
    if (schemaName === LAYOUT_SCHEMA) {

        var LayoutService = that.getService(LAYOUT_SCHEMA),
            PageService = that.getService(PAGE_SCHEMA);
        async.parallel({
            pages: function (next) {
                PageService.getByLayoutId(modelId, next);
            },
            layout: function (next) {
                LayoutService.getDefault(next);
            }
        }, function (err, results) {
            Debug._li(">> ", results, true);
            if (!err && results.pages && results.layout) {
                results.pages.forEach(function (page) {
                    var layout = results.layout;
                    var data = PageService.shufflePageData(page, layout);
                    var model = {
                        pageId: page.pageId,
                        layoutId: layout.layoutId,
                        data: data
                    };

                    PageService.update(model, function (err, result) {
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
    var schemaName = event.schemaName, modelId = event.modelId, that = this;
    if (schemaName === LAYOUT_SCHEMA) {
        var PageService = that.getService(PAGE_SCHEMA);

        PageService.getByLayoutId(modelId, function (err, pages) {
            if (err) {
                Debug._l(err);
                return;
            }
            if (pages) {
                that.getService(LAYOUT_SCHEMA).getByLayoutId(modelId, function (err, layout) {
                    if (err) {
                        return Debug._l(err);
                    }
                    if (layout) {
                        pages.forEach(function (page) {
                            var data = PageService.shufflePageData(page, layout);

                            var model = {
                                pageId: page.pageId,
                                data: data
                            };

                            PageService.update(model, function (err, result) {
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
    var that = this, params = req.params, pageId = params.id;

    var redirect = req.params.page + "/" + req.params.plugin,
        pv = new that.PermissionValidator(req, PAGE_PERMISSION_SCHEMA_ENTRY, PAGE_SCHEMA);

    that.getService(PAGE_SCHEMA).Auth.deletePage(pageId, pv, function (err, result) {
        if (!err) {
            that.setRedirect(req, redirect);
            that.setSuccessMessage(req, "Page deleted successfully.");
        }
        next(err);
    });
}

function updatePageOrderAction(req, res, next) {
    var that = this, post = that.getPluginHelper().getPostParams(req),
        PageService = that.getService(PAGE_SCHEMA);
    if (!post) {
        return next(null);
    }
    PageService.updatePageOrder(post["pageOrder"].split(","), function (err, result) {
        if (result) {
            that.setRedirect(req, post.redirect);
            that.setSuccessMessage(req, "Pages re-ordered successfully.");
        }
        next(err);
    });
}

function addPageAction(req, res, next) {
    var that = this, params = req.params,
        PageService = that.getService(PAGE_SCHEMA);
    var ppId = params.ppId;
    ppId = ppId || 0;

    async.waterfall([
        function (n) {
            PageService.findById(ppId, n);
        },
        function (p, n) {
            if (ppId == 0 || p) {
                pageForm.PageForm(req.app, function (err, formObj) {
                    if (!err) {
                        req.query[that.getPluginId()] = {
                            redirect: that.getRedirectPath(req, ["view"]),
                            parentPageId: ppId
                        };
                        req.attrs.pageForm =
                            that.getFormBuilder().DynamicForm(req, formObj, "en_US", "add");
                        params.action = "edit";
                        req.attrs.showToolbar = false;
                    }
                    n(err);
                });
            }
            else {
                n(new PageService.PageNotFoundError(ppId));
            }
        }
    ], next);
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
    var that = this, PageServiceAuth = that.getService(PAGE_SCHEMA).Auth;
    PageServiceAuth.getAllPages(req.session.roles, function (err, pages) {
        if (pages && pages.length > 0) {
            var siteRoot = {
                title: "Site Root",
                key: "0",
                expand: true,
                icon: false,
                children: []
            }, json = [siteRoot], pagesJSON = {
                0: siteRoot
            };

            pages.forEach(function (page) {
                var pageJSON = getPageJSON(page);
                pagesJSON[page.pageId] = pageJSON;

                var parent = pagesJSON[page.parentPageId];
                var children = parent.children; // array
                var order = page.order;
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
        }
        next(err);
    });
}

function updatePageAction(req, res, next) {
    var that = this, PageServiceAuth = that.getService(PAGE_SCHEMA).Auth;
    var post = that.getPluginHelper().getPostParams(req),
        updateOrSave = function (err, page) {
            if (!err && page) {
                that.setRedirect(req, post.redirect);
                var msg = "Page " + (post.pageId ? "updated" : "added" ) + " successfully.";
                that.setSuccessMessage(req, msg);
            }
            next(err);
        };
    async.waterfall([
        function (n) {
            pageForm.PageForm(req.app, n);
        },
        function (formObj, n) {
            that.ValidateForm(req, formObj, n);
        }
    ], function (err, result) {
        if (!result.hasErrors) {
            // save or update
            var otherValsObj = {localizedName: {en_US: req.body[that.getPluginId()].name}},
                keyMapObj = {layoutId: "layout", themeId: "theme"};

            if (!post.pageId) {
                //save new page
                otherValsObj.rolePermissions = PAGE_PERMISSION_SCHEMA_ENTRY;
                PageServiceAuth.addPage(req, otherValsObj, keyMapObj, updateOrSave);
            }
            else {
                //update existing page
                PageServiceAuth.updatePage(req, otherValsObj, keyMapObj, updateOrSave);
            }
        }
        else {
            that.setErrorMessage(req, "entered-invalid-data");
            pageForm.PageForm(req.app, function (err, formObj) {
                if (!err) {
                    req.attrs.pageForm = that.getFormBuilder().DynamicForm(req, formObj, "en_US");
                    req.params.action = "edit";
                }
                next(err);
            });
        }
    });
}

function editPageAction(req, res, next) {
    var params = req.params,
        pageId = params.id,
        that = this, PageService = that.getService(PAGE_SCHEMA), PageServiceAuth = PageService.Auth,
        pv = new that.PermissionValidator(req, PAGE_PERMISSION_SCHEMA_ENTRY, PAGE_SCHEMA);

    var page;
    async.waterfall([
        function (n) {
            PageServiceAuth.findById(pageId, pv, n);
        },
        function (p, n) {
            if(p){
                page = p.toObject();
                pageForm.PageForm(req.app, n);
            }
            else {
                n(new PageService.PageNotFoundError(pageId));
            }
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
            var actions = ["UPDATE", "PERMISSION", "DELETE"];
            pv.checkPermissionForActions(actions, pageId, function (err, perms) {
                !err && (req.attrs.actionsPermission = perms);
                n(err, !err);
            });
        },
        function (flag, n) {
            var pv = new that.PermissionValidator(req, PAGE_PERMISSION_SCHEMA, "");
            pv.hasPermissionWithoutModelId("ADD", function (err, perm) {
                req.attrs.actionsPermission = req.attrs.actionsPermission || {};
                req.attrs.actionsPermission.ADD = perm;
                n(null, true);
            });
        }
    ], next);
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
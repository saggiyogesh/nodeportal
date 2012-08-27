/**
 * Renders a page as per route/url
 */

var plugins = require('./plugins'), Step = require('step'), DBActions = require("./DBActions"),
    DBActionsInstance = DBActions.getInstance,
    URLCreator = require("./URLCreator"), Helpers = require("./Helpers"),
    viewParserUtil = require("./view"),
    getMsg = require("./i18n").get, PageScript = require("./PageScript"), PluginHelper = require("./PluginHelper"),
    getProp = require("./AppProperties").get,
    PAGE_SCHEMA = "Page", LAYOUT_SCHEMA = "Layout", THEME_SCHEMA = "Theme",
    SettingsRenderer = require("./SettingsRenderer"),
    PluginInstanceHandler = require(process.cwd() + "/lib/PluginInstanceHandler"),
    Router = require("./Router"),
    Permissions = require("./permissions/Permissions"), _l = Debug._l,
    LOGIN_PLUGIN_ID = "login";

var EventEmitter = require('events').EventEmitter;
var layoutOneColumn = "1-col", path = require("path");

exports.renderExclusive = function (req, res) {
    renderPlugin(req, res, function (err, html) {
        if (err) {
            html = "Some Error occurred";
        }
        else {
            //noScript = true query param is used along with exclusive mode to prevent client scripts in response
            if (!req.query.noClientScript || req.query.noClientScript == false) {
                addClientScripts(req, req.params.plugin);
            }
            html = html + PageScript.render();
        }
        res.send(html);
    });
};


function renderSettingsPage(req, res, page) {
    var settings = SettingsRenderer.getInstance(req, res);
    settings.render();
}

function PageEventEmitter(req, res, theme, layout, page) {
    EventEmitter.call(this);
    this._plugins = [];
    this.req = req;
    this.res = res;
    this.theme = theme;
    this.layout = layout;
    this.page = page;
    this.pageHTML = {};
    this.init = function () {
        this.on('renderedPluginEvent', function (data) {
            var ns = data.ns, html = data.html, placeHolderName = data.placeHolder, pageHTML = this.pageHTML;
            /* if (!pageHTML.hasOwnProperty(placeHolderName)) {
             pageHTML[placeHolderName] = [];
             }
             pageHTML[placeHolderName].push(html);*/
            pageHTML[ns] = html;
            this.removePlugin(ns);
        });
    };
    this.addPlugin = function (pluginNS) {
        this._plugins.push(pluginNS);
        //this.pageHTML[pluginNS] = "";
    };
    this.removePlugin = function (pluginNS) {
        delete this._plugins.pop();
        if (this._plugins.length == 0) {
            this.renderComplete();
        }
    };
    this.renderedPlugin = function (pluginNS, placeHolderName, html) {
        //this.removePlugin(pluginNS);
//            var pageHTML = this.pageHTML;
        /*if(!pageHTML.hasOwnProperty(placeHolderName)){
         pageHTML[placeHolderName] = {};
         }*/

        this.emit('renderedPluginEvent', {ns:pluginNS, html:html, placeHolder:placeHolderName});
    };
    this.renderComplete = function () {
//            Debug._li("html", this.pageHTML, true);
        var req = this.req, res = this.res, theme = this.theme, layout = this.layout,
            page = this.page, pageHTML = this.pageHTML, app = req.app, pageData = page.data,
            options = {
                theme:theme.path + "/index",
                themeOptions:{
                    locale:"en_US",
                    pageTitle:page.localizedName["en_US"],
                    description:page.description,
                    keywords:page.keywords
                },
                layoutPath:layout.path
            };

        options.layoutOptions = {};

        layout.placeHolderNames.forEach(function (n) {
            var s = [], i = 0;
            pageData[n].forEach(function (ns) {
                s[i++] = pageHTML[ns];
            });
            options.layoutOptions[n] = s.join("");
        });

        options.themeOptions.layoutHTMLTMPL = viewParser(req, options.layoutPath, options.layoutOptions);
        options.themeOptions.req = req;

        options.themeOptions.bottomIncludes = viewParser(req, app.set('views') + '/shell/app/page_bottom', {
            page:page,
            user:req.session.user,
            req:req,
            props: {
                appURL: getProp("APP_URL")
            }
        }) + PageScript.render();

        var dbAction = DBActionsInstance(req, PAGE_SCHEMA);

        var query = dbAction.getQuery().where('friendlyURL').ne("/settings")
            .select('friendlyURL localizedName')
            .where("parentPageId", 0)
            .where("isHidden", false)
            .sort("pageId", 1);
        dbAction.authorizedGetByQuery(query, function (err, pages) {
            if (err)
                throw err;

            options.themeOptions.pages = pages;
            res.render(options.theme, options.themeOptions);
        });
//        options.themeOptions.pages = [{friendlyURL:"/home", localizedName:{en_US:"Home"}}];
//        res.render(options.theme, options.themeOptions);
    }
}

util.inherits(PageEventEmitter, EventEmitter);


function mergePageAndRender(layout, theme, page, res, req) {
    var app = req.app;
    var evt = new PageEventEmitter(req, res, theme, layout, page);
    evt.init();
    var obj = {
        layout:layout,
        theme:theme,
        page:page,
        res:res,
        req:req,
        pageRenderEvt:evt
    };
    renderLayout(obj);

}
function renderPageByLayout(req, res, theme, page, layoutFinderMethod, finderMethodArg) {
    DBActionsInstance(req, LAYOUT_SCHEMA).get(layoutFinderMethod, finderMethodArg, function (err, layout) {
        if (err)   throw err;
        page.friendlyURL == "/settings" ? renderSettingsPage(req, res, page) : mergePageAndRender(layout, theme, page, res, req);
    });
}

function renderPageByLayoutName(req, res, theme, page, layoutName) {
    renderPageByLayout(req, res, theme, page, "findByName", layoutName);
}

function renderPageByLayoutId(req, res, theme, page, layoutId) {
    renderPageByLayout(req, res, theme, page, "findByLayoutId", layoutId);
}

var showErrorPage = exports.showErrorPage = function (err, page, req, res) {
    Debug._l(err);
    if (err.hasOwnProperty("localizedMessageKey")) {
        req.attrs.errorMsgKey = err.localizedMessageKey;
    }
    else if (err.hasOwnProperty("message")) {
        req.attrs.errorMsgKey = err.message;
    }
    else {
        req.attrs.errorMsgKey = "error-occurred";
    }

    if (page && page.friendlyURL == "/settings") {
        var settings = SettingsRenderer.getInstance(req, res);
        settings.setErrorMessage(req.attrs.errorMsgKey);
        settings.render();
        return;
    }
    var pageData = {
        "col1HTMLTMPL":[ "error" ]
    },
        db = req.app.set('db'),
        next = function (pageClone) {
            DBActionsInstance(req, THEME_SCHEMA).get("findByThemeId", pageClone.themeId, function (err, theme) {
                if (err)  throw err;
                renderPageByLayoutName(req, res, theme, pageClone, layoutOneColumn);
            });
        };
    if (!page) {
        DBActionsInstance(req, PAGE_SCHEMA).get("findByFriendlyURL", getProp("DEFAULT_INDEX_PAGE"), function (err, page) {
            if (err)  throw err;

            var pageClone = _.clone(page);
            pageClone.data = pageData;
            next(pageClone);
        });
    }
    else {
        req.query.noClientScript
        var pageClone = _.clone(page);
        pageClone.data = pageData;
        next(pageClone);
    }
};


exports.checkPagePermissions = function (req, res, next) {
    var dbAction = DBActionsInstance(req, PAGE_SCHEMA);
    dbAction.get("findByFriendlyURL", "/" + req.params.page, function (err, page) {
        if (err) {
            return next(err);
        }
        if (!page) {
            //check for app routes based url
            if (Router.isAppRoute(req.url)) {
                // then url has permission of VIEW
                return next();
            }

            var PageNotFoundError = require("./errors/PageNotFoundError");
            return next(new PageNotFoundError("Not Exists: Page with friendly url : /" + req.params.page));
        }

        req.attrs.page = page;

        dbAction.hasPermission(page.pageId, Permissions.ActionKeys.VIEW, function (err, isAuth) {
            if (err) {
//                Debug._li("Chk in middleware Not Authorized pageId : " + page.pageId);
//                require("../login/LoginUtil").showLogin(req, res);
                if (req.xhr) {
                    res.json({ error:"Permission Error" });
                }
                else {
                    showErrorPage(err, page, req, res);
                }
            }
            else {
//                Debug._li("Chk in middleware Authorized pageId : " + page.pageId);
                next();
            }
        });
    });
};


function doRender(req, res, mode) {
    var app = req.app;
    var indexPage = getProp("DEFAULT_INDEX_PAGE"), param = !req.params.page ? indexPage : '/' + req.params.page,
        db = app.set('db');//, get = DBActions.get;
    var page = req.attrs.page;
    DBActionsInstance(req, THEME_SCHEMA).get("findByThemeId", page.themeId, function (err, theme) {
        if (err)  throw err;
//        Debug._li("Authorized pageId : " + page.pageId);
        if (mode && mode == "maximized") {
            //maximized mode fetch pluginId and open the plugin in maximized mode with one col
            //layout, altering the pageData dynamically
            var pluginId = req.params.plugin;
            /*
             if (req.params.iId) {
             pluginId += "_" + req.params.iId;
             }*/
            var namespace = req.params.namespace;

            var pageData = {
                "col1HTMLTMPL":[ namespace ]
            };
            var pageClone = _.clone(page);

            pageClone.data = pageData;
            renderPageByLayoutName(req, res, theme, pageClone, layoutOneColumn);
        }
        else {
            // page rendering for normal mode
            renderPageByLayoutId(req, res, theme, page, page.layoutId);
        }
    });

}
var renderMaximized = exports.renderMaximized = function (req, res) {
    doRender(req, res, "maximized");
};


exports.render = function (req, res) {
    // only way to find plugin
    // now it's there as from BasePluginController is passed ( Is Tested ??)
    var pluginId = req.params.plugin ? req.params.plugin : req.url.split('/')[2];
    if (!req.params.plugin) {
        req.params.plugin = pluginId;
    }
    req.params.namespace = PluginHelper.getNamespace(req);
    if (req.query && req.query.mode === "exclusive") {
        exports.renderExclusive(req, res);
    } else if (req.query && req.query.mode === "maximized") {
        exports.renderMaximized(req, res);
    } else {
        exports.renderNormal(req, res);
    }
};

exports.renderNormal = function (req, res) {
    doRender(req, res);
};

var renderPlugin = exports.renderPlugin = function (req, res, next) {
    var path = req.app.set('appPath'), viewLib = require(path + '/lib/viewLibs/lib'),
        pluginId = req.params.plugin, iId = req.params.iId, arr, pluginObj = plugins.get(pluginId),
        ns = req.params.namespace, message = req.attrs.errorMsg;

    if (ns && message && message.indexOf(ns) > -1) {
        delete req.attrs.errorMsgKey;
        return next(null, renderErrorMsg(req.app, {message:message.split(":")[1]}));
    }
    pluginObj.exec.render(req, res, function (err, arr) {
        if (err) {
            var errStr = err.stack || err.toString();
            Debug._l(errStr);
            var message;
            if (err.hasOwnProperty("localizedMessageKey")) {
                message = getMsg({key:err.localizedMessageKey});
            }
            else if (err.hasOwnProperty("message")) {
                message = err.message;
            }
            else {
                message = getMsg({key:"error-occurred"})
            }
            return next(null, renderErrorMsg(req.app, {message:message}));
        }
        var html;
        if (arr) {
            arr[1].viewLib = viewLib;
            arr[1].req = req;
            arr[1].res = res;

            //client js code to call a function after pluginIn gets loaded
            var pluginProps = pluginObj.props, pluginOptions = {
                "namespace":req.params.namespace,
                props:pluginProps
            };
            arr[1].namespace = pluginOptions.namespace;
            var codeString = "Rocket.Plugin.onLoad(" + JSON.stringify(pluginOptions) + ")";
            PageScript.add(codeString);
            var pluginViewPath = path + "/plugins/" + pluginId + "/views/" + arr[0] + ".jade";

            html = viewParser(req, pluginViewPath, arr[1]);
        }
        next(null, html);
    });

};

function renderLayout(obj) {
    var layout = obj.layout, theme = obj.theme, page = obj.page, pageData = page.data, req = obj.req, res = obj.res, title = obj.title;
    var path = req.app.set('appPath'), themePath = theme.path, placeHolderNames = layout.placeHolderNames,
        pageRenderEvt = obj.pageRenderEvt, isEmptyPage;

    var afterPluginRender = function (pluginInstance, pluginContent, placeHolderName, customClass, dbAction) {
        var pluginNS = pluginInstance.pluginNamespace, showTools = false, showSettingIcon = false, showCloseIcon = false;

        if (req.session.roles[0] == "Administrator") {
            showTools = showSettingIcon = showCloseIcon = true;
        } else {
            var id = pluginInstance.pluginInstanceId;
            if (id) {
                showCloseIcon = dbAction.hasPermissionSync(id, Permissions.ActionKeys.DELETE).isAuthorized;
                showSettingIcon = dbAction.hasPermissionSync(id, Permissions.ActionKeys.SETTINGS).isAuthorized;
                showTools = showSettingIcon || showCloseIcon;
            }
        }

        var html = viewParser(req, themePath + "/plugin", {
            customPluginClass:customClass,
            pluginTitle:pluginInstance.title["en_US"],
            toolsHTMLTMPL:"",
            contentHTMLTMPL:pluginContent,
            namespace:pluginNS,
            req:req,
            res:res,
            showTools:showTools,
            showSettingIcon:showSettingIcon,
            showCloseIcon:showCloseIcon
        });
        pageRenderEvt.renderedPlugin(pluginNS, placeHolderName, html);
    };

    if (req.attrs.hasOwnProperty("errorMsgKey")) {
        pageRenderEvt.pageHTML["error"] = renderErrorMsg(req.app, {message:getMsg({key:req.attrs.errorMsgKey})});
        pageRenderEvt.renderComplete();
    }
    var dbAction = DBActions.getInstance(req, "PluginInstance");
    dbAction.permissions = PluginInstanceHandler.Permissions;

    var next = function (pluginInstance, placeHolderName) {
        if (pluginInstance) {
            var pluginNS = pluginInstance.pluginNamespace;
            var AJAX_TMPL = "<div id='" + pluginNS + "' />", pluginContent, customClass = "", plugin,
                obj = PluginHelper.getPluginIdAndIId(pluginNS);
            var cloneReq = PluginHelper.cloneRequest(req), pluginId = obj.pluginId;
            cloneReq.params.plugin = pluginId;
            cloneReq.params.iId = obj.iId;
            cloneReq.params.namespace = pluginNS;
            plugin = plugins.get(pluginId);
            if (!PluginHelper.isAsync(plugin.props)) {
                renderPlugin(cloneReq, res, function (err, pluginContent) {
                    if (err) {
                        throw err;
                    }
                    addClientScripts(req, pluginId);
                    afterPluginRender(pluginInstance, pluginContent, placeHolderName, customClass, dbAction);
                });
            } else {
                pluginContent = AJAX_TMPL;
                //add async caller to client script
                var codeString = "Rocket.AsyncCaller.attach('" + pluginNS + "');";
                PageScript.add(codeString);
                // customClass = pluginId;
                afterPluginRender(pluginInstance, pluginContent, placeHolderName, customClass, dbAction);
            }
        }
        else {
            var html = "plugin not exists";
            pageRenderEvt.renderedPlugin(pluginNS, placeHolderName, html);
        }
    };

    placeHolderNames.forEach(function (placeHolderName) {
        pageData[placeHolderName].forEach(function (ns) {
            if (ns) {
                isEmptyPage = true;
                pageRenderEvt.addPlugin(ns);
                dbAction.get("findByPluginNamespaceAndPageId", [ns, page.pageId], function (err, pluginInstance) {
                    if (err) throw err;

                    if (!pluginInstance && req.query.mode == "maximized" && ns == LOGIN_PLUGIN_ID) {
                        pluginInstance = {
                            pluginNamespace:ns,
                            title:plugins.get(LOGIN_PLUGIN_ID).name
                        };
                        next(pluginInstance, placeHolderName);
                    }
                    else if (!pluginInstance && ns == "error") {
                        pluginInstance = {
                            pluginNamespace:ns,
                            title:plugins.get("error").name
                        };
                        next(pluginInstance, placeHolderName);
                    }
                    else {
                        dbAction.hasPermission(pluginInstance.pluginInstanceId, Permissions.ActionKeys.VIEW, function (err, isAuth) {
                            if (err && err.toString().indexOf("PermissionError") == -1) {
                                throw err;
                            }
                            if (!isAuth) {
                                return pageRenderEvt.removePlugin(pluginInstance.pluginNamespace);
                            }
                            next(pluginInstance, placeHolderName);
                        });
                    }
                });
            }
        });
    });

    if (!isEmptyPage) {
        pageRenderEvt.renderComplete();
    }
}

function parseSettingsPage(req, themePath) {
    var app = req.app;
    return {"col1HTMLTMPL":viewParser(req, app.set('views') + "/shell/app/settings/index", {})}
}

function addClientScripts(req, pluginId) {
    var pluginClientScriptURL = "/static/" + pluginId + "/" + pluginId + ".js"
    var pluginsHome = req.app.set('appPath') + "/plugins";
    var filePath = pluginsHome + "/" + pluginId + "/client/" + pluginId + ".js";
    if (path.existsSync(filePath)) { //PP
        PageScript.addBottomScript(pluginId, pluginClientScriptURL);

    }
}

var viewParser = exports.viewParser = function (req, id, options) {
    var app = req.app;
    try {
        return viewParserUtil.parseView(app, id, options);
    } catch (e) {
        Debug._l(e.stack);
        return renderErrorMsg(app, e);
    }
};

function renderErrorMsg(app, err) {
    return viewParserUtil.parseView(app, "shell/app/errors/errorTemplate", {errorMessage:err.message});
}
var Plugins = require("../plugins"),
    ViewLibs = require("../viewLibs/lib"),
    FileUtil = require("../file/FileUtil"),
    PageScript = require("../PageScript"),
    PluginHelper = require("../PluginHelper"),
    ViewHelper = require("../ViewHelper"),
    PermissionValidator = require("../permissions/PermissionValidator"),
    ThemeUtil = require("../ThemeUtil"),
    PermissionError = require("../permissions/PermissionError"),
    getProp = require("../AppProperties").get,
    RendererUtil = require("./RendererUtil");

var ROOT_PATH = utils.getRootPath(), PLUGINS_DIR = "plugins", VIEWS_DIR = "views";

/**
 * Constructor to create Plugin render, which will render the plugin's html
 * @param pluginInstance {Object} Plugin Instance model
 * @param rendererInstance {PageRenderer} instance of PageRenderer
 * @constructor
 */
function PluginRender(pluginInstance, rendererInstance) {
    this._view = "index.jade";
    this._locals = {};

    var ns = pluginInstance.pluginNamespace, obj = PluginHelper.getPluginIdAndIId(ns), pluginId = obj.pluginId,
        req = PluginHelper.cloneRequest(rendererInstance.req, pluginId), res = rendererInstance.res;

    Object.defineProperties(req.params, {
        plugin: {
            value: obj.pluginId
        },
        iId: {
            value: obj.iId
        },
        namespace: {
            value: ns
        }
    });


    Object.defineProperties(req, {
        pluginRender: {
            value: this
        }
    });

    Object.defineProperties(this, {
        req: {
            value: req
        },
        res: {
            value: res
        },
        pluginId: {
            value: req.params.plugin
        },
        iId: {
            value: req.params.iId
        },
        plugin: {
            value: Plugins.get(req.params.plugin)
        },
        namespace: {
            value: req.params.namespace
        },
        pluginInstance: {
            value: pluginInstance
        },
        theme: {
            value: rendererInstance.theme
        },
        page: {
            value: rendererInstance.page
        },
        pluginPermissionValidator: {
            value: rendererInstance.pluginPermissionValidator
        },
        pagePermissionValidator: {
            value: rendererInstance.pagePermissionValidator
        },
        pluginInstanceDBAction: {
            value: rendererInstance.pluginInstanceDBAction
        },
        isExclusive: {
            value: rendererInstance.isExclusive
        }
    });
}

/**
 * Returns async plugin's template
 * @returns {String}
 */
PluginRender.prototype._getAsyncTMPL = function () {
    return  "<div id='" + this.namespace + "' />";
};

/**
 * Returns the real path of jade view file
 * @returns {String}
 */
PluginRender.prototype._getViewPath = function () {
    return FileUtil.realPath(ROOT_PATH, PLUGINS_DIR, this.pluginId, VIEWS_DIR, this._view);
};

/**
 * Sets jade view
 * @param viewName
 * @returns {PluginRender}
 */
PluginRender.prototype.setView = function (viewName) {
    this._view = viewName || "index";
    return this;
};

/**
 * Sets locals for the jade view
 * @param locals
 * @returns {PluginRender}
 */
PluginRender.prototype.setLocals = function (locals) {
    this._locals = locals;
    return this;
};

/**
 * Add a new local to existing locals object.
 * @param key {String} key to set local in locals
 * @param local {*} value to put in locals for key
 * @returns {PluginRender}
 */
PluginRender.prototype.addLocal = function (key, local) {
    this._locals[key] = local;
    return this;
};

/**
 * Renders plugins tools. Permissions also checked for tools icons.
 * @param pluginInstance  {Object} Plugin Instance model
 * @param cb {Function} Callback have err & tools html
 */
PluginRender.prototype._tools = function (pluginInstance, cb) {
    var that = this, page = that.page, id = pluginInstance.pluginInstanceId,
        namespace = that.namespace, showTools = false, showSettingIcon = false, showCloseIcon = false;

    async.waterfall([
        function (n) {
            that.pagePermissionValidator.hasPermission("REMOVE_PLUGIN", page.pageId, function (err, perm) {
                if (!err) {
                    showCloseIcon = true;
                }
                n();
            });
        },
        function (n) {
            that.pluginPermissionValidator.hasPermission("SETTINGS", id, function (err, perm) {
                if (!err) {
                    showSettingIcon = true;
                }
                showTools = showSettingIcon || showCloseIcon;
                n();
            });
        },
        function (n) {
            ThemeUtil.pluginTools({
                id: namespace,
                showTools: showTools,
                showSettingIcon: showSettingIcon,
                showCloseIcon: showCloseIcon
            }, n);
        }
    ], cb);
};

/**
 * Method called plugin html is rendered. This will merge tools html & plugin content in theme's plugin tmpl
 * @param content {String} rendered html of plugin
 * @param cb {Function} Callback have err & final plugin html
 */
PluginRender.prototype._afterRender = function (content, cb) {
    var that = this, pluginInstance = that.pluginInstance, themePath = that.theme.path, req = that.req,
        res = that.res, page = that.page,
        namespace = that.namespace, showTools = false, showSettingIcon = false, showCloseIcon = false;

    var skipTool = pluginInstance.skipTool && pluginInstance.skipTool == true;
    async.waterfall([
        function (n) {
            skipTool ? n(null, "") : that._tools(pluginInstance, n);
        },
        function (toolContent, n) {
            ViewHelper.render(
                { path: ThemeUtil.getThemeRealPath(themePath) + "/tmpl/plugin" },
                {
                    customPluginClass: that.pluginId,
                    pluginTitle: pluginInstance.title.en_US,
                    contentHTMLTMPL: content,
                    namespace: namespace,
                    req: req,
                    res: res,
                    tools: toolContent
                },
                n
            );
        }
    ], cb);
};

/**
 *
 * @param err {Error} error occurred while processing plugin
 * @param cb {Function} arguments are null & array
 */
PluginRender.prototype._renderPluginError = function (err, cb) {
    var that = this, req = that.req, res = that.res,  ns = that.namespace;
    async.waterfall([
        function (n) {
            //skip show permission error
            if (!req.session.loggedIn || ((err instanceof PermissionError) && (getProp("SHOW_PLUGIN_VIEW_PERMISSION_ERR") == false))) {
                n({skipPermissionError: true, content: ""});
            }
            else {
                n();
            }
        },
        function (n) {
            RendererUtil.renderErrorTMPL(err, req, getProp("PLUGIN_ERROR_TMPL"), n)
        },
        function (content, n) {
            that.isExclusive ? n(null, content) : that._afterRender(content, n);
        }
    ], function (err, content) {
        if (err && err.skipPermissionError) {
            err = null;
            content = "";
        }
        if (err) {
            Debug._l(err.stack || err);
            content = err.message || err.toString();
        }
        cb(null, [ns, content])
    });
};

/**
 *
 * @param err {Error} error occurred while processing plugin
 * @param cb {Function} arguments are null & array
 */
PluginRender.prototype.render = function (err, cb) {
    var that = this, req = that.req, res = that.res, pluginId = that.pluginId, iId = that.iId,
        plugin = that.plugin, ns = that.namespace, PageScript = req.attrs.PageScript;

    if (err) {
        that._renderPluginError(err, cb);

    } else {
        var pluginProps = plugin.props, pluginOptions = {
                "namespace": ns,
                props: pluginProps
            },
            isAsyncPlugin = PluginHelper.isAsync(plugin.props), content;
        async.waterfall([
            function (n) {
                if (isAsyncPlugin) {
                    var codeString = "Rocket.AsyncCaller.attach('" + ns + "');";
                    PageScript.add("asyncCaller", codeString);
                    content = that._getAsyncTMPL();
                    n(null);
                } else {
                    plugin.exec.render(req, res, n);
                }
            },
            function (n) {
                if (!isAsyncPlugin) {
                    PageScript.addPluginLoad(pluginOptions);
                    var locals = that._locals;
                    locals.viewLib = ViewLibs;
                    locals.req = req;
                    locals.res = res;
                    locals.namespace = ns;
                    ViewHelper.render({path: that._getViewPath()}, locals, function (err, c) {
                        !err && (content = c);
                        n(err)
                    });
                }
            },
            function (n) {
                that.isExclusive ? n(null, content) : that._afterRender(content, n);
            }
        ], function (err, result) {
            if (err) {
                that._renderPluginError(err, cb);
            }
            else{
                cb(null, [ns, result]);
            }
        });
    }
};

module.exports = PluginRender;

var ViewHelper = require("../ViewHelper"),
    getProp = require("../AppProperties").get,
    CacheStore = require("../CacheStore"),
    jadeRuntime = require("jade").runtime;

var SCRIPT_JADE = __dirname + "/script.jade",
    SCRIPT_START_TAG = "<script>", SCRIPT_END_TAG = "</script>",
    PLUGIN_MODULE = "plugin";

var scriptsCacheStore = getProp("BOTTOM_SCRIPTS_CACHE_STORE") , ScriptsCache,
    CACHE_ID = "bottom.scripts.cache.store", DEFAULT_CACHE_OPTIONS = {
        id: CACHE_ID
    };

if (scriptsCacheStore) {
    ScriptsCache = CacheStore.create(scriptsCacheStore, DEFAULT_CACHE_OPTIONS);
}

/**
 * Constructor to create a PageScript object for each request.
 * Client js code added will be rendered at last in the html.
 * @param req {Object} Request object
 * @constructor
 */
function PageScript(req) {
    var codeList = [], bottomScriptList = [], cacheKey;

    /**
     * Add plugin load code. Called for each configured plugin on page.
     * @param pluginOptions {Object} Plugin options object described in plugin properties
     */
    this.addPluginLoad = function (pluginOptions) {
        var pluginLoadJSCode = "Rocket.Plugin.onLoad(" + JSON.stringify(pluginOptions) + ")";
        codeList.push({modules: PLUGIN_MODULE, code: pluginLoadJSCode});
    };

    /**
     * Method adds the code & required modules
     * @param modules {String} Comma separated list of modules, will be passed to require.js
     * @param code {String} Client script Code
     */
    this.add = function (modules, code) {
        codeList.push({modules: modules, code: code});
    };

    /**
     * Method used to include the code block passed to "BottomScript" mixin
     * @param block {Function} jade mixin function
     * @param opts {Object} locals or opts passed to "BottomScript" mixin
     */
    this.addPageBottomCode = function (block, opts) {
        opts.jade = jadeRuntime;
        var func = new Function(_.keys(opts), "var jade_debug = [{filename: ''}]," +
            " buf = [], jade_indent = [], jade_interp;" +
            "(" + block + ")(); return buf.join('')");

        bottomScriptList.push(func.apply(null, _.values(opts)).replace(/<[\/]{0,1}(script|SCRIPT)[^><]*>/g, "").trim());
    };

    /**
     * Renders the scripts added or included in this object into html
     * @param cb {Function} callback function - arguments - err, html
     */
    this.render = function (cb) {
        //if cache is configured, get cache key
        if (ScriptsCache) {
            var page = req.attrs.page;
            cacheKey ||
            (cacheKey = utils.replaceAll(req.url.replace(/\/$/, ""), "/", "_")+ "__" + page.pageId + "__" + req.session.user.userId);
        }

        /**
         * Function renders html.
         * @param callback {Function} callback function - arguments - err, html
         */
        function renderHTML(callback) {
            async.map(codeList, function (locals, n) {
                locals.req = req;
                ViewHelper.render({
                    cache: true,
                    path: SCRIPT_JADE
                }, locals, n)
            }, function (err, buf) {
                if (!err) {
                    buf = buf || [];
                    buf.splice(0, 0, SCRIPT_START_TAG);
                    buf.push(bottomScriptList.join(""));
                    buf.push(SCRIPT_END_TAG);
                }
                callback(err, buf.join(""));
            });
        }

        if (ScriptsCache) {
            ScriptsCache.wrap(cacheKey, function (callback) {
                renderHTML(callback)
            }, cb);
        }
        else {
            renderHTML(cb);
        }

    }
}

module.exports = PageScript;
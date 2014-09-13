var jade = require("jade"),
    getProp = require("../AppProperties").get,
    FileUtil = require("../file/FileUtil"),
    CacheStore = require("../CacheStore"),
    path = require("path"),
    DynamicParser = require("./DynamicParser");

var tmplCacheStore = getProp("TMPL_CACHE_STORE"), TMPLCache, TMPLFnCache,
    CACHE_ID = "view.jade.cache.store", FN_CACHE_ID = "view.jade.fn.cache.store", JADE_EXT = ".jade";

if (tmplCacheStore) {
    TMPLCache = CacheStore.create(tmplCacheStore, {id: CACHE_ID});
    TMPLFnCache = CacheStore.createMemoryCacheStore({id: FN_CACHE_ID});
}

/**
 * Error when jade path variable is undefined.
 * @param path {String} path of Jade file
 * @constructor
 */
function JadePathNotDefinedError(path) {
    Error.captureStackTrace(this);
    this.message = "Jade tmpl file not found: " + path;
    this.name = "JadePathNotDefinedError"
}
JadePathNotDefinedError.prototype = Object.create(Error.prototype);

/**
 * Options:
 *      [cache]: {Boolean} Flag used to enable caching of jade tmpl & parsed functions
 *               Property "tmpl.cache.store" must have a value to create CacheStore.
 *               Otherwise caching is not possible.
 *      path: {String} Jade file path
 *
 * @param options {Object}
 * @param locals {Object} Object used for parsing jade tmpl
 * @param next {Function} callback. parameters are err, html
 */
exports.render = function (options, locals, next) {
    //tmpl cache must be configured. By default caching is true.
    var cache = !!tmplCacheStore && (options.cache  || true),
        filePath = options.path;
    if (!filePath) {
        return next(new JadePathNotDefinedError(filePath));
    }

    if (path.extname(filePath) !== JADE_EXT) {
        filePath = filePath + JADE_EXT;
    }

    async.waterfall([
        function (n) {
            //jade tmpl file string
            if (cache) {
                TMPLCache.wrap(filePath, function (cb) {
                    FileUtil.readFile(filePath, function (e, s) {
                        s = s.toString();
                        cb(e, s)
                    });
                }, n);
            }
            else {
                FileUtil.readFile(filePath, n);
            }
        },
        function (str, n) {
            var options = { filename: filePath, pretty: true, parser: DynamicParser };

            function compile() {
                var err, fn;
                try {
                    fn = jade.compile(str, options)
                } catch (e) {
                    err = e;
                    Debug._l(e.stack);
                }
                return {fn: fn, err: err};
            }

            // jade complied function
            if (cache) {
                TMPLFnCache.wrap(filePath, function (cb) {
                    var ret = compile();
                    cb(ret.err, ret.fn);
                }, n);
            }
            else {
                var ret = compile();
                n(ret.err, ret.fn);
            }
        },
        function (fn, n) {
            var s, err;
            try {
                s = fn(locals)
            } catch (e) {
                err = e;
            }
            n(err, s);
        }
    ], next);

};



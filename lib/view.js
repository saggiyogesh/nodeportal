var merge = require('connect').utils.merge, union = require('./utils').union,
    express = require('express'),
    jade = require("jade"),
    PageScript = require("./PageScript");
var SCRIPT_START_TAG = "<script>", SCRIPT_END_TAG = "</script>";

//var lookupView = function(absPath, options) {
//    var orig = view = new express.View(absPath, options);
//    // TODO write code to process the partial and improve this code tooo
//
//    view.original = orig;
//    return view;
//};


exports.parseView = function (app, tmplPath, opts, fn, parent, sub) {
    var options = {}, self = this, root = app.set('views') || process.cwd()
        + '/views', expressView = express.view;

    // cache id
    var cid = app.enabled('view cache') ? tmplPath
        + (parent ? ':' + parent.path : '') : false;

    // merge app.locals
    union(options, app.locals);

    // merge res.locals
    merge(options, this.locals);

    // merge render() options
    if (opts)
        merge(options, opts);

    // merge render() .locals
    if (opts && opts.locals)
        merge(options, opts.locals);

    // status support
    if (options.status)
        this.statusCode = options.status;

    // capture attempts
    options.attempts = [];

    var partial = options.isPartial, layout = options.layout;

    // Layout support
    // if (true === layout || undefined === layout) {
    // layout = 'layout';
    // }

    // Default execution scope to a plain object
    options.scope = options.scope || {};

    // Populate view
    options.parentView = parent;

    // "views" setting
    options.root = root;

    // "view engine" setting
    options.defaultEngine = app.set('view engine');

    // charset option
    if (options.charset)
        this.charset = options.charset;

    /*// Always expose partial() as a local
     options.partial = function (path, opts) {
     // return renderPartial(self, path, opts, options, view);
     };*/
    // View lookup
    options.hint = app.enabled('hints');

    jade.filters.script = function (code, path) {
        //TODO if env is prod then no need to format the code and cache the filtered code
        Debug._li("", path, true);
        var formattedCode = [];
        code.split("\n").forEach(function (s) {
            formattedCode.push("  " + s);
        });
        code = "script\n" + formattedCode.join("\n");
//        console.log(">> "+code);
        var fn = jade.compile(code, { pretty: true });
        code = fn(opts).replace(SCRIPT_START_TAG, "").replace(SCRIPT_END_TAG, "");
//        console.log(",, "+code);
        PageScript.push(code);
        return  "";
    };
    var view = expressView.compile(tmplPath, app.cache, cid, options);

    return view.fn.call(options.scope, options);
};
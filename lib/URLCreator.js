var queryString = require("querystring");
var _ = require("underscore"), PluginHelper = require("./PluginHelper");
function URL(parameters) {
    var that = this;
    that.parameters = parameters || {};
    that.options = {
        namespace:null,
        action:null,
        mode:null,
        pageFriendlyURL:null
    };
}

URL.prototype.setNamespace = function (namespace) {
    var that = this;
    that.options.namespace = namespace;
    return that;
};

URL.prototype.setPageFriendlyURL = function (pageFriendlyURL) {
    var that = this;
    that.options.pageFriendlyURL = pageFriendlyURL;
    return that;
};

URL.prototype.setAction = function (action) {
    var that = this;
    that.options.action = action;
    return that;
};

URL.prototype.setMode = function (mode) {
    var that = this;
    that.options.mode = mode;
    return that;
};

URL.prototype.setParameters = function (parameters) {
    var that = this;
    that.parameters = parameters;
    return that;
};

URL.prototype.setParameter = function (key, value) {
    var that = this;
    that.parameters[key] = value;
    return that;
};


URL.prototype.toString = function () {
    var that = this;
    var url = [];
    var opts = that.options;
    if (!opts.pageFriendlyURL) {
        throw new Error("Page Friendly URL is not defined.");
    }
    url.push((opts.pageFriendlyURL.indexOf("/") == -1 ? "/" + opts.pageFriendlyURL : opts.pageFriendlyURL) + "/");
    if (opts.namespace.indexOf("_") > -1) {
        var pluginParts = opts.namespace.split("_");
        url.push(pluginParts[0]);
        url.push("/");
        url.push(pluginParts[1]);
        url.push("/");
    }
    else {
        url.push(opts.namespace);
        url.push("/");
    }
    url.push(opts.action);
    var params = _.clone(that.parameters);
    if (opts.mode) {
        params["mode"] = opts.mode;
    }
    if (Object.keys(params).length > 0) {
        url.push("?");
        url.push(queryString.stringify(params));
    }

    return url.join("");
};

exports.createURL = function (parameters) {
    return new URL(parameters);
};


exports.createMaximizedURL = function (parameters) {
    var url = new URL(parameters);
    url.setMode("maximized");
    return url;
};

exports.createExclusiveURL = function (parameters) {
    var url = new URL(parameters);
    url.setMode("exclusive");
    return url;
};

var createURLFromRequest = exports.createURLFromRequest = function (req) {
    var params = req.params, pageUrl = params.page, namespace = params.namespace || PluginHelper.getNamespace(req),
        query = req.query, action = query.action || params.action, mode = query.mode;

    var url = new URL(query);
    url.setMode(mode);
    url.setAction(action);
    url.setPageFriendlyURL(pageUrl);
    url.setNamespace(namespace);
   /* if(query.action) delete query.action;
    if(query.mode) delete query.mode;*/
    return url;
};

exports.createMaximizedURLFromRequest = function (req) {
    req.query.mode = "maximized";
    return createURLFromRequest(req);
};

exports.createExclusiveURLFromRequest = function (req) {
    req.query.mode = "exclusive";
    return createURLFromRequest(req);
};
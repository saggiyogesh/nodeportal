var PageRenderer = require("./PageRenderer"),
    FileUtil = require("../file/FileUtil"),
    ViewHelper = require("../ViewHelper"),
    RendererUtil = require("./RendererUtil"),
    ResponseHelper = require("../ResponseHelper"),
    PageNotFoundError = require("../errors/PageNotFoundError"),
    PermissionError = require("../permissions/PermissionError"),
    getProp = require("../AppProperties").get,
    getMsg = require("../i18n").get;

var DEFAULT_ERR_TMPL = "/views/shell/app/errors/errorTemplate",
    ERROR_NS = "error";

/**
 * Constructor to create ErrorRenderer
 * @param err
 * @param req
 * @param res
 * @constructor
 */
function ErrorRenderer(err, req, res) {
    PageRenderer.call(this, req, res);
    Object.defineProperties(this, {
        err: {
            value: err || new Error()
        }
    });
    req.attrs.isErrorPage = true;
}

util.inherits(ErrorRenderer, PageRenderer);

ErrorRenderer.prototype.renderBottomIncludes = function (next) {
    next(null, "");
};

ErrorRenderer.prototype._eachNS = function (ns, next) {
    var that = this, page = that.page, req = this.req;
    that.renderErrorByStatusCode(function (err, html) {
        next(err, [ERROR_NS, html]);
    });
};

ErrorRenderer.prototype.render = function (next) {
    var that = this, req = that.req, page = that.page, res = that.res, err = that.err;

    var pageData = {
        "col1HTMLTMPL": [ERROR_NS]
    };

    page.data = pageData;

    //set status code in response
    if (res.statusCode === 200) {
        if (err instanceof PageNotFoundError) {
            ResponseHelper.set404StatusCode(res);
        }
        else if (err instanceof PermissionError) {
            ResponseHelper.set401StatusCode(res);
        }
        else if (err.statusCode && _.isNumber(err.statusCode)) {
            ResponseHelper.setStatusCode(err.statusCode, res);
        }
        else {
            ResponseHelper.set500StatusCode(res);
            err.localizedMessageKey = "error-occurred";
        }
    }

    if (req.xhr) { // request is xhr, send err as json in response
        ResponseHelper.setError(req, err);
        ResponseHelper.handleXHRErrorResponse(req, res);
    }
    else {
        async.waterfall([
            function (n) {
                that._init({methodName: "getByName", args: [that.LAYOUT_ONE_COLUMN_NAME]}, n);
            },
            function (n) {
                that._render(n);
            }
        ], function (err, pageContent) {
            if (err) return next(err);
            else {
                ResponseHelper.handleResponse(req, res, pageContent);
            }
        });
    }
};

/**
 * Method renders error template.
 * @param tmplPath {String} path of error template
 * @param cb {Function} Callback. err & html are parameters
 */
ErrorRenderer.prototype.renderErrorTMPL = function (tmplPath, cb) {
    var that = this, req = that.req;
    req.attrs.homeURL = getProp("DEFAULT_INDEX_PAGE");
    tmplPath = tmplPath || DEFAULT_ERR_TMPL;

    RendererUtil.renderErrorTMPL(that.err, req, tmplPath, cb);
};

//ErrorRenderer.prototype.renderPluginError = function (cb) {
//    this.renderErrorTMPL(getProp("PLUGIN_ERROR_TMPL"), cb);
//};

ErrorRenderer.prototype.render404 = function (cb) {
    this.renderErrorTMPL(getProp("APP_404_ERROR_TMPL"), cb);
};

ErrorRenderer.prototype.render500 = function (cb) {
    this.renderErrorTMPL(getProp("APP_500_ERROR_TMPL"), cb);
};

/**
 * Case for permission error
 * @param cb
 */
ErrorRenderer.prototype.render401 = function (cb) {
    this.renderErrorTMPL(getProp("APP_401_ERROR_TMPL"), cb);
};

ErrorRenderer.prototype.render200 = function (cb) {
    this.renderErrorTMPL(null, cb);
};


ErrorRenderer.prototype.renderErrorByStatusCode = function (cb) {
    this["render" + this.res.statusCode](cb);
};
module.exports = ErrorRenderer;
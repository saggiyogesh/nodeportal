var
    FileUtil = require("../file/FileUtil"),
    ViewHelper = require("../ViewHelper"),
    ViewLibs = require("../viewLibs/lib"),
    getProp = require("../AppProperties").get,
    getMsg = require("../i18n").get;

/**
 * Returns error message. First check for localized key, then checks for message key if not present then
 * localized message of "error-occurred" key is returned.
 * @param err {Error}
 * @returns {String}
 */
exports.getErrorMessage = function (err) {
    Debug._l(err.stack || err);
    var errorMsg;
    if (err.hasOwnProperty("localizedMessageKey")) {
        errorMsg = getMsg({key: err.localizedMessageKey});
    }
    else if (err.hasOwnProperty("message")) {
        errorMsg = err.message;
    }
    else {
        errorMsg = getMsg({key: "error-occurred"});
    }
    return errorMsg;
};

/**
 * Method renders error template.
 * @param err {Error} Error object
 * @param req {Object} request object
 * @param tmplPath {String} path of error template
 * @param cb {Function} Callback. err & html are parameters
 */
exports.renderErrorTMPL = function (err, req, tmplPath, cb) {
    var locals = {
        req: req,
        viewLib: ViewLibs,
        errorMessage: exports.getErrorMessage(err)
    };
    ViewHelper.render({
        path: FileUtil.realPath(utils.getRootPath(), tmplPath),
        cache: true
    }, locals, cb);
};
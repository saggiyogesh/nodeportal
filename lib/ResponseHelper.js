/**
 * Helper for handling the response and support response (res) object methods
 */

var PageRenderer = require("./PageRenderer"), PluginHelper = require("./PluginHelper"),
    getMsg = require("./i18n").get;
var _ = require("underscore");

function downloadResponse(err, path) {
    // if an error occurs in this callback
    // the file most likely does not exist,
    // and it's safe to respond or next(err)
    if (err) {
        throw err;
    }

    // the file has been transferred, do not respond
    // from here, though you may use this callback
    // for stats etc.
    global.Debug._l('transferred %s', path);
}

function downloadTransmissionErrorHandler(err) {
    // this second optional callback is used when
    // an error occurs during transmission
    if (err) {
        throw err;
    }
}
var callResponseMethod = exports.callResponseMethod = function (err, req, res) {
    if (err) {
        var page = req.attrs.page, ns = PluginHelper.getNamespace(req);
        var getErrMsg = function (err, ns) {
            var errStr = err.stack || err.toString();
            Debug._l(errStr);
            if (err.hasOwnProperty("localizedMessageKey")) {
                return ns + ":" + getMsg({key: err.localizedMessageKey});
            }
            else if (err.hasOwnProperty("message")) {
                return ns + ":" + err.message;
            }
            else {
                return ns + ":" + getMsg({key: "error-occurred"});
            }
        };

        //set error status code for ok status code
        //if error code is 404 then status code is not changed.
        if (exports.is200Response(res)) {
            exports.set500StatusCode(res);
        }

        if (req.xhr) {
//            var ret = {status: "error"};
//            ret.message = ns ? getErrMsg(err, ns) : err.toString();

            //writing err response
            //res.json(ret);
            //return;
            exports.setError(req, err);
        }

        //handling errors for app routes in this case page is null
        else if (page && ns) {
            req.attrs.errorMsg = getErrMsg(err, ns);
        } else {
            return PageRenderer.showErrorPage(err, page, req, res);
        }
    }

    var method = req.attrs.method;
    if (!method) {
        PageRenderer.render(req, res);
    }
    else {
        if (method == "redirect" && req.xhr) {
            res.json({status: "success"});
            return;
        }

        var ret = req.attrs.value;
        if (!_.isArray(ret)) {
            ret = [ret];
        }
        // call to methods other than render like redirect or send

        // add helper function  to download method
        //TODO Method not tested, but should work
        if (method == "download") {
            ret.push(downloadResponse);
            ret.push(downloadTransmissionErrorHandler);
        }
        res[method].apply(res, ret);
    }

};

var setRedirect = exports.setRedirect = function (req, redirect) {
    req.attrs.method = "redirect";
    req.attrs.value = redirect;
};

var setJSON = exports.setJSON = function (req, json) {
    req.attrs.method = "json";
    req.attrs.value = json;
};

var setSend = exports.setSend = function (req, sendString) {
    req.attrs.method = "send";
    req.attrs.value = sendString;
};

var setDownload = exports.setDownload = function (req, options) {
    req.attrs.method = "download";
    req.attrs.value = options;
};

/**
 * Method to handle ajax request for success flash notifications
 * success param when object should have "localizedMessageKey" to show localized message
 * @param req - Request Object
 * @param success - Object || String
 * @param data - JSON
 */
exports.setSuccess = function (req, success, data) {
    var successMessage;

    if (_.isObject(success)) { //If object
        if (success.hasOwnProperty("localizedMessageKey")) { // show localized message
            successMessage = getMsg(success.localizedMessageKey);// localized message retrieved from current locale
        }
    }
    else {
        successMessage = success;
    }
    data = data || {};
    data.namespace = PluginHelper.getNamespace(req);
    setJSON(req, {
        status: "success",
        message: successMessage,
        data: data
    });
};

/**
 * Method to handle ajax request for error flash notifications
 * If error param is of JS Error object which have "localizedMessageKey === true", then localized message
 * will be displayed.
 *
 * @param req - Request Object
 * @param error - JS Error Object || String
 * @param data - JSON
 */
var setError = exports.setError = function (req, error, data) {
    var errorMessage;
    var header = error.header;
    data = data || {};

    if (error instanceof Error) { //check for js Error object
        Debug._l(error)
        if (error.hasOwnProperty("localizedMessageKey")) { //get message as localized
            errorMessage = getMsg(error.localizedMessageKey);// localized message retrieved from current locale
        }
        else if (error.hasOwnProperty("message")) {
            errorMessage = error.message;
        }
        if (error.hasOwnProperty("name")) {
            data.errorName = error.name;
        }
    }

    errorMessage = errorMessage || error.toString();

    data.namespace = PluginHelper.getNamespace(req);

    setJSON(req, [
        {
            status: "error",
            message: errorMessage,
            data: data
        },
        header
    ]);
};

/**
 * Returns true if status code is 200 OK
 * @param res
 * @returns {boolean}
 */
exports.is200Response = function (res) {
    return res.statusCode == 200;
};
/**
 * Sets http status code to 404 Not found.
 * @param res {Object}
 */
exports.set404StatusCode = function (res) {
    res.statusCode = 404;
};

/**
 * Sets http status code to 500 Internal server error
 * @param res {Object}
 */
exports.set500StatusCode = function (res) {
    res.statusCode = 500;
};


/**
 * Helper methods used for plugin parsing
 */

exports.getPluginIdAndIId = function (namespace) {
    var pl = namespace.split('_');
    return {pluginId: pl[0], iId: pl[1]}
};

exports.isAsync = function (pluginProps) {
    return pluginProps && pluginProps.async && pluginProps.async == true;
};

exports.isMany = function (pluginProps) {
    return pluginProps && pluginProps.many && pluginProps.many == true;
};

var getPostParam = exports.getPostParam = function (req, paramName) {
    var post = getPostParams(req);
    return post && post[paramName];
};

var getPostParams = exports.getPostParams = function (req) {
    var pluginId_iId = Object.keys(req.body)[0];
    return req.body && req.body[pluginId_iId];
};

/**
 * Populates only from post data
 * @param req
 * @param modelName
 * @param otherValues
 * @param keyMapObj
 */
exports.populateModelFromRequest = function (req, modelName, otherValues, keyMapObj) {
    return populateModel(req.app, modelName, getPostParams(req), otherValues, keyMapObj);
};

/**
 * Method is useful when data is saved from Post request to DB
 * otherValues are those values which are not present in req post params and to provide externally
 * keyMapObj is a mapping obj of model key and its corresponding alternative key in req post params
 *
 * Note: only those params are allowed in other values which are defined in schema
 */
var populateModel = exports.populateModel = function (app, modelName, params, otherValues, keyMapObj) {
    if (!params) {
        throw new Error("Request parameters does not exists");
    }
    if (!modelName) {
        throw new Error("Model name doesn't exists");
    }
    var db = app.set("db");
    if (!db.base.modelSchemas[modelName]) {
        //If ModelSchema is not loaded in db, then load it to fetch the fields of db collection
        require(utils.getRootPath() + "/services/shell/model/" + modelName + "Schema");
    }
    var modelPath = db.base.modelSchemas[modelName].paths;

    if (!modelPath) {
        throw new Error("Model Path does not exists");
    }
    var returnObj = {}, otherValues = otherValues || {}, keyMapObj = keyMapObj || {};

    var keys = Object.keys(modelPath);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i], val = null;
        if (params.hasOwnProperty(key)) {
            val = params[key];
        }
        if (otherValues.hasOwnProperty(key) && (_.isUndefined(val) || val === "" || val === null)) {
            val = otherValues[key];
        }
        if (_.isUndefined(val) || val === "" || val === null) {
            var tempKey = keyMapObj[key],
                tempVal = tempKey && params[tempKey];
            if (!_.isUndefined(tempVal) && tempVal !== null) {
                val = tempVal;
            }
        }
        if (!_.isUndefined(val) && val !== null) {
            returnObj[key] = val;
        }
    }
    return returnObj;
};

exports.getNamespace = function (req) {
    //check when middleware uses this method
    req.params = req.params || {};
    if (!req.params.plugin) {
        return;
    }
    var namespace = [req.params.plugin];
    if (req.params.iId) {
        namespace.push(req.params.iId);
    }
    return namespace.join("_");
};

/**
 * Basic clone of request
 * @param req
 */
exports.cloneRequest = function (req, pluginId) {
    var params = req.params, requestedPluginId = params.plugin;
    var clone = {
        params: {
            page: params.page
        },
        query: {},
        body: {},
        app: req.app,
        url: req.url,
        method: req.method,
        cookies: req.cookies,
        session: req.session,
        xhr: req.xhr,
        attrs: _.clone(req.attrs),
        flash: req.flash,
        files: _.clone(req.files)
    };

    if (pluginId === requestedPluginId) {
        clone.query = req.query, clone.body = req.body;
        Object.keys(params).forEach(function (param) {
            clone.params[param] = params[param];
        });
    }

    return clone;
};
/**
 * Base Controller for all plugins All plugins should inherit this class
 */
var EventEmitter = require('events').EventEmitter;
var Router = require("./Router");
var _ = require('underscore');
var _l = Debug._l;
var _i = Debug._i;
var ResponseHelper = require("./ResponseHelper"), callResponseMethod = ResponseHelper.callResponseMethod;
var Helpers = require("./Helpers");
var FormBuilder = require("./FormBuilder"), FormBuilderValidationMsgs = require("./FormBuilder/Constants").ValidationMsgs;
var i18n = require("./i18n"), getMsg = i18n.get, addMsg = i18n.addMsg, PluginHelper = require("./PluginHelper");
var Validator = require("./Validator");
var AsyncIterator = require("./Utils/AsyncIterator").AsyncIterator, AppProperties = require("./AppProperties");
var FileUtil = require("./file/FileUtil"),
    ImageUtil = require("./file/images/ImageUtil"), Mailer = require("./Mailer"),
    Renderer = require("./Renderer");
var getModelEvent = require("./ModelEvents").getModelEvent;

function noop(req, res, next) {
    next(null, req, res);
}

function validateAction(action) {
    return _.isFunction(action) ? action : noop;
}

//function processResponse(that, req, res, action, next) {
//    req.params.plugin = that.getPluginId();
//    if (that.isAsync()) {
//        if ((req.query.mode == "exclusive")) {
//            action.call(that, req, res, function(err, req, res){
//                callResponseMethod(err, req, res, next) ;
//            });
//        }
//        else
//            callResponseMethod(null, req, res);
//    }
//    else {
//        req = that.getPluginHelper().cloneRequest(req, that._id);
//        action.call(that, req, res, function(err, req, res){
//            callResponseMethod(err, req, res, next) ;
//        });
//    }
//
//}

function getValsFromReq(req, namespace) {
    var vals;

    if (req.body && req.body[namespace]) {
        vals = req.body[namespace];
    } else if (req.query && req.query[namespace]) {
        vals = req.query[namespace];
    }

    return vals;
}

var BasePluginController = module.exports = function (plugin, app) {
    var id = plugin.id, that = this;
    if (!id) {
        throw new Error("Plugin Id is undefined");
    }
    if (!app) {
        throw new Error("App is undefined");
    }
    this._id = id;
    this._app = app;
    this._props = plugin.props;
    this._evt = new EventEmitter();
    this._evt.on(id + "::loaded", function (e) {
        _l("Base loaded listener: " + _i(e));
    });

    this._evt.on(id + "::removed", function (e) {
        _l("Base removed listener: " + _i(e));
    });

    // _l(_i(plugin))
};

/**
 * Method returns the real path of plugin directory
 * @returns {String}
 */
BasePluginController.prototype.realPath = function () {
    var that = this;
    return utils.realPath(utils.getPluginsPath(), that._id);
};

BasePluginController.prototype.load = function (id, params) {
    params = params || {};
    this._evt.emit(id + "::loaded", params);
};

BasePluginController.prototype.remove = function (id, params) {
    params = params || {};
    this._evt.emit(id + "::removed", params);
};

/**
 * Method used to serve the views jade file, directly from url
 */
BasePluginController.prototype.addViewFileRoute = function () {
    var that = this;
    //adding fix route to direct fetch jade file for each plugin
    that.get({
        route: '/viewFile:view', action: function (req, res, next) {
            var view = req.params.view, err, action;
            try {
                action = view.split(":")[1];
                req.params.action = action;
            }
            catch (e) {
                Debug._l(e);
                err = new Error("Invalid view file");

            }

            if (!err) {
                try {
                    //search for view helper method in plugin controller named as viewFile + "Action"
                    var viewHelper = that[action + "Action"];
                    if (_.isFunction(viewHelper)) {
                        return viewHelper.apply(that, [req, res, next]);
                    }
                }
                catch (e) {
                    Debug._l(e.stack ? e.stack : e);
                    err = e;
                }
            }


            next(err);
        }
    });
};

BasePluginController.prototype.addDefaultPluginRoute = function () {
    var that = this, pluginId = that.getPluginId(),
        params = {
        };

    this.processAndAddRoute(params, "get");
};

BasePluginController.prototype.listenLoadEvent = function (handler) {
    var that = this;
    that.addDefaultPluginRoute();
    that.addViewFileRoute();
    that._evt.on(that._id + "::loaded", handler);
};

BasePluginController.prototype.listenRemoveEvent = function (handler) {
    var that = this;
    this._evt.on(that._id + "::removed", handler);
};

BasePluginController.prototype.processAndAddRoute = function (params, method) {
    var that = this, action = validateAction(params.action);
//    route = getRoute(that.getPluginId(), route, that.isMany(), params.isAppRoute);
    params.pluginId = that.getPluginId();
    params.many = !!that.isMany();
    params.settings = !!(that._props.settings && (that._props.settings === true));
    Router.createRoute(that.getApp(), method, params, function (req, res, next) {

        function handleResponse(err, pageContent) {
            if (err) return next(err);
            else {
                ResponseHelper.handleResponse(req, res, pageContent);
            }
        }

        req.params.plugin = that.getPluginId();
        if (that.isAsync()) {  // not work for async plugins
            if ((req.query.mode == "exclusive")) {
                action.call(that, req, res, function (err) {
                    callResponseMethod(err, req, res, next);
                });
            }
            else
                callResponseMethod(null, req, res);
        }
        else {
            req = that.getPluginHelper().cloneRequest(req, that._id);
            action.call(that, req, res, function (err) {
                if (err) {
                    Debug._l(err.stack || err);
                    that.setErrorMessage(req, err);
//                    return next(); // err handled by express
                }

                !req.attrs.method ? (req.attrs.isAppSettings ? Renderer.settingsRender(req, res, handleResponse) :
                    Renderer.render(req, res, handleResponse))
                    : handleResponse(null, null);
            });
        }
    });
};

//handling of GET request route
BasePluginController.prototype.get = function (params) {
    this.processAndAddRoute(params, "get");
};

//handling of POST request route
BasePluginController.prototype.post = function (params) {
    this.processAndAddRoute(params, "post");
};

BasePluginController.prototype.render = function (req, res, next) {
    req.params.action && req.pluginRender.setView(req.params.action);
    next(null);
};

/**
 * return is an obj defined as { pluginId :<pluginId>, params: <params in key
 * value obj>, method : <GET or POST>, page : <PageName> post :<post params> }
 */
BasePluginController.prototype.parseParams = function (req) {
    var ret = {
        pluginId: this.getPluginId(),
        method: req.method,
        page: req.params.page
    };
    if (req.params) {
        // 'action:register/pp:ddd'
//	var obj = {};
//	if(req.params[0]){
//	    req.params[0].split('\/').forEach(function(str) {
//		str = str.split(':')
//		obj[str[0]] = str[1];
//	    }); 
//	}
        ret.params = req.params;
    }
    if (req.method === "POST") {
        ret.post = PluginHelper.getPostParams(req);
    }
    return ret;
};

BasePluginController.prototype.getApp = function () {
    return this._app;
};

BasePluginController.prototype.getPluginId = function () {
    return this._id;
};

BasePluginController.prototype.getProps = function () {
    return this._props;
};


BasePluginController.prototype.isMany = function () {
    return PluginHelper.isMany(this.getProps());
};

BasePluginController.prototype.isAsync = function () {
    return PluginHelper.isAsync(this.getProps());
};

BasePluginController.prototype.setMessage = function (obj) {
    Helpers.setMessage(obj);
};

BasePluginController.prototype.setErrorMessage = function (req, key) {
    //check for err obj passed as key, if yes check for localized error key otherwise err message
    key instanceof Error && (key = key.localizedMessageKey ? key.localizedMessageKey : key.message);
    var msg = getMsg({key: key});
    Helpers.setErrorMessage(req, msg);
};

BasePluginController.prototype.setInfoMessage = function (req, key) {
    var msg = getMsg({key: key});
    Helpers.setInfoMessage(req, msg);
};

BasePluginController.prototype.setSuccessMessage = function (req, key) {
    var msg = getMsg({key: key});
    Helpers.setSuccessMessage(req, msg);
};

BasePluginController.prototype.getFormBuilder = function () {
    return FormBuilder;
};

BasePluginController.prototype.getMsg = function () {
    return getMsg;
};

BasePluginController.prototype.getPluginHelper = function () {
    return PluginHelper;
};
BasePluginController.prototype.setRedirect = function (req, redirect) {
    return ResponseHelper.setRedirect(req, redirect);
};

BasePluginController.prototype.setJSON = function (req, json) {
    return ResponseHelper.setJSON(req, json);
};

BasePluginController.prototype.setSend = function (req, sendString) {
    return ResponseHelper.setSend(req, sendString);
};

BasePluginController.prototype.setDownload = function (req, options) {
    return ResponseHelper.setDownload(req, options);
};

BasePluginController.prototype.setSuccess = function (req, success, data) {
    return ResponseHelper.setSuccess(req, success, data);
};

BasePluginController.prototype.setError = function (req, error, data) {
    return ResponseHelper.setError(req, error, data);
};

BasePluginController.prototype.addCustomValidations = function (obj) {
    Object.keys(obj).forEach(function (key) {
        Validator.addCustomValidations(key, obj[key].ruleFunction);
        var msgKey = key + "-error-message"
        addMsg(msgKey, obj[key].msgs);
        FormBuilderValidationMsgs[key] = msgKey;
    });

};

BasePluginController.prototype.ValidateForm = function (req, formObj, next) {
    var fields = formObj.fields;
    var fieldsRules = {};
    for (var index in fields) {
        var field = fields[index];
        if (field.rules) {
            fieldsRules[field.name] = field.rules;
        }
        if (field.type == "date") {
            fieldsRules[field.name] = fieldsRules[field.name] || [];
            fieldsRules[field.name].push("date");
        }
    }
    Validator.getInstance(req, getValsFromReq(req, getNamespace(req)), fieldsRules, next);
};

BasePluginController.prototype.__defineGetter__('AsyncIterator', function () {
    return AsyncIterator;
});

var getNamespace = BasePluginController.prototype.getNamespace = function (req) {
    var ns = req.params.namespace;
    if (!ns) {
        ns = PluginHelper.getNamespace(req);
        req.params.namespace = ns;
    }
    return ns;
};


BasePluginController.prototype.getAppProperty = function (key) {
    return AppProperties.get(key);
};

BasePluginController.prototype.__defineGetter__('PermissionError', function () {
    return require("./permissions/PermissionError");
});

BasePluginController.prototype.getSettings = function (req, next) {
    var PluginInstanceHandler = require("./PluginInstanceHandler");
    var ns = this.getNamespace(req);
    PluginInstanceHandler.getPluginSettings(req, req.attrs.page.pageId, ns, next);
};

BasePluginController.prototype.__defineGetter__('getModelEvent', function () {
    return getModelEvent;
});

BasePluginController.prototype.__defineGetter__('FileUtil', function () {
    return FileUtil;
});

BasePluginController.prototype.__defineGetter__('ImageUtil', function () {
    return ImageUtil;
});

BasePluginController.prototype.__defineGetter__('set404StatusCode', function () {
    return ResponseHelper.set404StatusCode;
});

BasePluginController.prototype.__defineGetter__('set500StatusCode', function () {
    return ResponseHelper.set500StatusCode;
});

BasePluginController.prototype.__defineGetter__('DateUtil', function () {
    return require("./Utils/DateUtil");
});

BasePluginController.prototype.__defineGetter__('PermissionValidator', function () {
    return require("./permissions/PermissionValidator");
});

BasePluginController.prototype.__defineGetter__('Mailer', function () {
    return Mailer;
});

BasePluginController.prototype.__defineGetter__('PermissionError', function () {
    return require('./permissions/PermissionError');
});


Object.defineProperties(BasePluginController.prototype, {
    /**
     * Method used by Settings plugin to add redirect to req.query
     * @param req {Object} Request object
     * @param [paths] {Array} additional paths to be added to redirect url
     */
    getRedirectPath: {
        value: function (req, paths) {
            paths = paths || [];
            return req.params.page + "/" + this.getPluginId() + "/" + paths.join("/");
        }
    },
    getService: {
        value: function (modelName) {
            return this.getApp().getService(modelName);
        }
    }
});
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
var DBActions = require("./DBActions");
var FormBuilder = require("./FormBuilder"), FormBuilderValidationMsgs = require("./FormBuilder/Constants").ValidationMsgs;
var i18n = require("./i18n"), getMsg = i18n.get, addMsg = i18n.addMsg, PluginHelper = require("./PluginHelper");
var Validator = require("./Validator");
var AsyncIterator = require("./Utils/AsyncIterator").AsyncIterator, AppProperties = require("./AppProperties");
var fs = require("fs");
var PageRenderer = require("./PageRenderer");
function noop(req, res, next) {
    next(null, req, res);
}

function validateAction(action) {
    return _.isFunction(action) ? action : noop;
}

function processResponse(that, req, res, action) {
    req.params.plugin = that.getPluginId();
    PageRenderer.checkPagePermissions(req, res, function (err) {
        if (err)
            return PageRenderer.showErrorPage(err, req.attrs.page, req, res);
        if (that.isAsync()) {
            if ((req.query.mode == "exclusive")) {
                action.call(that, req, res, callResponseMethod);
            }
            else
                callResponseMethod(null, req, res);
        }
        else
            action.call(that, req, res, callResponseMethod);
    });

}


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
    var id = plugin.id;
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

BasePluginController.prototype.load = function (id, params) {
    params = params || {};
    this._evt.emit(id + "::loaded", params);
};

BasePluginController.prototype.remove = function (id, params) {
    params = params || {};
    this._evt.emit(id + "::removed", params);
};

BasePluginController.prototype.listenLoadEvent = function (handler) {
    var that = this;
    this._evt.on(that._id + "::loaded", handler);
};

BasePluginController.prototype.listenRemoveEvent = function (handler) {
    var that = this;
    this._evt.on(that._id + "::removed", handler);
};

BasePluginController.prototype.processAndAddRoute = function(params, method) {
    var that = this, action = validateAction(params.action);
//    route = getRoute(that.getPluginId(), route, that.isMany(), params.isAppRoute);
    params.pluginId = that.getPluginId();
    params.many = that.isMany();
    Router.createRoute(that.getApp(), method, params, function (req, res) {
        processResponse(that, req, res, action);
    });
}
//handling of GET request route
BasePluginController.prototype.get = function (params) {
    this.processAndAddRoute(params, "get");
};

//handling of POST request route
BasePluginController.prototype.post = function (params) {
    this.processAndAddRoute(params, "post");
};

BasePluginController.prototype.render = function (req, res, next) {
    next(null, [ req.params.action || "index" , {} ]);
};

/**
 * return is an obj defined as { pluginId :<pluginId>, params: <params in key
 * value obj>, method : <GET or POST>, page : <PageName> post :<post params> }
 */
BasePluginController.prototype.parseParams = function (req) {
    var ret = {
        pluginId:this.getPluginId(),
        method:req.method,
        page:req.params.page
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

BasePluginController.prototype.getDB = function () {
    return this._app.set("db");
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
    var msg = getMsg({key:key});
    Helpers.setErrorMessage(req, msg);
};

BasePluginController.prototype.setInfoMessage = function (req, key) {
    var msg = getMsg({key:key});
    Helpers.setInfoMessage(req, msg);
};

BasePluginController.prototype.setSuccessMessage = function (req, key) {
    var msg = getMsg({key:key});
    Helpers.setSuccessMessage(req, msg);
};

BasePluginController.prototype.getDBActionsLib = function () {
    return DBActions;
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

BasePluginController.prototype.AsyncIterator = AsyncIterator

BasePluginController.prototype.fs = fs;

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

BasePluginController.prototype.PermissionError = require("./permissions/PermissionError");

BasePluginController.prototype.getSettings = function (req, next) {
    var PluginInstanceHandler = require("./PluginInstanceHandler");
    var ns = this.getNamespace(req);
    PluginInstanceHandler.getPluginSettings(req, req.attrs.page.pageId, ns, next);
};

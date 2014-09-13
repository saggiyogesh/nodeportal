var PluginHelper = require("../PluginHelper");
var PageRenderer = require("./PageRenderer");
var SettingsRenderer = require("./SettingsRenderer");
var ErrorRenderer = require("./ErrorRenderer");
var SettingsErrorRenderer = require("./SettingsErrorRenderer");

var EXCLUSIVE = "exclusive", MAXIMIZED = "maximized";

exports.render = function (req, res, next) {
    var r = new PageRenderer(req, res);
    var pluginId = req.params.plugin;
    pluginId && (req.params.namespace = PluginHelper.getNamespace(req));
    if (req.query && req.query.mode === EXCLUSIVE) {
        r.renderExclusive(next);
    } else if (req.query && req.query.mode === MAXIMIZED) {
        r.renderMaximized(next);
    } else {
        r.render(next);
    }
};

exports.settingsRender = function (req, res, next) {
    var r = new SettingsRenderer(req, res);
    var pluginId = req.params.plugin;
    pluginId && (req.params.namespace = PluginHelper.getNamespace(req));
    if (req.query && req.query.mode === EXCLUSIVE) {
        r.renderExclusive(next);
    }
    else {
        r.render(next);
    }
};

exports.renderError = function (err, req, res, next) {
    var r = req.attrs.isAppSettings ? new SettingsErrorRenderer(err, req, res)
        : new ErrorRenderer(err, req, res);

    r.render(next);
};


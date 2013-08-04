var Helpers = require("./Helpers"), getMsg = require("./i18n").get, plugins = require("./plugins"),
    getProp = require("./AppProperties").get,
    viewParser = require("./view"), PageScript = require("./PageScript"),
    PageRenderer = require("./PageRenderer"),
    path = require("path"),
    ThemeUtil = require("./ThemeUtil");

function parsePage(settings) {
    var index = settings._settingsHome + "/index",
        options = {};
    viewParser.parseView(settings._app, index, options);
}

function Settings(req, res) {
    this._req = req;
    this._res = res;
    this._app = req.app;
    this._db = this._app.get('db');
    this._settingsHome = this._app.set('views') + "/shell/app/settings"
}
Settings.prototype.setErrorMessage = function (key) {
    this._errMsg = getMsg({key: key});
};

Settings.prototype.render = function () {
    var req = this._req, res = this._res, app = req.app, that = this;

    var tpl = "",
        render = function () {
            res.render(that._settingsHome + "/index", {
                req: req,
                res: res,
                layoutHTMLTMPL: tpl,
                dockbar: ThemeUtil.dockbar(req),
                bottomIncludes: viewParser.parseView(app, app.set('views') + '/shell/app/page_bottom', {
                    page: req.attrs.page,
                    user: req.session.user,
                    req: req,
                    props: {
                        appURL: getProp("APP_URL")
                    }
                }) + PageScript.render()
            });
        };
    if (that._errMsg) {
        tpl = viewParser.parseView(app, that._settingsHome + "/error", {errorMsg: that._errMsg});
        render();
    } else {
        var settingPlugins = plugins.getSettingsPlugins() , pluginsArr = [], pluginId = req.params.plugin;
        Object.keys(settingPlugins).forEach(function (id) {
            pluginsArr.push(settingPlugins[id]);
        });

        var opts = { req: req,
            plugins: pluginsArr, getURL: getURL, pluginHtml: ""
        };

        if (pluginId) {
            PageRenderer.renderPlugin(req, res, function (err, html) {
                if (err) {
                    tpl = viewParser.parseView(app, that._settingsHome + "/error", {errorMsg: err});
                    return render();
                }
                opts.pluginHtml = html;
                tpl = viewParser.parseView(app, that._settingsHome + "/main", opts);
                render();
            });
        }
        else {
            tpl = viewParser.parseView(app, that._settingsHome + "/main", opts);
            render();
        }
    }
};


exports.getInstance = function (req, res) {
    return new Settings(req, res);
};

function getURL(req, pluginId) {
    var url = [req.params.page, pluginId];

    return "/" + url.join("/");
}

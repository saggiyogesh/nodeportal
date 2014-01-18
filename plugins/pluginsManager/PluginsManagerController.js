var BasePluginController = require(process.cwd() + "/lib/BasePluginController.js");
var LAYOUT_SCHEMA = "Layout", THEME_SCHEMA = "Theme"

var PluginsManagerController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route: '/getPlugins', action: getAllPluginsAction
        });
        that.get({
            route: '/remove/:id?/:type?', action: removePluginAction
        });
    });
};

util.inherits(PluginsManagerController, BasePluginController);

function getRealPath(app, model) {
    var p  = utils.getViewsPath() + "/" + model.path;
    return model.type == LAYOUT_SCHEMA ? p + ".jade" : p ;
}


function removeFile(app, model){
    if(!model || !model.path){
        return;
    }
    var FileUtil = this.FileUtil;
    Debug._l(getRealPath(app, model));
    FileUtil.removeDir(getRealPath(app, model));
}

function removePluginAction(req, res, next) {
    var that = this, params = req.params, type = params.type, id = params.id, ns = that.getNamespace(req);
    var DBActions = this.getDBActionsLib();
    var redirect = "/" + params.page + "/" + ns;
    if (id && type) {
        var dbAction = DBActions.getInstance(req, type);
        async.series({
            model: function (next) {
                dbAction.getByDefaultFinderMethod(id, function(err, model){
                    next(err, model);
                });
            },
            remove: function (next) {
                dbAction.remove(id, next);
            }
        }, function (err, result) {
            if (!err) {
                var model = result.model.toObject();
                model.type = type;

                //delete real files/dir
                removeFile.apply(that, [req.app, model]);
                var msg = "Plugin uninstalled successfully.";
                that.setSuccessMessage(req, msg);
                that.setRedirect(req, redirect);
                next(err, req, res);
            }
        });

    } else {
        that.setErrorMessage(req, "Invalid parameters");
        that.setRedirect(req, redirect);
        next(null, req, res);
    }
}

function getAllPluginsAction(req, res, next) {
    var that = this, queryParams = req.query;

    var DBActions = this.getDBActionsLib();

    async.parallel({
        layout: function (next) {
            var dbAction = DBActions.getInstance(req, LAYOUT_SCHEMA);
            dbAction.get("getAllExceptDefaults", null, next);
        },
        theme: function (next) {
            var dbAction = DBActions.getInstance(req, THEME_SCHEMA);
            dbAction.get("getAllExceptDefault", null, next);
        }
    }, function (err, result) {
        if (!err) {
            var aaData = [], count = 0;
            result.layout.forEach(function (l) {
                l = l.toObject();
//                l.type = LAYOUT_SCHEMA;
//                l.id = l.layoutId;
                aaData.push([l.layoutId, l.name, LAYOUT_SCHEMA]);
                ++count;
            });
            result.theme.forEach(function (t) {
                t = t.toObject();
//                t.type = THEME_SCHEMA;
//                l.id = l.themeId;
                aaData.push([t.themeId, t.name, THEME_SCHEMA]);
                ++count;
            });

            var ret = {
                "sEcho": queryParams["sEcho"],
                "iTotalRecords": count,
                "iTotalDisplayRecords": count,
                "aaData": aaData
            };

            that.setJSON(req, ret);
        }
        next(err, req, res);
    })
}


PluginsManagerController.prototype.render = function (req, res, next) {
    var view = req.params.action;
    view = view || "index";
    next(null, [ view, {} ]);
};
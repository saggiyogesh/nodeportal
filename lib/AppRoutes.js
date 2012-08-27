/**
 * Handles app fixed routes
 *
 */

var LoginUtil = require('./login/LoginUtil'), URLCreator = require("./URLCreator"),
    plugins = require("./plugins"), PluginInstanceHandler = require("./PluginInstanceHandler"),
    DBActions = require("./DBActions"),
    getProp = require("./AppProperties").get,
    CaptchaUtil = require("./CaptchaUtil"),
    AppURL = getProp("APP_URL");

module.exports = function (app) {
    app.get(AppURL + '/login', function (req, res) {
        LoginUtil.showLogin(req, res);
    });
    app.get(AppURL + '/logout', function (req, res) {
        LoginUtil.doLogout(req, res);
    });
    app.get(AppURL + '/pluginUrl', function (req, res) {
        var params = req.params, query = req.query;
        params.page = query.page;
        params.namespace = query.namespace;
        delete query.page;
        delete query.namespace;
        delete query._;
        var url = URLCreator.createURLFromRequest(req).toString();
//        Debug._l("url >  " + url);
        res.json({success:true, url:url});
    });
    app.post(AppURL + '/updatePageData', function (req, res) {
        var params = req.params, body = req.body,
            data = body.data, pageId = body.pageId, pageData = {},
            getPlaceholderName = function (n) {
                return "col" + (parseInt(n) + 1) + "HTMLTMPL"
            };
        data = JSON.parse(data);
        _.each(data, function (value, key) {
            pageData[getPlaceholderName(key)] = value;
        });
        DBActions.getInstance(req, "Page").authorizedUpdate({
            pageId:pageId,
            data:pageData
        }, function (err, result) {
            if (err) {
                Debug._li("Err!!.. " + err.stack);
                res.send({status:"error"});
            }

            if (result) {
                Debug._l("Layout updated : " + result);
                res.send({status:"success"});
            }
        });
    });

    app.get(AppURL + '/getPagePlugins', function (req, res) {
        var pageId = req.query.pageId, ret = {};
        if (pageId) {
            var dbAction = DBActions.getInstance(req, "Page");
            dbAction.authorizedGet("findByPageId", pageId, function (err, page) {
                var pageData = page.data, pagePlugins = [];
                _.each(pageData, function (value, key) {
                    pagePlugins.push(value);
                });
                pagePlugins = _.flatten(pagePlugins);
                _.each(plugins.getPagePlugins(), function (plugin, id) {
                    if (!plugin.props.many == true) {
                        if (_.indexOf(pagePlugins, id) > -1) {
                            return;
                        }
                    }
                    ret[id] = plugin.name["en_US"];
                });
                res.send(JSON.stringify(ret));
            });
        }
    });
    app.post(AppURL + '/addPlugin', function (req, res) {
        var id = req.body.id, pageId = req.body.pageId;
        if (id && pageId) {
            var plugin = plugins.get(id),
                dbActionPage = DBActions.getInstance(req, "Page");
            dbActionPage.authorizedGet("findByPageId", pageId, function (err, page) {
                if (page) {
                    var pageData = page.data, col1key, col1val,
                        pagePlugins = [],
                        obj = {pageId:pageId, data:pageData}, ns;
                    _.each(pageData, function (value, key) {
                        if (!col1key) {
                            col1key = key;
                            col1val = value;
                        }
                        pagePlugins.push(value);
                    });
                    pagePlugins = _.flatten(pagePlugins).sort();
                    //Debug._l(pagePlugins);
                    if (!plugin.props.many == true) {
                        obj.data[col1key] = _.flatten([id, col1val]);
                        ns = id;
                    }
                    else {
                        var c = 0;
                        pagePlugins.forEach(function (pluginId) {
                            if (pluginId && pluginId.indexOf(id) > -1) {
                                c = parseInt(pluginId.split("_")[1]) + 1;
                            }
                        });
                        c = c || 1;
                        ns = id + "_" + c;
                        obj.data[col1key] = _.flatten([ns, col1val]);
                    }
                    dbActionPage.authorizedUpdate(obj, function (err, result) {
                        if (result) {
                            PluginInstanceHandler.addInstance(req, ns, pageId, plugin.name, function (err, result) {
                                if (result) {
                                    res.send({success:true});
                                }
                                else {
                                    Debug._l(err);
                                    res.send({success:false, error:err});
                                }
                            });
                        }
                        else {
                            Debug._l("Err!! " + err);
                            res.send({success:false, error:err});
                        }
                    });
                }
            });

        }
    });

    app.post(AppURL + '/removePlugin', function (req, res) {
        var ns = req.body.id, pageId = req.body.pageId;
        if (ns && pageId) {
            var dbAction = DBActions.getInstance(req, "Page");

            dbAction.authorizedGet("findByPageId", pageId, function (err, page) {
                if (page) {
                    var pageData = page.data, col;
                    _.each(pageData, function (value, key) {
                        var idx = _.indexOf(value, ns);
                        if (idx > -1) {
                            value.splice(idx, 1);
//                            delete value[idx];
                            var obj = {
                                pageId:pageId,
                                data:pageData
                            };
                            PluginInstanceHandler.deleteInstance(req, ns, pageId, function (err, result) {
                                if (result) {
                                    dbAction.update(obj, function (err, result) {
                                        if (result) {
                                            res.send({success:true});
                                        }
                                        else {
                                            Debug._l("Err!! " + err);
                                            res.send({success:false, error:err});
                                        }
                                    });
                                }
                                else {
                                    Debug._l("Err!! " + err);
                                    res.send({success:false, error:err});
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    app.get(AppURL + '/captcha', function (req, res) {
        CaptchaUtil.render(req, res);
    });

};
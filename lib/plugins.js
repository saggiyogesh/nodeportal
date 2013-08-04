var _ = require('underscore'), Router = require("./Router"), Utils = require('./utils').Utils, PLUGINS = {}, props = {}, settingsPlugins = {}
pagePlugins = {};
var util = require("util"), FileUtil = require("./file/FileUtil"), PLUGINS_HOME = "plugins";
var express = require('express'), getProp = require("./AppProperties").get ,
    staticUtil = require("./static/Util");
var _l = Debug._l;

function Plugin(id, pluginGroup, name, props, path, app) {
    this.id = id;
    this.pluginGroup = pluginGroup;
    this.props = props;
    this.path = path;
    this.name = name;
    var pl = new require(FileUtil.realPath(app.set('appPath'), path));
    this.exec = new pl(this, app);
    this.toString = function () {
        return Utils.toString(this);

    };

}

function addPluginRoutes(app) {
    Router.addPluginRoutes(app);
}

function addToPagePlugins(pluginId) {
    pagePlugins[pluginId] = PLUGINS[pluginId];
}

function addToSettings(pluginId) {
    settingsPlugins[pluginId] = PLUGINS[pluginId];
}

// After adding a plugin, it also should be loaded, otherwise it'll raise an
// err for listenload event
function loadPlugin(id) {
    var plugin = PLUGINS[id];
    plugin.exec.load(plugin.id, {
        id: plugin.id
    });
}

function loadPlugins(app) {
    _.each(PLUGINS, function (plugin, id) {
        plugin.exec.load(plugin.id, {
            id: plugin.id
        });
    });

    //add plugin routes
    addPluginRoutes(app);
}

function addPluginClientScripts(app) {
    var appPath = app.set('appPath');
    _.each(PLUGINS, function (plugin, id) {
        var path = appPath + '/plugins/' + id + '/client';
        staticUtil.setStaticFolder(app, path);
    });
}
exports.init = function (app) {
    FileUtil.readFile(FileUtil.realPath(process.cwd(), PLUGINS_HOME, "plugin_properties.json"), function (err, data) {
        if (err) {
            throw err;
        }
        var props = JSON.parse(data);
        props.forEach(function (c) {
            PLUGINS[c.id] = new Plugin(c.id, c.group, c.name, c.config, FileUtil.realPath(PLUGINS_HOME, c.id, c.controller), app);
//            loadPlugin(c.id);
//            props[c.id] = props;
            if (c.config.settings && c.config.settings == true) {
                addToSettings(c.id);
            }

        });

        //set a cache for permissions
        app.set("permissions", {});
        require("./permissions/PermissionDefinitionProcessor").ProcessPermissions(app, function (err, res) {
            if (err) throw err;
            if (res) {
                require('./ConfigureApp')(app, function (app) {
                    loadPlugins(app);
                    require(app.set('appPath') + "/controllers/shell/PageController")(app);
                    require("./static/ThemesWatcher").init(app);

                    console.log('all routes.....................................');
                    app.routes.all().forEach(function (route) {
                        console.log('  \033[90m%s \033[36m%s\033[0m', route.method.toUpperCase(), route.path);
                    });

                    //set themes static folder
                    require("./ThemeUtil").setThemesStaticFolder(app);


                });
            }

        });

        //add client scripts to express static
        addPluginClientScripts(app);

        /*app.configure('development', function () {
         require("../lib/dev").init(app);
         });*/

        //TODO populate pagePlugins list after parsing json
        //addToPagePlugins("pluginB");
        addToPagePlugins("login");
        addToPagePlugins("displayArticle");


    });
};

exports.add = function () {

};

exports.remove = function () {

};

function flushCache(pluginId) {
    var cache = require.cache, keys = Object.keys(cache);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
//        Debug._l("keys : " + key);
        delete cache[key];
        if (utils.contains(key, "express") || utils.contains(key, "connect") || utils.contains(key, "nodefirstapp")) {
            //delete cache[key];
            Debug._l("keys : " + key);
//            Debug._l("flushed...." );
        }
    }

}
exports.reload = function (pluginId, app) {
    Debug._l("Reloading plugin: ");
    flushCache(pluginId);
    FileUtil.readFile(FileUtil.realPath(process.cwd(), PLUGINS_HOME, "plugin_properties.json"), function (err, data) {
        if (err) {
            throw err;
        }
        var props = JSON.parse(data);
        props.forEach(function (c) {
            if (c.id == pluginId) {
                PLUGINS[c.id] = new Plugin(c.id, c.group, c.name, c.config, PLUGINS_HOME + c.id + "/" + c.controller, app);
                loadPlugin(c.id);
                if (c.config.settings && c.config.settings == true) {
                    addToSettings(c.id);
                }
            }
        });

        console.log('all routes.....................................');
        app.routes.all().forEach(function (route) {
            console.log('  \033[90m%s \033[36m%s\033[0m', route.method.toUpperCase(), route.path);
        });
    });
};

/*
 * Function returns the Plugin, if pluginId is not string type then throws Error
 */
exports.get = function (pluginId) {
    if (_.isString(pluginId)) {
        // console.log("vv " + pluginId + " : " + PLUGINS[pluginId]);
        return PLUGINS[pluginId];
    } else {
        throw new Error('Plugin Id should be String Type');
    }
};

exports.getAll = function () {
    return PLUGINS;
};

exports.getSettingsPlugins = function () {
    return settingsPlugins;
};

exports.getPagePlugins = function () {
    return pagePlugins;
};
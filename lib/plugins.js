var _ = require('underscore'), Router = require("./Router"), Utils = require('./utils').Utils, PLUGINS = {}, props = {},
    settingsPlugins = {}, pagePlugins = {};
var util = require("util"), FileUtil = require("./file/FileUtil"), PLUGINS_HOME = "plugins";
var getProp = require("./AppProperties").get ,
    staticUtil = require("./static/Util");
var _l = Debug._l;

function Plugin(opts, app) {
    var path = FileUtil.realPath(PLUGINS_HOME, opts.id);

    this.id = opts.id;
    this.pluginGroup = opts.pluginGroup;
    this.props = opts.config;
    this.path = path;
    this.name = opts.name;
    var pl = new require(FileUtil.realPath(utils.getRootPath(), path, opts.controller));
    this.exec = new pl(this, app);
    this.toString = function () {
        return Utils.toString(this);
    };

    if (opts.config.defaultData) {
        this.defaultData = require(FileUtil.realPath(utils.getRootPath(), path, "defaultData"));

        if (opts.config.defaultDataHandler) {
            this.defaultDataHandler = require(FileUtil.realPath(utils.getRootPath(), path, "defaultData", opts.config.defaultDataHandler));
        }
    }
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
}

function addPluginClientScripts(app) {
    var appPath = utils.getRootPath();
    _.each(PLUGINS, function (plugin, id) {
        var path = utils.getPluginsPath() + '/' + id + '/client';
        staticUtil.setStaticFolder(app, path);
    });
}

exports.init = function (app, pluginProps) {
    pluginProps.forEach(function (c) {
        PLUGINS[c.id] = new Plugin(c, app);
        if (c.config.settings && c.config.settings == true) {
            addToSettings(c.id);
        }
        else if (c.config.page && c.config.page == true) {
            addToPagePlugins(c.id);
        }

    });

    loadPlugins(app);

    //add plugin routes
    addPluginRoutes(app);

    addPluginClientScripts(app);
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

//exports.reload = function (pluginId, app) {
//    Debug._l("Reloading plugin: ");
//    flushCache(pluginId);
//    FileUtil.readFile(FileUtil.realPath(process.cwd(), PLUGINS_HOME, "plugin_properties.json"), function (err, data) {
//        if (err) {
//            throw err;
//        }
//        var props = JSON.parse(data);
//        props.forEach(function (c) {
//            if (c.id == pluginId) {
//                PLUGINS[c.id] = new Plugin(c.id, c.group, c.name, c.config, PLUGINS_HOME + c.id + "/" + c.controller, app);
//                loadPlugin(c.id);
//                if (c.config.settings && c.config.settings == true) {
//                    addToSettings(c.id);
//                }
//            }
//        });
//
//        console.log('all routes.....................................');
//        app.routes.all().forEach(function (route) {
//            console.log('  \033[90m%s \033[36m%s\033[0m', route.method.toUpperCase(), route.path);
//        });
//    });
//};

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
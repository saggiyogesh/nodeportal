/**
 * Lib for saving plugin default data
 */

var plugins = require('./plugins');
var EventEmitter = require('events').EventEmitter;
var event = new EventEmitter();
var async = require("async");
var COMPLETED_EVENT = 'completedEvent';
var _l = Debug._l, _li = Debug._li;

var PluginsData , DependenciesMap ,
    SchemaDataHandler;

var SavedSchemas = [];

var HandlerArray = [];

/**
 * Returns data handler if provided with plugin otherwise return default handler function
 * @param app
 * @param schema {String} Schema name
 * @param data {Object|Array} default data
 * @returns {*|Function|Function}
 */
function getHandler(app, schema, data) {
    function handleSave(err, results, next) {
        if (!err) {
            delete DependenciesMap[schema];
            SavedSchemas.push(schema);
            _l('schema saved: ' + schema);
        }
        next(err, results);
    }

    // Default handler function
    var ret = function (next) {
        data = _.isObject(data) ? _.values(data) : data;
        app.getService(schema).multipleSave(data, function (err, results) {
            handleSave(err, results, next);
        });
    };

    // Data handler provided in plugin
    var ret1 = SchemaDataHandler[schema] && function (next) {
        SchemaDataHandler[schema](app, data)(function (err, results) {
            handleSave(err, results, next);
        });
    };
    return ret1 || ret;
}


/**
 * Checks for required dependencies for the schema are saved.
 * @param schema {String} schema name
 * @returns {boolean}
 */
function dependenciesExists(schema) {
    var deps = DependenciesMap[schema];
    var f = false;
    deps.forEach(function (d) {
        f = SavedSchemas.indexOf(d) > -1
    });
    return f;
}


/**
 * Saves those schemas which depends on other collections data.
 * @param app
 */
function saveSchemas(app) {
    var keys = Object.keys(DependenciesMap);
    if (keys.length == 0) {
        _l('Default data saved...');
        event.emit(COMPLETED_EVENT);
        return;
    }
    HandlerArray = [];
    var errFlag = true;
    keys.forEach(function (k) {
        dependenciesExists(k) && HandlerArray.push(getHandler(app, k, PluginsData[k]));

    });
    async.series(HandlerArray, function (err, end) {
        if (err)
            throw err;

        saveSchemas(app);
    });
}

/**
 * Start handling default data provided in plugins and save those collections which are not having dependencies.
 * @param app
 */
function init(app) {
    var keys = Object.keys(DependenciesMap);
    var allDeps = _.uniq(_.flatten(_.values(DependenciesMap)));

    allDeps.forEach(function (d) {
        if (!_.contains(keys, d)) {
            throw new Error("Unresolved dependency: " + d)
        }
    });


    keys.forEach(function (k) {
        var dep = DependenciesMap[k];
        if (_.contains(dep, k)) {
            throw new Error('Circular dependency: key: ' + k);
        }

        if (dep.length == 0) {
            HandlerArray.push(getHandler(app, k, PluginsData[k]));
        }
    });

    async.series(HandlerArray, function (err, end) {
        if (err)
            throw err;

        saveSchemas(app);
    });
}

function reset() {
    PluginsData = null;
    DependenciesMap = null;
    SchemaDataHandler = null;
    SavedSchemas = [];
    HandlerArray = [];
}

/*
 exports.setDependenciesMap = function (dependenciesMap) {
 DependenciesMap = dependenciesMap;
 };

 exports.setPluginsData = function (pluginsData) {
 PluginsData = pluginsData;
 };

 exports.setSchemaDataHandler = function (schemaDataHandler) {
 SchemaDataHandler = schemaDataHandler;
 };
 */

/**
 * Handler for COMPLETED_EVENT
 * @param callback {Function}
 */
exports.onComplete = function (callback) {
    event.on(COMPLETED_EVENT, callback);
    reset();
};

/**
 *
 * @param app
 * @param dependenciesMap {Object} Map between schemas
 * @param pluginsData  {Object} Default data map as per schema name
 * @param schemaDataHandler {Object} Map of Data handler functions provided with plugins as per schema name
 */
exports.init = function (app, dependenciesMap, pluginsData, schemaDataHandler) {
    if (arguments.length != 4) {
        throw new Error('Missing arguments.');
    }
    DependenciesMap = dependenciesMap;
    PluginsData = pluginsData;
    SchemaDataHandler = schemaDataHandler;
    init(app)
};


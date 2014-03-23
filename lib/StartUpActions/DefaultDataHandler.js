/**
 * Startup action to insert default data and populate collections
 */


var plugins = require('../plugins');
var async = require("async");
var _ = require('underscore');
var DBActions = require('../DBActions');
var _l = Debug._l, _li = Debug._li;

var DefaultDataHandlerUtil = require('../DefaultDataHandler');

module.exports = function (app, done) {
    return function (next) {

        function complete(err) {
            next(err, done);
        }

        DBActions.getSimpleInstance(app, "Counter").get('findOne', function (err, c) {
            if (c) {
                _l('Default data exists...');
                return complete(err);
            }
            else {
                var dependenciesMap = {}, pluginsData = {}, schemaDataHandler = {};

                _.values(plugins.getAll()).forEach(function (plugin) {
                    var defaultData = plugin.defaultData;
                    var dataHandler = plugin.defaultDataHandler;
                    if (defaultData) {
                        var keys = Object.keys(defaultData);
                        var schema = keys[0];
                        pluginsData[schema] = defaultData[schema];
                        if (defaultData.deps) {
                            dependenciesMap[schema] = defaultData.deps;
                        } else {
                            dependenciesMap[schema] = [];
                        }
                    }
                    if (dataHandler) {
                        if (!_.isObject(dataHandler)) {
                            throw new Error("Invalid data handler defined in plugin: " + plugin.id);
                        }

                        _.each(dataHandler, function (handler, schema) {
                            if (!_.isFunction(handler)) {
                                throw new Error("Invalid data handler defined in plugin: " + plugin.id);
                            }
                            schemaDataHandler[schema] = handler;
                        });
                    }
                });
                DefaultDataHandlerUtil.init(app, dependenciesMap, pluginsData, schemaDataHandler);
            }
        });
        DefaultDataHandlerUtil.onComplete(complete);
    };
};
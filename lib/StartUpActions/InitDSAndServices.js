/**
 * Startup action to init db connection and add to app object
 */

var DataSource = require("loopback-datasource-juggler").DataSource,
    ServicesHelper = require("../ServicesHelper"),
    QueryHook = require("../ServicesHelper/query/hooks"),
    fs = require("fs");

module.exports = function (app, done) {

    return function (next) {
        var getKey = require("../AppProperties").get;

        var dbType = getKey("DB_TYPE");

        var ds = new DataSource({
            connector: require('loopback-connector-' + dbType),
            host: getKey("DB_HOST"),
            port: getKey("DB_PORT"),
            database: getKey("DB_NAME"),
            username: getKey("DB_USER"),
            password: getKey("DB_PASSWORD"),
            debug: false
        });

        Object.defineProperty(app, "dataSource", {
            get: function () {
                return ds;
            }
        });


        //setup query hook
//        Object.defineProperty(ds, "queryHook", {
//            get: function () {
//                return new QueryHook[dstype](ds);
//            }
//        });

        ds.queryHook = new QueryHook[dbType](ds);

        console.log(fs.readdirSync(utils.getServicesPath()))

        var servicePath = utils.getServicesPath(),
            modelPaths = [];
        fs.readdirSync(servicePath).forEach(function (folderName) {
            if (utils.contains(folderName, "Service")) {
                modelPaths.push(utils.realPath(servicePath, folderName));
            }
        });

        //register service & model events
        ServicesHelper.registerService(app, modelPaths, next);

        //helper to get service from app
        app.getService = function (serviceName) {
            return app.dataSource.models[serviceName];
        };

        console.log("dsc")
    }
};

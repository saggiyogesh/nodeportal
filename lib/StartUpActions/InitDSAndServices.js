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

        var dbName = getKey("DB_NAME"),
            dbURL = "mongodb://" + getKey("DB_USER") + ":"
                + getKey("DB_PASSWORD") + "@" + getKey("DB_HOST") + ":" +
                getKey("DB_PORT") + "/" + dbName;


//        Debug._l("Initiating DB service: " + dbName);
//        Debug._l(dbURL);
//        mongoose.connect(dbURL);
//        var db = mongoose.connection;
//
//        db.on('error', function (e) {
//            Debug._l("Mongo connection error " + e);
//        });
//
//        db.on('open', function (e) {
//            Debug._l("connected to db: " + dbName);
//            app.set('db', db);
////            next(e, done);
//        });


        //----- new code starts ----------------

        var dstype = "mysql";
        var ds = new DataSource({
            connector: require('loopback-connector-' + dstype),
//            host: 'localhost',
//            port: 3306,
            database: 'np1',
            username: "root",
            password: "root",
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

        ds.queryHook = new QueryHook[dstype](ds);

        console.log(fs.readdirSync(utils.getServicesPath()))

        var services = {};
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

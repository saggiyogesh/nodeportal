/**
 * Startup action to init db connection and add to app object
 */

var mongoose = require("mongoose");

var DataSource = require("loopback-datasource-juggler").DataSource,
    QueryHook = require("../DBHelper/query/hooks"),
    fs = require("fs");

module.exports = function (app, done) {

    return function (next) {
        var getKey = require("../AppProperties").get;

        var dbName = getKey("DB_NAME"),
            dbURL = "mongodb://" + getKey("DB_USER") + ":"
                + getKey("DB_PASSWORD") + "@" + getKey("DB_HOST") + ":" +
                getKey("DB_PORT") + "/" + dbName;


        Debug._l("Initiating DB service: " + dbName);
        Debug._l(dbURL);
        mongoose.connect(dbURL);
        var db = mongoose.connection;

        db.on('error', function (e) {
            Debug._l("Mongo connection error " + e);
        });

        db.on('open', function (e) {
            Debug._l("connected to db: " + dbName);
            app.set('db', db);
//            next(e, done);
        });


        //----- new code starts ----------------

        var dstype = "mongodb";
        var ds = new DataSource({
            connector: require('loopback-connector-' + dstype),
//            host: 'localhost',
//            port: 3306,
//            database: 'np',
//            username: "root",
//            password: "root",
            debug: false
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
        var servicePath = utils.getServicesPath();
        fs.readdirSync(servicePath).forEach(function (folderName) {
            if (utils.contains(folderName, "Service")) {
                var service = require(utils.realPath(servicePath, folderName))   ;
                ds.attach(service);
            }
        });

        Object.defineProperty(app, "dataSource", {
            get: function () {
                return ds;
            }
        });

        ds.autoupdate(next);
    }
};

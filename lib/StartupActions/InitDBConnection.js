/**
 * Startup action to init db connection and add to app object
 */

var mongoose = require("mongoose");

module.exports = function (app, done) {

    return function (next) {
        var getKey = require("../AppProperties").get;

        var dbName = getKey("DB_NAME"),
            dbURL = "mongodb://" + getKey("DB_USER") + ":"
                + getKey("DB_PASSWORD") + "@" + getKey("DB_HOST") + ":" +
                getKey("DB_PORT") + "/" + dbName;


        Debug._l("Initiating DB service: " + dbName);
        Debug._l(dbURL);

        var db = mongoose.createConnection(dbURL);
        db.on('open', function (e) {
            Debug._l("connected to db: " + dbName);
            app.set('db', db);
            next(e, done);
        });
    }
};

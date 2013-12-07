/**
 * Startup action to configure model events
 */

var ModelEvents = require("../ModelEvents"),
    AppProperties = require("../AppProperties");

module.exports = function (app, done) {
    return function (next) {
        app.set("modelEvents", {});
        var schemas = AppProperties.get("SCHEMA_LIST_MODEL_EVENTS");
        Debug._l("schemas: " + schemas);
        schemas && schemas.split(",").forEach(function (schema) {
            ModelEvents.registerModel(app, schema);
        });
        next(null, done);
    };
};
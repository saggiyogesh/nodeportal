/**
 * Startup action to configure model events
 * Model events will be fired for every model except SKIP_MODELS
 */

var ModelEvents = require("../ModelEvents"),
    ServicesHelper = require("../ServicesHelper"),
    ExtraModelEvents = require("../ServicesHelper/event/");

var SKIP_MODELS = ["Counter", "ModelPermission"];

module.exports = function (app, done) {
    return function (next) {
        app.set("modelEvents", {});
        Object.keys(app.dataSource.models).forEach(function (modelName) {
            if (!utils.containsArray(SKIP_MODELS, modelName)) {
                ModelEvents.registerModel(app, modelName);
                ServicesHelper.registerModelEvent(app, modelName);
            }
        });

        var dbType = app.dataSource.connector.name;
        ExtraModelEvents[dbType] && ExtraModelEvents[dbType](app);
        next(null, done);
    };
};
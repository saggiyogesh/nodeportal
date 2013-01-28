/**
 * Utility to attach save and update events to model schema
 */

var EventEmitter = require('events').EventEmitter;

function ModelEvents(schemaName) {
    var saveEvent = schemaName + ":" + "SAVE";
    var updateEvent = schemaName + ":" + "UPDATE";

    EventEmitter.call(this);

    this.__defineGetter__('name', function () {
        return schemaName
    });

    this.on(saveEvent, function (e) {
        Debug._l("model saved: " + schemaName);
        Debug._li("", e, true);
    });

    this.on(updateEvent, function (e) {
        Debug._l("model updated: " + schemaName);
        Debug._li("", e, true);
    });

    /**
     * Events fired when model is saved
     * @param {Number}modelId
     */
    this.onSave = function (modelId) {
        this.emit(saveEvent, {schemaName:schemaName, modelId:modelId});
    };

    /**
     * Events fired when model is updated
     * @param {Number}modelId
     */
    this.onUpdate = function (modelId) {
        this.emit(updateEvent, {schemaName:schemaName, modelId:modelId});
    };

    /**
     * Save event handler
     * Callback fn have event object as parameter.
     * Event object has schemaName and modelId as properties
     * @param {Function}fn
     */
    this.handleSave = function (fn) {
        this.on(saveEvent, fn);
    };

    /**
     * Update event handler
     * Callback fn have event object as parameter.
     * Event object has schemaName and modelId as properties
     * @param {Function}fn
     */
    this.handleUpdate = function (fn) {
        this.on(updateEvent, fn);
    };

}

util.inherits(ModelEvents, EventEmitter);
var appModelEvents;

/**
 * Register Model and initialize events
 * @param {Object}app
 * @param {String}schemaName
 */
exports.registerModel = function (app, schemaName) {
    appModelEvents = app.set("modelEvents");
    if (!appModelEvents[schemaName])
        appModelEvents[schemaName] = new ModelEvents(schemaName);
    else
        Debug._l("ModelEvent already registered for schema " + schemaName);
};

exports.unRegisterModel = function (schemaName) {
//    appModelEvents = app.set("modelEvents");
    delete appModelEvents[schemaName];
};

exports.getModelEvent = function (schemaName) {
    return appModelEvents[schemaName];
};

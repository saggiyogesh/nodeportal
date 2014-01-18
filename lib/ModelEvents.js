/**
 * Utility to attach save ,update and delete events to model schema
 * Events not fired when model operations are done by queries
 */

var EventEmitter = require('events').EventEmitter;

function ModelEvents(schemaName) {
    var saveEvent = schemaName + ":" + "SAVE";
    var updateEvent = schemaName + ":" + "UPDATE";
    var deleteEvent = schemaName + ":" + "DELETE";

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

    this.on(deleteEvent, function (e) {
        Debug._l("model deleted: " + schemaName);
        Debug._li("", e, true);
    });

    /**
     * Events fired when model is saved
     * @param {Number} modelId
     * @param {Object} modelData Collection data object which is currently saved.
     */
    this.onSave = function (modelId, modelData) {
        this.emit(saveEvent, {schemaName: schemaName, modelId: modelId, modelData: modelData});
    };

    /**
     * Events fired when model is updated
     * @param {Number} modelId
     * @param {Object} modelData Collection data object which is currently updated.
     */
    this.onUpdate = function (modelId, modelData) {
        this.emit(updateEvent, {schemaName: schemaName, modelId: modelId, modelData: modelData});
    };

    /**
     * Events fired when model is deleted
     * @param {Number} modelId
     * @param {Object} modelData Collection data object which is currently deleted.
     */
    this.onDelete = function (modelId, modelData) {
        this.emit(deleteEvent, {schemaName: schemaName, modelId: modelId, modelData: modelData});
    };

    /**
     * Save event handler
     * Callback fn have event object as parameter.
     * Event object has schemaName and modelId as properties
     * @param {Function}fn
     * @param {Object} [scope]
     */
    this.handleSave = function (fn, scope) {
        fn = fn.bind(scope);
        this.on(saveEvent, fn);
    };

    /**
     * Update event handler
     * Callback fn have event object as parameter.
     * Event object has schemaName and modelId as properties
     * @param {Function}fn
     * @param {Object} [scope]
     */
    this.handleUpdate = function (fn, scope) {
        fn = fn.bind(scope);
        this.on(updateEvent, fn);
    };

    /**
     * Delete event handler
     * Callback fn have event object as parameter.
     * Event object has schemaName and modelId as properties
     * @param {Function}fn
     * @param {Object} [scope]
     */
    this.handleDelete = function (fn, scope) {
        fn = fn.bind(scope);
        this.on(deleteEvent, fn);
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

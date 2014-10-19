var getModelEvent = require("../ModelEvents").getModelEvent;

/**
 * Method to register service to datasource
 * @param app {Object} Application object
 * @param modelPaths [Array] path of service conf file
 * @param next {Function} params : err
 *
 */
exports.registerService = function (app, modelPaths, next) {
    if (!_.isArray(modelPaths)) {
        modelPaths = [modelPaths];
    }
    var ds = app.dataSource;

    modelPaths.forEach(function (modelPath) {
        var service = require(modelPath);
        var name = service.definition.name;
        if(ds.models[name]){
            throw new Error("Service already registered: " + name);
        }
        ds.attach(service);
        require("./DAOExtras")(service); //reattaching DAOExtras methods to DAO
        Debug._l("Service registered : " + name)
    });
    ds.autoupdate(next);
};

/**
 * Method to register model event of service to loopback hooks.
 * @param app {Object} Application object
 * @param modelName {String}
 */
exports.registerModelEvent = function (app, modelName) {
    var evtObj = getModelEvent(modelName);
    var service = app.getService(modelName),
        idName = service.getIdName();

    //bind onDelete model events to afterDestroy hook
    service.afterDestroy = function (n) {
        var model = this;
        evtObj && evtObj.onDelete && evtObj.onDelete(model[idName], getUnModifiableModel(model));
        n();
    };

    //bind onUpdate model events to afterUpdate hook
    service.afterUpdate = function (n) {
        var model = this;
        evtObj && evtObj.onUpdate && evtObj.onUpdate(model[idName], getUnModifiableModel(model));
        n();
    };

    //bind onSave model events to afterCreate hook
    service.afterCreate = function (n) {
        var model = this;
        evtObj && evtObj.onSave && evtObj.onSave(model[idName], getUnModifiableModel(model));
        n();
    };

    Debug._l("Model Event registered : " + modelName);
};

function getUnModifiableModel(model) {
    return Object.freeze(model)
}


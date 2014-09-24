var getModelEvent = require("../ModelEvents").getModelEvent;

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

        exports.registerModelEvent(app, name);
        Debug._l("Service registered : " + name)
    });
    ds.autoupdate(next);
};

exports.registerModelEvent = function (app, modelName) {
    var evtObj = getModelEvent(modelName);
    var ds = app.dataSource;
    var service = ds.models[modelName],
        idName = service.getIdName();

    //bind onDelete model events to afterDestroy hook
    service.afterDestroy = function (err) {
        var model = this;
        evtObj && evtObj.onDelete && evtObj.onDelete(model[idName], getUnModifiableModel(model));
    };

    //bind onUpdate model events to afterUpdate hook
    service.afterUpdate = function (err) {
        var model = this;
        evtObj && evtObj.onUpdate && evtObj.onUpdate(model[idName], getUnModifiableModel(model));
    };

    //bind onSave model events to afterCreate hook
    service.afterCreate = function (err) {
        var model = this;
        evtObj && evtObj.onSave && evtObj.onSave(model[idName], getUnModifiableModel(model));
    };
};

function getUnModifiableModel(model) {
    return Object.freeze(model)
}


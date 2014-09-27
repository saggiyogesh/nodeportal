/*
 * Model events registered specific to mysql database
 */

var getModelEvent = require("../../ModelEvents").getModelEvent,
    MODEL_PERMISSION_NAME = "ModelPermission",
    ds;

/**
 * handler for save model event
 * @param event {ModelEvent}
 */
function handleModelSave(event) {
    var m = event.modelData,
        rP = m.rolePermissions,
        modelName = event.schemaName;
    if (rP) {
        Debug._l("creating mp: " + modelName)
        var ModelPermissionService = ds.models[MODEL_PERMISSION_NAME];
        _.each(rP, function (p, r) {
                ModelPermissionService.create({
                    modelId: event.modelId,
                    modelName: modelName,
                    roleId: r,
                    permissions: p.length == 0 ? 0 : p.reduce(function (a, b) {
                        return parseInt(a) + parseInt(b);
                    })
                }, function (e, m) {
                    e && Debug._l(e);
                });
            }
        );
    }
}

/**
 * handler for delete model event
 * @param event {ModelEvent}
 */
function handleModelDelete(event) {
    var m = event.modelData,
        modelName = event.schemaName;
    Debug._l("deleting mp: " + modelName)
    var ModelPermissionService = ds.models[MODEL_PERMISSION_NAME];
    ModelPermissionService.deleteAll({
        modelId: event.modelId,
        modelName: modelName
    });
}

/**
 * handler for update model event
 * @param event {ModelEvent}
 */
function handleModelUpdate(event) {
    var m = event.modelData,
        rP = m.rolePermissions,
        modelName = event.schemaName;
    if (rP) {
        Debug._l("updating mp: " + modelName)
        var ModelPermissionService = ds.models[MODEL_PERMISSION_NAME];

        _.each(rP, function (p, r) {
                var where = {
                        modelId: event.modelId,
                        modelName: modelName,
                        roleId: r
                    },
                    data = {
                        permissions: p.length == 0 ? 0 : p.reduce(function (a, b) {
                            return parseInt(a) + parseInt(b);
                        })
                    };
                ModelPermissionService.updateAll(where, data, function (e, m) {
                    e && Debug._l(e);
                })
            }
        );
    }
}
/**
 * Function to update modelPermissions table for sql dbs from rolePermissions column of any model row
 * @param models
 */
function registerAuthModels(models) {
    _.each(models, function (model, name) {
        if (model.definition.settings.auth) { // enables auth services
            var me = getModelEvent(name);
            me.handleSave(handleModelSave);
            me.handleDelete(handleModelDelete);
            me.handleUpdate(handleModelUpdate);
        }
    });
}

module.exports = function registerSQLEvent(app) {
    ds = app.dataSource;
    registerAuthModels(ds.models);
};

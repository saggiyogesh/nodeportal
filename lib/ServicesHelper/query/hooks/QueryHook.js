var PermissionActions = require("../../../permissions").PermissionActions;

function QueryHook(dataSource) {
    /**
     * @returns {DataSource}
     */
    this.getDataSource = function () {
        return dataSource;
    };

    /**
     * @returns {Connector}
     */
    this.getConnector = function () {
        return dataSource.connector;
    };


    this.getViewBitValue = function () {
        return PermissionActions.VIEW.bit;
    };

    this.getUpdateBitValue = function () {
        return PermissionActions.UPDATE.bit;
    };

    this.getDeleteBitValue = function () {
        return PermissionActions.DELETE.bit;
    };

    this.getAddBitValue = function () {
        return PermissionActions.ADD.bit;
    };

    this.getPermissionBitValue = function () {
        return PermissionActions.PERMISSION.bit;
    };


}

QueryHook.prototype.authorizedFind = function (roles, modelName, filter, next) {
    throw new Error("Not implemented");
};

QueryHook.prototype.authorizedCount = function (roles, modelName, where, next) {
    throw new Error("Not implemented");
};

QueryHook.prototype.authorizedUpdate = function (data, roles, modelName, where, next) {
    throw new Error("Not implemented");
};

QueryHook.prototype.authorizedDelete = function (roles, modelName, where, next) {
    throw new Error("Not implemented");
};

QueryHook.prototype.toDataModel = function (modelName, data, query) {
    !_.isArray(data) && (data = [data]);

    query = query || {};

    var connector = this.getConnector(), service = this.getDataSource().getModel(modelName);
    return data.map(function (obj) {
        var d = connector.fromDatabase(modelName, obj);
        obj = new service(d, {fields: query.fields, applySetters: false, persisted: true});
        //TODO handle query.include && query.collect as per all() in loopback dao.js
        return obj
    });
};

/**
 *
 * @param where {Object}
 * @param column {String}
 * @param keyword {String}
 * @param [isNotLike] {Boolean}
 */
QueryHook.prototype.buildLikeFilter = function (where, column, keyword, isNotLike) {
    throw new Error("Not implemented");
};

module.exports = QueryHook;
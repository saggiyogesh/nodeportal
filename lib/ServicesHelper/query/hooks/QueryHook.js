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

module.exports = QueryHook;
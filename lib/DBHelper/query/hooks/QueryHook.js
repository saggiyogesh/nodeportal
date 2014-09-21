

function QueryHook(dataSource){
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

}

QueryHook.prototype.authorizedFind = function(roles, modelName, filter, next){
    throw new Error("Not implemented");
};

QueryHook.prototype.authorizedCount = function(roles, modelName, where, next){
    throw new Error("Not implemented");
};

module.exports = QueryHook;
var util = require("util"),
    QueryHook = require("./QueryHook");

function SqlQueryHook(dataSource) {
    QueryHook.call(this, dataSource);

    /**
     *
     * @returns {Object}
     */
    this.getModelPermission = function () {
        return ModelPermission;
    };

    //create table
    dataSource.define(ModelPermission.name, ModelPermission.properties);
    this.postInit();
}

util.inherits(SqlQueryHook, QueryHook);

/**
 * To be inherited by sub classes
 */
SqlQueryHook.prototype.postInit = function () {
};


SqlQueryHook.prototype._getPermissionPartQueryFilter = function (roles, actionBit) {
    return {
        fields: ["modelId"],
        "where": {
            roleId: {
                inq: roles
            }
        }

    }
};

SqlQueryHook.prototype.buildQuery = function (filter) {
    throw new Error("Not implemented");
};

SqlQueryHook.prototype.buildPermissionPartQuery = function (roles, actionBit) {
    throw new Error("Not implemented");
};

SqlQueryHook.prototype.buildPermissionQuery = function (model, roles, actionBit) {
    var ds = this.getDataSource(), connector = this.getConnector(),
        idName = ds.definitions[model].idName();
    var sql =  connector.columnEscaped(model, idName) ;
    sql += ' IN (' + this.buildPermissionPartQuery(roles, actionBit) + ' )';

    console.log("buildPermissionFullQuery: " + sql)
    return sql;
};

SqlQueryHook.prototype.executeQuery = function(sql, next){
    this.getConnector().query(sql, next);
};


/**
 * Permission handling in sql queries are implemented using this table.
 * This will store the modelId, modelName, roleId, total permission of this role for this model
 *
 */
var ModelPermission = {
    name: "ModelPermission",
    properties: {
        modelPermissionId: { type: Number, id: true },
        modelId: Number,
        modelName: String,
        roleId: Number,
        permissions: Number
    }
};

module.exports = SqlQueryHook;
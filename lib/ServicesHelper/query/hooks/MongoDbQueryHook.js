var util = require("util"),
    NoSqlQueryHook = require("./NoSqlQueryHook");

function MongoDbQueryHook(dataSource) {
    NoSqlQueryHook.call(this, dataSource);
}

util.inherits(MongoDbQueryHook, NoSqlQueryHook);

module.exports = MongoDbQueryHook;

MongoDbQueryHook.prototype.buildOrFilter = function(roles, filter){
    filter.where = filter.where || {};
    var orFilter = [];
    roles.forEach(function (role) {
        var f = {};
        f["rolePermissions." + role] = 1; //todo insert actuaL value
        orFilter.push(f)
    });
    filter.where.or = orFilter;
};

MongoDbQueryHook.prototype.authorizedFind = function (roles, modelName, filter, next) {
    var connector = this.getConnector();
    filter = filter || {};
    this.buildOrFilter(roles, filter);
    connector.all(modelName, filter, next);

};

MongoDbQueryHook.prototype.authorizedCount = function (roles, modelName, where, next) {
    var connector = this.getConnector();
    var filter = {
        where : where
    };
    this.buildOrFilter(roles, filter);
    connector.count(modelName, next, filter.where);
};
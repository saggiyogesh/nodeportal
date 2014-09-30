var util = require("util"),
    SqlQueryHook = require("./SqlQueryHook");

function MySqlQueryHook(dataSource) {
    SqlQueryHook.call(this, dataSource);
}

util.inherits(MySqlQueryHook, SqlQueryHook);


MySqlQueryHook.prototype.buildOrderBy = function (model, order) {
    var self = this.getConnector();
    if (typeof order === 'string') {
        order = [order];
    }
    return 'ORDER BY ' + order.map(function (o) {
        var t = o.split(/[\s,]+/);
        if (t.length === 1) {
            return self.columnEscaped(model, o);
        }
        return self.columnEscaped(model, t[0]) + ' ' + t[1];
    }).join(', ');
};

MySqlQueryHook.prototype.buildLimit = function (limit, offset) {
    if (isNaN(limit)) {
        limit = 0;
    }
    if (isNaN(offset)) {
        offset = 0;
    }
    return 'LIMIT ' + (offset ? (offset + ',' + limit) : limit);
};

MySqlQueryHook.prototype.buildQuery = function (model, filter) {
    var connector = this.getConnector();
    //copied from mysql connector
    var sql = 'SELECT ' + connector.getColumns(model, filter.fields) + ' FROM ' + connector.tableEscaped(model);

    if (filter) {

        if (filter.where) {
            sql += ' ' + connector.buildWhere(model, filter.where);
        }

        if (filter.order) {
            sql += ' ' + this.buildOrderBy(connector, model, filter.order);
        }

        if (filter.limit) {
            sql += ' ' + this.buildLimit(filter.limit, filter.skip || filter.offset || 0);
        }
    }

    return sql;
};


MySqlQueryHook.prototype.buildPermissionPartQuery = function (roles, actionBit) {
    var ModelPermission = this.getModelPermission(),
        model = ModelPermission.name, connector = this.getConnector();

    var filter = this._getPermissionPartQueryFilter(roles);

    var sql = this.buildQuery(model, filter);

    sql += ' AND ' + connector.columnEscaped(model, "permissions") + ' & ' + actionBit;

    console.log("buildPermissionPartQuery> " + sql);

    return sql;
};

MySqlQueryHook.prototype.authorizedFind = function (roles, modelName, filter, next) {
    var connector = this.getConnector();
    var q = [];
    q.push(this.buildQuery(modelName, {}));
    if (filter.where) {
        q.push(connector.buildWhere(modelName, filter.where));
        q.push('AND');
    } else {
        q.push('WHERE');
    }
    q.push(this.buildPermissionQuery(modelName, roles, this.getViewBitValue()));
    filter.order && q.push(this.buildOrderBy(modelName, filter.order));
    filter.limit && q.push(this.buildLimit());

    this.executeQuery(q.join(' '), next);
};

MySqlQueryHook.prototype.authorizedCount = function (roles, modelName, where, next) {
    var connector = this.getConnector();
    var q = [];
    q.push('SELECT count(*) as cnt FROM');
    q.push(connector.tableEscaped(modelName));
    where = connector.buildWhere(modelName, where);
    if (where) {
        q.push(where);
        q.push('AND');
    } else {
        q.push('WHERE');
    }
    q.push(this.buildPermissionQuery(modelName, roles, this.getViewBitValue()));
    this.executeQuery(q.join(' '), function (err, res) {
        next(err, (res && res[0] && res[0].cnt) || 0)
    });
};

MySqlQueryHook.prototype.authorizedDelete = function (roles, modelName, where, next) {
    var connector = this.getConnector();
    var q = [];
    q.push('DELETE FROM');
    q.push(connector.tableEscaped(modelName));
    where = connector.buildWhere(modelName, where);
    if (where) {
        q.push(where);
        q.push('AND');
    } else {
        q.push('WHERE');
    }
    q.push(this.buildPermissionQuery(modelName, roles, this.getDeleteBitValue()));
    this.executeQuery(q.join(' '), next);
};

MySqlQueryHook.prototype.authorizedUpdate = function (data, roles, modelName, where, next) {
    var connector = this.getConnector();
    var q = [];
    q.push('UPDATE');
    q.push(connector.tableEscaped(modelName));
    q.push('SET');
    q.push(connector.toFields(modelName, data));
    where = connector.buildWhere(modelName, where);
    if (where) {
        q.push(where);
        q.push('AND');
    } else {
        q.push('WHERE');
    }
    q.push(this.buildPermissionQuery(modelName, roles, this.getUpdateBitValue()));
    this.executeQuery(q.join(' '), next);
};

module.exports = MySqlQueryHook;
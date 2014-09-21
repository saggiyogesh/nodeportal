var util = require("util"),
    QueryHook = require("./QueryHook");

function NoSqlQueryHook(dataSource) {
    QueryHook.call(this, dataSource);
}

util.inherits(NoSqlQueryHook, QueryHook);


function NoSqlQueryHook(dataSource){
    QueryHook.call(this, dataSource);
}

module.exports = NoSqlQueryHook;
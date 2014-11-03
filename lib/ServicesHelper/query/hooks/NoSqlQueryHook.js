var util = require("util"),
    QueryHook = require("./QueryHook");

function NoSqlQueryHook(dataSource) {
    QueryHook.call(this, dataSource);
}

util.inherits(NoSqlQueryHook, QueryHook);


function NoSqlQueryHook(dataSource){
    QueryHook.call(this, dataSource);
}

NoSqlQueryHook.prototype.buildLikeFilter = function (where, column, keyword, isNotLike) {
    if (where && column && keyword) {
        var o = {}, like = new RegExp("^" + keyword, "i");
        isNotLike ? o.nlike = like : o.like = like;
        where[column] = o;
    }
    else {
        throw new Error("Invalid Parameters");
    }
};

module.exports = NoSqlQueryHook;
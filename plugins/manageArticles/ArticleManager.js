var Article_Schema = "Article", Article_Version_Schema = "ArticleVersion",
    columns = ["", "id", "localizedTitle.en_US", "createDate", "displayDate"],
    direction = {"asc": 1, "desc": -1 };


//TODO remove this file. merge all the methods in AMC


//function getQuery(dbAction, id) {
//    return dbAction.getQuery(true).where("id", id);
//}

var getLatestArticleById = exports.getLatestArticleById = function (id, roles, articleAuthService, next) {
    articleAuthService.getById(id, roles, next);
};

//TODO with paging
exports.getArticles = function (dbAction, queryParams, next) {
    var sortCol = queryParams["iSortCol_0"], sortDir = queryParams["sSortDir_0"],
        start = queryParams["iDisplayStart"], length = queryParams["iDisplayLength"],
        searchKeyword = queryParams["sSearch"];

    //same query can't be used for count & search
    if (sortDir == "desc") {
        sortDir = "-";
    }
    else {
        sortDir = "";
    }

    var searchQuery = dbAction.getQuery()
            .sort(sortDir + columns[sortCol])
            .limit(length).skip(start),

        countQuery = dbAction.getQuery()
            .limit(length).skip(start);


    if (searchKeyword) {
        var regex = new RegExp("^" + searchKeyword, "i");
        searchQuery.regex('localizedTitle.en_US', regex);
        countQuery.regex('localizedTitle.en_US', regex);
    }

    dbAction.authorizedCount(countQuery, function (err, count) {
        var ret = {
            data: [],
            count: count
        };
        if (!err && count > 0) {
            dbAction.authorizedGetByQuery(searchQuery, function (err, result) {
                ret.data = result;
                next(err, ret);
            });
        }
        else
            next(err, ret);
    });

};


exports.moveArticleToArticleVersion = function (id, dbAction, dbActionVersion, next) {
    getLatestArticleById(id, dbAction, function (err, curArticle) {
        if (err) {
            return next(err);
        }
//        Debug._li("", curArticle, true);
        dbActionVersion.save(curArticle, function (err, result) {
            if (err) {
                return next(err);
            }
            if (result) {
                dbAction.removeByQuery(getQuery(dbAction, id), next);
            }
        })
    })

};
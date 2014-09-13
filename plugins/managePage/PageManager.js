var PAGE_SCHEMA = "Page";


exports.viewAll = function (dbAction, next) {
    var query = dbAction.getQuery().where('friendlyURL').sort("pageId");
    dbAction.authorizedGetByQuery(query, next);
};

exports.hasChildren = function (dbAction, pageId, next) {

    var query = dbAction.getQuery().where("parentPageId", pageId);
    dbAction.authorizedGetByQuery(query, next);
};

exports.getChildrenCount = function (dbAction, parentPageId, next) {

    var query = dbAction.getQuery()
        .where("parentPageId", parentPageId);
    dbAction.authorizedCount(query, next);
};

/**
 * Get those siblings whose order is greater than current page(@param page)
 * @param dbAction
 * @param pageId
 * @param next
 */
exports.getAboveSiblings = function (dbAction, page, next) {
    async.series([
        function (n) {
            if (page) {
                var pPId = page.parentPageId , q;
                Debug._l("ppid: " + pPId)
                q = dbAction.getQuery().where("parentPageId", pPId)
                    .where('order').gt(page.order)
                    .sort("order");

                dbAction.getByQuery(q, n);
            }
            else {
                n(new Error("Page not valid"));
            }
        }
    ], function (err, result) {
        if(result && result.length > 0){
            result = result[0];
        }
        next(err, result);
    });
};
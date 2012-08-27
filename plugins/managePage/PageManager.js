var PAGE_SCHEMA = "Page";

var settingsPageURL = "/settings";

exports.viewAll = function (dbAction, next) {
    var query = dbAction.getQuery().where('friendlyURL').ne(settingsPageURL).sort("pageId" , 1);
    dbAction.authorizedGetByQuery(query, next);
};

exports.hasChildren = function (dbAction, pageId, next) {

    var query = dbAction.getQuery().where("parentPageId", pageId);
    dbAction.authorizedGetByQuery(query, next);
};
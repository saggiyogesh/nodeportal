var PAGE_SCHEMA = "Page";

var settingsPageURL = require(process.cwd()+"/lib/AppProperties").get("SETTINGS_PAGE_URL");

exports.viewAll = function (dbAction, next) {
    var query = dbAction.getQuery().where('friendlyURL').ne(settingsPageURL).sort("pageId");
    dbAction.authorizedGetByQuery(query, next);
};

exports.hasChildren = function (dbAction, pageId, next) {

    var query = dbAction.getQuery().where("parentPageId", pageId);
    dbAction.authorizedGetByQuery(query, next);
};
/**
 * Handles requests for pages
 */


var getProp = require("../../lib/AppProperties").get;
var PageRenderer = require("../../lib/PageRenderer");


module.exports = function (app) {
    var availableLocales = getProp("AVAILABLE_LOCALES").split(",");
    var pagePermission = require(app.set("appPath") + "/lib/permissions/PagePermission");
    app.get("/", function (req, res) {
        res.redirect(getProp("DEFAULT_INDEX_PAGE"));
    });

    /*app.get("/:locale?/:page/:plugin", function (req, res, next) {
     Debug._l("2: ");
     next();

     }, pagePermission, handleRequest);*/

    /**
     * Restrict this route as per available locales, otherwise it'll match with url with page, wrong plugin id and no locale code
     */
    app.get("/:locale(" + availableLocales.join("|") + ")?/:page", function (req, res, next) {
        Debug._l("3: ");
        next();

    }, pagePermission, handleRequest);


    //for instanciable plugins
    /*app.get("/:locale?/:page/:plugin/:iId([1-9]+)", function (req, res, next) {
     Debug._l("1: ");
     next();

     }, check, handleRequest);*/


};

function handleRequest(req, res) {
    /*PageRenderer.checkPagePermissions(req, res, function (err, page) {
     if (err) {
     PageRenderer.showErrorPage(err, page, req, res);
     return;
     }
     PageRenderer.render(req, res);
     });*/
    Debug._l("loc: " + req.params.locale)
    PageRenderer.render(req, res);
}

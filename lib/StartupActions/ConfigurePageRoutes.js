/**
 * Startup action to configure page routes
 */

var getProp = require("../AppProperties").get;
var PageRenderer = require("../PageRenderer");

module.exports = function (app, done) {
    return function (next) {

        var availableLocales = getProp("AVAILABLE_LOCALES").split(",");

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

        }, utils.getRequestMiddlewares(app), PageRenderer.render);


        //for instanciable plugins
        /*app.get("/:locale?/:page/:plugin/:iId([1-9]+)", function (req, res, next) {
         Debug._l("1: ");
         next();

         }, check, handleRequest);*/

        next(null, done);


    };

   /* function handleRequest(req, res) {
        Debug._l("loc: " + req.params.locale)
        (req, res);
    };*/
};
/**
 * Setup Error handler for 404, 500 & permission error.
 */
var Renderer = require("../Renderer"),
    getProp = require("../AppProperties").get,
    PageNotFoundError = require("../errors/PageNotFoundError");

function processError(error, req, res, next) {
    if (utils.contains(req.url, "/js/") || utils.contains(req.url, "/css/")
        || utils.contains(req.url, "/images/")) { // static resources (js, css etc.) skip error handling
        next();
    } else {
        if (!req.attrs.page) {
            req.attrs.page = req.app.set("IndexPage");
        }

        //some how req.params are not available for errors
        req.params = req.params || {};

        Renderer.renderError(error, req, res, next);
    }
}

module.exports = function (app, done) {
    return function (next) {
        app.use(function (error, req, res, next) {

            error.stack && Debug._l(error.stack);

            processError(error, req, res, next);
        });

        next(null, done);
    };
};
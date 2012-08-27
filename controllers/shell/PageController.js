/**
 * Handles requests for pages
 */


var getProp = require("../../lib/AppProperties").get;
var PageRenderer = require("../../lib/PageRenderer");

module.exports = function (app) {

    app.get("/", function (req, res) {
        res.redirect(getProp("DEFAULT_INDEX_PAGE"));
    });
    app.get("/:page", handleRequest);

    app.get("/:page/:plugin", handleRequest);

    //for instanciable plugins
    app.get("/:page/:plugin/:iId", handleRequest);

};

function handleRequest(req, res) {
    PageRenderer.checkPagePermissions(req, res, function(err, page){
        if(err){
            PageRenderer.showErrorPage(err, page, req, res);
            return;
        }
        PageRenderer.render(req, res);
    });
};

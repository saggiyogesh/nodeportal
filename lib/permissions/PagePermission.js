/*
 *  Checks page permission for request
 */

var PageRenderer = require("../PageRenderer.js");
module.exports = function (req, res, next) {
    Debug._l("PP: " + req.url);

    var params = req.params;

    Object.keys(params).forEach(function (param) {
        Debug._l("key: " + param + " : " + params[param]);
    });


    PageRenderer.checkPagePermissions(req, res, function (err, page) {
        if (err) {
            PageRenderer.showErrorPage(err, page, req, res);
            return;
        }
        next();
    });
};

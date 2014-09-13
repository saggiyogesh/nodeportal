/*
 *  Checks page permission for request
 */

var DBActions = require("../DBActions"),
    Router = require("../Router"),
    PermissionValidator = require('../permissions/PermissionValidator'),
    PermissionError = require('../permissions/PermissionError'),
    PageNotFoundError = require("../errors/PageNotFoundError"),
    PAGE_SCHEMA = "Page",
    PAGE_PERMISSION_SCHEMA = "model.pageSchema.Page",
    VIEW_ACTION = "VIEW";

function checkPagePermissions(req, res, next) {
    var app = req.app;
    var dbAction = DBActions.getSimpleInstance(app, PAGE_SCHEMA);
    var permissionValidatorInstance = new PermissionValidator(req, PAGE_PERMISSION_SCHEMA, PAGE_SCHEMA), page;
    async.waterfall([
        function (n) {
            dbAction.get("findByFriendlyURL", "/" + req.params.page, n)
        },
        function (p, n) {
            // no p found
            // either url is an app routes or url is incorrect
            // app route has view permission
            !p ?
                Router.isAppRoute(req.url) ? n({hasView: true}) :
                    n(new PageNotFoundError("Not Exists: Page with friendly url : /" + req.params.page))
                : n(null, p);

//            if (!p) {
//                //check for app routes based url
//                if (Router.isAppRoute(req.url)) {
//                    // then url has permission of VIEW
//                    n({appRoute: true});
//                }
//                else {
//                    n(new PageNotFoundError("Not Exists: Page with friendly url : /" + req.params.p));
//                }
//
//
//            }
//            else {
//                n(null, p)
//            }

        },
        function (p, n) {
            Object.defineProperties(req.attrs, {
                page: {
                    value: p.toObject(),
                    enumerable: true
                }
            });
            var pageId = p.pageId;
            page = p;
            if (utils.contains(req.url, "login") && req.params.action === "doLogin") {
                //skip permission check, otherwise login is not shown from /app/login url
                n({hasView: true});
            }
            else {
                permissionValidatorInstance.hasPermission(VIEW_ACTION, pageId, n);
            }
        }
    ], function (err, result) {
        var hasPerm = false;
        if (err) {
            if (_.isObject(err) && err.hasView && err.hasView === true) {
                //case when app route or app login url has view permission
                err = null;
            }
            else {
                // not authorized
                // Debug._li("Chk in middleware Not Authorized pageId : " + page.pageId);
                // require("../login/LoginUtil").showLogin(req, res);
//                ResponseHelper.set404StatusCode(res);
//                err = new PermissionError(null, req.session.user.userName, VIEW_ACTION);
//                if (req.xhr) {
//                    //TODO change to response helper to send errors
//                    res.json({ error: "Permission Error" });
//                }
//                else {
//                    PageRenderer.showErrorPage(, page, req, res);
//                }
            }
        }
        next(err);
    });
};

module.exports = checkPagePermissions;

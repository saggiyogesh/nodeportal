var PluginHelper = require("../PluginHelper"),
    ViewHelper = require("../ViewHelper"),
    getProp = require("../AppProperties").get;

//Helper to include methods & libs to page bottom

function BottomIncludes(rendererInstance) {
    Object.defineProperties(this, {
        _rendererInstance: {
            value: rendererInstance
        }
    });
}

BottomIncludes.prototype.render = function (cb) {
    var that = this, req = that._rendererInstance.req, page = that._rendererInstance.page,
        pagePermissionValidator = that._rendererInstance.pagePermissionValidator,
        isSettingsURL = that._rendererInstance.isSettingsPage();

    async.waterfall([
        function (n) {
            that._rendererInstance.isSettingsPage() ? n(null, false) :
                pagePermissionValidator.hasPermission("UPDATE", page.pageId, function (err, perm) {
                    err && err.name == "PermissionError" && (err = null);
                    n(err, perm.isAuthorized);
                });

        },
        function (hasPageUpdatePermission, n) {
            //render page bottom scripts
            var locals = that.constantIncludes();
            locals.page = page;
            locals.req = req;
            locals.user = req.session.user;
            locals.hasPageUpdatePermission = hasPageUpdatePermission;
            locals.isIncludeHandlePlugin = !isSettingsURL;

            ViewHelper.render({
                    path: utils.getViewsPath() + '/shell/app/page_bottom',
                    cache: false},
                locals, n);
        },
        function (pageBottom, n) {
            req.attrs.PageScript.render(function (err, pageScript) {
                n(err, pageBottom + pageScript);
            });
        }
    ], cb);

};

BottomIncludes.prototype.constantIncludes = function () {
    return {
        getUserProfilePicURL: utils.getUserProfilePicURL,
        getDefaultProfilePicURL: utils.getDefaultProfilePicURL,
        getPluginIdAndIId: PluginHelper.getPluginIdAndIId,
        props: {
            appURL: getProp("APP_URL")
        }
    };
};

module.exports = BottomIncludes;
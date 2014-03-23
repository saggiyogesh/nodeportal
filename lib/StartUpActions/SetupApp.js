/**
 * Startup action to configure app object an set app routes
 */

var express = require('express'),
    staticUtil = require("../static/Util"),
    DBActions = require("../DBActions").DBActions,
    FileUtil = require("../file/FileUtil");

module.exports = function (app, done) {

    return function (next) {

        app.configure(function () {
            //app.use(express.logger());
            app.use(express.favicon());
            app.use(express.bodyParser());
            app.use(express.cookieParser());
            app.use(express.session({secret: "90ndsj9dfdsf"}));
            app.set('view engine', 'jade');
            app.set('view options', {
                layout: false
            });

            var libPath = utils.getLibPath() + "/";
            var libs = {
                Messages: require(libPath + "Helpers").Messages,
                getMsg: require(libPath + "i18n").get,
                viewLib: require(libPath + "viewLibs/lib.js"),
                URLCreator: require(libPath + "URLCreator")
            };

            app.set('libs', libs);

            staticUtil.setStaticFolder(app, utils.realPath(utils.getRootPath(), "public"));
            app.use(require(libPath + "middleware")());
            app.use(app.router);
            app.use(express.errorHandler({
                dumpExceptions: true,
                showStack: true
            }));

            //set app routes
            require(libPath + 'AppRoutes')(app);

            //set default user to app
            var dbActions = new DBActions(app.set('db'), {modelName: "User"});
            dbActions.get("getDefaultUser", function (err, user) {
                Debug._l(user)
                if (!err)
                    app.set("Guest", user);
                else
                    done = null;
                next(err, done);
            });
        });

        app.error(function (err, req, res, next) {
            next(err);
        });


    }
};

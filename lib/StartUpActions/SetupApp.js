/**
 * Startup action to configure app object an set app routes
 */

var morgan = require('morgan'),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser')   ,
    multer = require('multer'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    timeout = require('connect-timeout'),
    staticUtil = require("../static/Util"),
    FileUtil = require("../file/FileUtil"),
    getProp = require("../AppProperties").get,
    passport = require("passport"),
    flash = require('connect-flash'),
    ClusterStore = require('strong-cluster-connect-store')(session);

module.exports = function (app, done) {

    var libPath = utils.getLibPath() + "/";
    var libs = {
        Messages: require(libPath + "Helpers").Messages,
        getMsg: require(libPath + "i18n").get,
        viewLib: require(libPath + "viewLibs/lib.js"),
        URLCreator: require(libPath + "URLCreator")
    };

    app.set('libs', libs);

    return function (next) {
        app.use(morgan('combined'));
        app.use(favicon(utils.cwd() + '/public/favicon.ico'));
//        app.use(timeout('5s'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(multer());
        app.use(cookieParser());
        app.use(session({ store: new ClusterStore(), secret: 'keyboard cat' }));
        app.use(flash());
        app.use(passport.initialize());

        staticUtil.setStaticFolder(app, utils.realPath(utils.getRootPath(), "public"));
        app.use(require(libPath + "middleware/Domains")(app));
        app.use(require(libPath + "middleware/Shutdown")(app));
        app.use(require(libPath + "middleware")());
        //set app routes
        require(libPath + 'AppRoutes')(app);

        next(null, done);
    }
};

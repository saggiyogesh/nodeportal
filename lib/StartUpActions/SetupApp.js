/**
 * Startup action to configure app object an set app routes
 */

var express = require('express'),
    morgan = require('morgan'),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser')   ,
    multer = require('multer'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    timeout = require('connect-timeout'),
    staticUtil = require("../static/Util"),
    DBActions = require("../DBActions"),
    FileUtil = require("../file/FileUtil"),
    getProp = require("../AppProperties").get,
    passport = require("passport"),
    flash = require('connect-flash');

module.exports = function (app, done) {

    return function (next) {
        app.use(morgan('combined'));
        app.use(favicon(utils.cwd() + '/public/favicon.ico'));
//        app.use(timeout('5s'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(multer());
        app.use(cookieParser());
        app.use(session({
            secret: "90ndsj9dfdsf",
            resave: true,
            saveUninitialized: true
        }));
        app.use(flash());
        app.use(passport.initialize());

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

        //set app routes
        require(libPath + 'AppRoutes')(app);

        next(null, done);
    }
};

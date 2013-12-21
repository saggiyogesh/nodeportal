/**
 * Module dependencies.
 */


var express = require('express'),
    util = require("util");
var app = module.exports = express.createServer();
/*var libPath = "./lib/";
 var libs = {
 Messages: require(libPath + "Helpers").Messages,
 getMsg: require(libPath + "i18n").get,
 viewLib: require(libPath + "viewLibs/lib.js"),
 URLCreator: require(libPath + "URLCreator")
 };*/
global.util = util;
global.utils = require("./lib/utils");
global.async = require("async");
//add Debug object to global
global.Debug = global.utils.Debug;
global._ = require("underscore");

require("./lib/BootstrapApp")(app);

//var getProp = require("./lib/AppProperties").get,
//    staticUtil = require("./lib/static/Util");

/*app.configure(function () {
 //app.use(express.logger());
 app.use(express.favicon());
 app.use(express.bodyParser());
 app.use(express.cookieParser());
 app.use(express.session({secret: "90ndsj9dfdsf"}));
 //    app.use(app.router);
 app.set('view engine', 'jade');
 app.set('view options', {
 layout: false
 });
 app.set('appPath', process.cwd());
 app.set('views', app.set('appPath') + '/views');
 app.set('libs', libs);

 staticUtil.setStaticFolder(app, __dirname + '/public');
 app.use(require("./lib/middleware")());
 app.use(app.router);
 app.use(express.errorHandler({
 dumpExceptions: true,
 showStack: true
 }));

 });*/

/*app.error(function (err, req, res, next) {
 next(err);
 });*/

/*
 app.configure('development', function () {
 staticUtil.setStaticFolder(app, __dirname + '/public');
 app.use(require("./lib/middleware")());
 app.use(app.router);
 app.use(express.errorHandler({
 dumpExceptions: true,
 showStack: true
 }));

 });

 app.configure('production', function () {
 staticUtil.setStaticFolder(app, __dirname + '/public');
 app.use(require("./lib/middleware")());
 app.use(app.router);
 app.use(express.errorHandler({
 dumpExceptions: true,
 showStack: true
 }));
 });
 */
//require(libPath + 'plugins').init(app);
//require(libPath + 'AppRoutes')(app);


process.on('uncaughtException', function (err) {
    setTimeout(function () {
        Debug._li("uncaughtException: ", err, true);
        var stack = err.stack;
        Debug._l(err.stack || err);
        if (stack.indexOf("/plugins/") > -1) {
            var str = "/plugins/", idx = stack.indexOf(str), arr = stack.split(str), arr1 = arr[1];
            var pluginId = arr1.substring(0, arr1.indexOf("/"));
            Debug._l(pluginId);
        } else {
            setTimeout(function () {
                require("./lib/Mailer").Transport.close();
                process.exit(1);
            }, 500);
        }
    }, 200)

});



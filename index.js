/**
 * Module dependencies.
 */

var express = require('express');
var util = require("util");
var app = module.exports = express.createServer();
var libPath = "./lib/";
var libs = {
    Messages:require(libPath + "Helpers").Messages,
    getMsg:require(libPath + "i18n").get,
    viewLib:require(libPath + "viewLibs/lib.js"),
    URLCreator:require(libPath + "URLCreator")
};
global.util = util;
global.utils = require("./lib/utils");
//add Debug object to global
global.Debug = global.utils.Debug;
global._ = require("underscore");

var assetManager = require('connect-assetmanager'), manager = require("./lib/AssetManager").AssetManager();

app.configure(function () {
    //app.use(express.logger());
    app.use(express.favicon());
//    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({secret:"90ndsj9dfdsf"}));
    app.use(require("./lib/middleware")());
//    app.use(app.router);
    app.set('view engine', 'jade');
    app.set('view options', {
        layout:false
    });
    app.set('appPath', process.cwd());
    app.set('views', app.set('appPath') + '/views');
    app.set('libs', libs);
});

app.error(function (err, req, res, next) {
    next(err);
});

app.configure('development', function () {
    app.use(assetManager(manager.assetManagerGroups));
    app.use(require("./lib/ServeClientFiles/Middleware")({ maxAge: 1000 }));
    app.use(express.static(__dirname + '/public', { maxAge: 1000 }));
    app.use(app.router);
    app.use(express.errorHandler({
        dumpExceptions:true,
        showStack:true
    }));

});

app.configure('production', function () {
    app.use(assetManager(manager.assetManagerGroupsProd));
    app.use(require("./lib/ServeClientFiles/Middleware")({ maxAge: 1000 }));
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
    app.use(express.errorHandler({
        dumpExceptions:true,
        showStack:true
    }));
});

require(libPath + 'plugins').init(app);
//require(libPath + 'ServiceHandler')(app);
require(libPath + 'AppRoutes')(app);



process.on('uncaughtException', function(err) {
    var stack = err.stack;
    Debug._l(err.stack || err);
    if(stack.indexOf("/plugins/") > -1){
        var str = "/plugins/", idx = stack.indexOf(str), arr = stack.split(str), arr1 = arr[1];
        var pluginId = arr1.substring(0, arr1.indexOf("/"));
        Debug._l(pluginId);
    }else{
        process.exit(1);
    }
});



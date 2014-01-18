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



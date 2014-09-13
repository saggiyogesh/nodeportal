/**
 * Module dependencies.
 */
var express = require('express');
var app = module.exports = express();

require("./lib/BootstrapApp")(app);

process.on('uncaughtException', function (err) {
    setTimeout(function () {
        Debug._li("uncaughtException: ", err, true);
        var stack = err.stack || err;
        Debug._l(stack);
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



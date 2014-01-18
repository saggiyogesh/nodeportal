/**
 * Main Controller of app captures each and every request
 */
var fs = require("fs");

module.exports = function (app) {
    var config, controllerPath = utils.getRootPath() + '/controllers';

    require(controllerPath + "/shell/PageController")(app);
//    fs.readFile(controllerPath + "/controller_config.json", "utf8", function (err, data) {
//        if (err) {
//            throw err;
//        }
//        config = JSON.parse(data);
//        config.forEach(function (c) {
//            require(controllerPath + "/" + c.type + "/" + c.controller)(app);
//        });
//    });


};
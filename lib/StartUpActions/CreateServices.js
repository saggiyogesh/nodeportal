/**
 * Startup action to create services file in services folder if not exists
 */

var Generator = require("../ServicesHelper/generator"),
    FileUtil = require("../file/FileUtil");
module.exports = function (app, done) {
    return function (next) {
        var servicesPath = utils.getServicesPath(),
            modelConfPath = servicesPath + "/modelConf";

        var modelFileNames = FileUtil.readDir(modelConfPath);
        console.log(modelFileNames)
        async.eachSeries(modelFileNames, function (fileName, n) {
            if (utils.contains(fileName, "np-model-")) {
                var path = modelConfPath + "/" + fileName;
                Debug._l(path);
                Generator(path, servicesPath, n);
            } else {
                n();
            }
        }, next);
    };
};
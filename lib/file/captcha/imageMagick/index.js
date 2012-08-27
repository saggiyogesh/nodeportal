var im = require("../../../ImageMagick"),
    exec = require('child_process').exec;

module.exports = function (options, next) {
    options.resize = options.resize || 50;
    if (!options.outFile) {
        return next(new Error("Missing options outFile"));
    }
    var cmd = "bash ./captcha -r " + options.resize + " " + options.outFile;
    im(cmd, {cwd:__dirname}, function (error, stdout, stderr) {
//        Debug._l(stderr);
        next(error, {text:stdout.trim(), outFile:options.outFile});
    });
};

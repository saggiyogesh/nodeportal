var easyImage = require("easyimage"),
    im = require("../../ImageMagick"),
    imCaptcha = require("../captcha/imageMagick");

function validate(options) {
    if (!options.width) {
        throw new Error("Parameter width is missing");
    }
    if (!options.height) {
        throw new Error("Parameter height is missing");
    }
    if (!options.src) {
        throw new Error("Parameter src is missing");
    }
    if (!options.dest) {
        throw new Error("Parameter dest is missing");
    }
}
exports.thumbnail = function (options, next) {
    try {
        validate(options);
        var dim = options.width + "x" + options.height,
            cmd = "convert -thumbnail " + dim + " -background " + options.background +
                " -gravity center -extent " + dim + " " + options.src + " " + options.dest;

        //Debug._l(cmd);
        im(cmd, null, function (err, stdout, stderr) {
            next(err, stdout);
        });
    } catch (e) {
        next(e);
    }
};
exports.resize = function (options, next) {
    try {
        validate(options);
        var dim = options.width + "x" + options.height,
            cmd = "convert " + options.src + " -resize " + dim + " " + options.dest;

        //Debug._l(cmd);
        im(cmd, null, function (err, stdout, stderr) {
            next(err, stdout);
        });
    } catch (e) {
        next(e);
    }
};

exports.imageInfo = function (options, next) {
    easyImage.info(options.path, function (err, stdout, stderr) {
        next(err, stdout);
    });
};

exports.captcha = function (outFile, next) {
    imCaptcha({outFile:outFile}, next);
};

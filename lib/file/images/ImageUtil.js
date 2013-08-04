var AppProperties = require("../../AppProperties"),
    getProp = AppProperties.get,
    ImageMagickUtil = require("./ImageMagickUtil");
var IM = "imagemagick";

/**
 * Generic resize function
 *
 * options has following keys: src, dest, width, height.
 * @param options
 * @param next
 */
exports.resize = function (options, next) {
    var ImageHandler = getProp("IMAGE_HANDLER");
    options.dest = options.dest || utils.generateTmpRandomPath();
    if (ImageHandler === IM) {
        ImageMagickUtil.resize(options, next);
    }
};

exports.thumbnail = function (options, next) {
    var ImageHandler = getProp("IMAGE_HANDLER");
    options.dest = options.dest || utils.generateTmpRandomPath();
    options.background = getProp("THUMB_BACKGROUND");
    if (ImageHandler === IM) {
        ImageMagickUtil.thumbnail(options, next);
    }
};

exports.imageInfo = function (options, next) {
    var ImageHandler = getProp("IMAGE_HANDLER");
    if (ImageHandler === IM) {
        ImageMagickUtil.imageInfo(options, next);
    }
};

exports.captcha = function (next) {
    var outFile = utils.generateTmpRandomPath();
    var ImageHandler = getProp("IMAGE_HANDLER");
    if (ImageHandler === IM) {
        ImageMagickUtil.captcha(outFile, next);
    }
};
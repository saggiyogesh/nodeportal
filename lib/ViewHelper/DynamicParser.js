var Parser = require('jade').Parser,
    FileUtil = require("../file/FileUtil");

var MIXINS_PATH, APP_MIXINS = "appMixins";

/**
 * Extends jade's Parser to include appMixins dynamically
 * @constructor
 */
function DynamicParser(str, filename, options) {
    Parser.call(this, str, filename, options);
}


util.inherits(DynamicParser, Parser);

DynamicParser.prototype.resolvePath = function (path, purpose) {
    if (path === APP_MIXINS) {
        MIXINS_PATH = MIXINS_PATH || FileUtil.realPath(utils.getLibPath(), "ViewHelper", "mixins", "index.jade");
        return MIXINS_PATH;

    } else {
        return Parser.prototype.resolvePath.call(this, path, purpose);
    }
};

module.exports = DynamicParser;

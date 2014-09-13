var FileUtil = require("../file/FileUtil");

/**
 * Returns a function which should be called by passing article and req as arguments
 */

module.exports = function (locals, next) {
    var tmplPath = FileUtil.realPath(process.cwd(), "lib", "articles", "default-view.jade");
    FileUtil.renderJadeTemplate(tmplPath, locals, next);
};
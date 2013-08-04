var FileUtil = require("../file/FileUtil");

/**
 * Returns a function which should be called by passing article and req as arguments
 */

module.exports = function (app, options) {
    var tmplPath = FileUtil.realPath(process.cwd(), "lib", "articles", "default-view.jade");
    return  FileUtil.parseJadeTemplate(app, tmplPath, options);
};
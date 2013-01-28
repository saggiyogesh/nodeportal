var str, jade = require("jade"), fs = require("fs");

/**
 * Returns a function which should be called by passing article and req as arguments
 */

//TODO do this view lib and read file using FileUtil
module.exports = function () {
    var tmplPath = process.cwd() + "/lib/articles/default-view.jade";
    str = str || require('fs').readFileSync(tmplPath, 'utf8');
    return jade.compile(str, {  pretty:true });
};
/**
 * used to serve plugin client scripts only
 */

var fs = require("fs"), getCache = require("./Cache").get;
module.exports = function (options) {
    return function (req, res, next) {
        if (req.url.indexOf("static") > -1) {
            var app = req.app, url = req.url, pluginHome = app.set('appPath') + "/plugins/",
                fileName = url.substr(url.lastIndexOf("/")+1, url.length),
                pluginId = fileName.split('.')[0],
                filePath = pluginHome + "/" + pluginId + "/" + fileName;
            var mimeType;
            if (fileName.indexOf('.js') > -1) {
                mimeType = 'application/javascript';
            }
            /*else if (fileName.indexOf('.css') > -1) {
             mimeType = 'text/css';
             }*/

            var response = getCache(pluginId), maxAge = options.maxAge || 0;
            if(!response){
                next();
                return;
            }
            var headers = {
                'Content-Type':mimeType + "; charset=UTF-8",
                'Content-Length':response.content.length,
                'Last-Modified':response.modified.toUTCString(),
                'Date':new Date().toUTCString(),
                'Cache-Control':'public,max-age=' + (maxAge / 1000),
                'Vary':'Accept-Encoding'
            };
            res.writeHead(200, headers);
            res.end(response.content);
        }
        else
            next();
    }
}
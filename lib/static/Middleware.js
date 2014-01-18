/**
 * used to serve plugin client scripts only
 */

var FileUtil = require("../file/FileUtil"), getCache = require("./Cache").get, mime = require("mime");
module.exports = function (options) {
    return function (req, res, next) {
        if (utils.contains(req.url, "static")) {
            var app = req.app, query = req.query,
                url = req.url, pluginHome = utils.getPluginsPath(),
                views = utils.getViewsPath(),
                path = query.path,
                type = query.type;
            var mimeType, response
            var imageExtensions = ["png", "jpg", "jpeg", "gif", "bmp"];

            if (!path) {
                return next();
            }
            if (utils.contains(path, '.js')) {
                mimeType = 'application/javascript';
                response = getCache(path);
            }
            else if (utils.contains(path, '.css')) {
                mimeType = 'text/css';
                response = getCache(path);
            }
            else if (utils.containsArray(imageExtensions, path.split(".")[1].toLowerCase()) && type === "theme") {
                mimeType = mime.lookup(path);
                var themeHomePath = utils.getThemesDirPath(),
                    filePath = themeHomePath + path,
                    stat = FileUtil.stat(filePath);

                Debug._li("stat, ", stat, true)
//                FileUtil.readFile(filePath, null, function(err, data){
//
//
//                });
                response = {
                    content: FileUtil.readFile(filePath),
                    modified: stat.mtime
                }
            }


//            if(type === "theme"){
//                var arr = path.split("/"), themeName= arr[0];
//
//            }
            if (!response) {
                next();
                return;
            }

            writeResponse(res, response, options.maxAge || 0, mimeType);
        }
        else
            next();
    }
};

function writeResponse(res, response, maxAge, mimeType) {
    var headers = {
        'Content-Type': mimeType + "; charset=UTF-8",
        'Content-Length': response.content.length,
        'Last-Modified': response.modified.toUTCString(),
        'Date': new Date().toUTCString(),
        'Cache-Control': 'public,max-age=' + (maxAge / 1000),
        'Vary': 'Accept-Encoding'
    };
    res.writeHead(200, headers);
    res.end(response.content);
}
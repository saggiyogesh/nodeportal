/**
 * Middleware used to enrich req and session
 */
var path = require('path');

module.exports = function () {
    return function (req, res, next) {
//        if (!req.attrs) {
//            req.attrs = {};
//        }

        req.attrs = {};
//        Debug._l("req.attrs: " + req.attrs);
//        Debug._li("req.seess: " , req.session, true);
        if (!req.session.loggedIn)
            req.session.loggedIn = false;
        if (!req.session.roles) {
            req.session.roles = ["Guest"];
            req.session.user = req.app.set("Guest");
        }

        //middleware for serving resources
        if(req.url.indexOf("serve_resource") > -1){

        }

        //middleware for saving ajax upload files in /tmp location, adding uploaded file info in req.files obj
        if (req.query && req.query.type && req.query.type == "ajaxUpload" && req.xhr) {
            req.files = req.files || {};
            var fName = req.header('x-file-name')
                , fSize = req.header('x-file-size')
                , fType = req.header('x-file-type')
                , encodedPath = utils.generateTmpRandomPath()
                , ws = require("fs").createWriteStream(encodedPath),
                ext = path.extname(fName);

            req.on('data', function (data) {
                ws.write(data);
            });
            req.on('end', function () {
                req.files["ajaxUpload"] = {
                    size:"",
                    path:encodedPath,
                    name:decodeURI(fName),
                    type:ext,
                    lastModifiedDate:""
                };
                next();
            });
        }
        else {
            next();
        }
    }
};


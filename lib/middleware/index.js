/**
 * Middleware used to enrich req and session
 */
var path = require('path'), ResponseHelper = require("../ResponseHelper"),
    Roles = require('../permissions/Roles'),
    PageScript = require("../PageScript");

module.exports = function () {
    return function (req, res, next) {
        Object.defineProperties(req, {
            attrs: {
                value: {}
            }
        });

        Object.defineProperties(req.attrs, {
            PageScript: {
                value: new PageScript(req),
                enumerable: true
            }
        });

        Debug._l("middle: " + req.url);
//        Debug._li("req.seess: " , req.session, true);
        if (!req.session.loggedIn)
            req.session.loggedIn = false;
        if (!req.session.roles) {
            req.session.roles = [Roles.getGuestRole().roleId];
            req.session.user = req.app.set("Guest");
        }


        //middleware for handling response of ajax file uploader
        if (req.files && Object.keys(req.files).length > 0 && req.xhr) {
            //By ajax uploader only one file will be uploaded in each request
            var file = req.files[Object.keys(req.files)[0]];

            //settings file uploaded in req.attrs
            Object.defineProperties(req.attrs, {
                file: {
                    value: file,
                    enumerable: true
                }
            });

            ResponseHelper.setSend(req, JSON.stringify({
                files: [
                    {
                        size: file.size,
                        name: file.originalname,
                        type: file.mimetype
                    }
                ]
            }));
        }

        next();
    }
};


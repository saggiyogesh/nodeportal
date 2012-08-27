/***
 * Manages resources image and docs
 */
var RESOURCES_PATH = "/resources", RESOURCE_SCHEMA = "Resource";
var BasePluginController = require(process.cwd() + "/lib/BasePluginController");
var ResourceManageUtil = require("./ResourceManageUtil"),
    fs = require("fs"),
    ImageUtil = require(process.cwd() + "/lib/file/images/ImageUtil");

var ResourceManageController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route:'/getResources/:folderId?', action:getResourcesByFolderId
        });
        that.get({
            route:'/thumb/:id?', action:function (req, res, next) {
                req.params.action = "thumb";
                viewResourcesAction.apply(this, arguments);
            }
        });
        that.get({
            route:'/detail/:id?', action:function (req, res, next) {
                var dims = this.getAppProperty("IMAGE_DETAIL_DIMENSION").split("*");
                //Debug._l(dims);
                req.params.action = "detail";
                req.params.w = dims[0];
                req.params.h = dims[1];
                viewResourcesAction.apply(this, arguments);
            }
        });
        that.get({
            route:'/view/:id?/:w(\\d+)/:h(\\d+)', action:viewResourcesAction, isAppRoute:true
        });
        that.get({
            route:'/view/:id?', action:viewResourcesAction, isAppRoute:true
        });
        that.get({
            route:'/view/:name?/:folderId?', action:viewResourcesAction, isAppRoute:true
        });
        that.get({
            route:'/addFolder/:name?/:parentFolderId?', action:addFolderAction
        });
        that.get({
            route:'/rename/:newName?/:resourceId?/:parentFolderId?', action:renameAction
        });
        that.get({
            route:'/delete/:resourceId?/:type?', action:deleteAction
        });
        that.post({
            route:'/uploadResource',
            action:uploadResourceAction
        });
    });
};

util.inherits(ResourceManageController, BasePluginController);

function remove(that, resourceId, req, res, next) {
    var DBActions = that.getDBActionsLib(),
        resourceFolderPath = process.cwd() + that.getAppProperty("DATA_FOLDER_PATH") + RESOURCES_PATH;

    DBActions.getInstance(req, RESOURCE_SCHEMA).authorizedRemove(resourceId, function (err, result) {
        if (err) {
            that.setJSON(req, {error:err.message});
            next(null, req, res);
            return;
        }

        that.setJSON(req, {success:true, resourceId:resourceId});
        next(null, req, res);

        process.nextTick(function () {
            var dirPath = resourceFolderPath + "/" + resourceId + "/";
            fs.readdir(dirPath, function (err, files) {
                var AsyncIterator = that.AsyncIterator;
                var asycI = new AsyncIterator(files, function (err, result) {
                    if (err) {
                        Debug._l(err);
                    }
                    if (result) {
                        fs.rmdir(dirPath, function (err) {
                            if (err) {
                                Debug._l(err);
                            }
                        });
                    }
                });

                var asyncProcess = function () {
                    var that = this, i = that.i, files = that.vals;
                    var file = files[i];
                    //Debug._l(file);
                    fs.unlink(dirPath + file, function (err) {
                        if (err) {
                            asycI.next(err);
                            return;
                        }
                        asycI.iterate();
                    });
                };
                asycI.setAsyncProcess(asyncProcess);
            });
        });
    });
}

function deleteAction(req, res, next) {
    var that = this, DBActions = that.getDBActionsLib(),
        resourceId = req.params.resourceId, type = req.params.type;
    if (resourceId) {
        if (type == "folder") {
            DBActions.getInstance(req, RESOURCE_SCHEMA).get("findByFolderId", resourceId, function (err, models) {
                if (err) {
                    that.setJSON(req, {error:err.message});
                    next(null, req, res);
                    return;
                }

                if (models.length > 0) {
                    that.setJSON(req, {error:"Folder not empty."});
                    next(null, req, res);
                    return;
                }
                remove(that, resourceId, req, res, next);
            });
        }
        else {
            remove(that, resourceId, req, res, next);
        }
    }
}

function renameAction(req, res, next) {
    var that = this, DBActions = that.getDBActionsLib(),
        newName = req.params.newName, resourceId = req.params.resourceId, parentFolderId = req.params.parentFolderId;
    if (newName && resourceId && parentFolderId) {

        var dbAction = DBActions.getInstance(req, RESOURCE_SCHEMA);

        dbAction.get("findByResourceId", resourceId, function (err, model) {
            if (err) {
                that.setJSON(req, {error:err.message});
                next(null, req, res);
                return;
            }

            var query = dbAction.getQuery()
                .where('name', newName).where("folderId", parentFolderId).where('resourceId').ne(resourceId);

            dbAction.getByQuery(query, function (err, models) {
                if (err) {
                    that.setJSON(req, {error:err.message});
                    next(null, req, res);
                    return;
                }

                if (models && models.length < 1) {
                    var param = {
                        resourceId:model.resourceId,
                        name:newName
                    };

                    dbAction.authorizedUpdate(param, function (err, model) {
                        if (err) {
                            that.setJSON(req, {error:err.message});
                            next(null, req, res);
                            return;
                        }

                        that.setJSON(req, {success:true, resourceId:resourceId});
                        next(null, req, res);
                    });
                }
                else {
                    that.setJSON(req, {error:"Duplicate name: " + decodeURI(newName)});
                    next(null, req, res);
                    return;
                }

            });
        });
    } else {
        that.setJSON(req, {error:"Invalid name"});
        next(null, req, res);
    }
}

function addFolderAction(req, res, next) {
    var that = this, DBActions = that.getDBActionsLib(),
        name = req.params.name, parentFolderId = req.params.parentFolderId;
    if (name && parentFolderId) {
        //check existance of folder in parent folder
        var dbAction = DBActions.getInstance(req, RESOURCE_SCHEMA);

        dbAction.get("findByNameAndFolderId", [name, parentFolderId], function (err, model) {
            if (err) {
                next(null, req, res);
                return;
            }

            //already same item exists in the folder
            if (model) {
                that.setJSON(req, {error:"Duplicate name: " + decodeURI(name)});
                next(null, req, res);
                return;
            }

            var model = {
                name:name,
                type:"folder",
                folderId:parentFolderId
            };

            dbAction.authorizedSave(model, function (err, model) {
                if (err) {
                    that.setJSON(req, {error:err.message});
                    next(null, req, res);
                    return;
                }

                that.setJSON(req, {success:true, folderId:parentFolderId});
                next(null, req, res);
            });
        });
    }
    else {
        that.setJSON(req, {error:"Invalid folder name"});
        next(null, req, res);
    }

}

function validateInputDimensions(imageDimension, w, h) {
    if (imageDimension) {
        var dims = imageDimension.split(":");
        if (parseInt(w) <= parseInt(dims[0]) && parseInt(h) <= parseInt(dims[1])) {
            return true;
        }
    }
    return false;
}

function viewResourcesAction(req, res, next) {
    var that = this, DBActions = that.getDBActionsLib(),
        resourceFolderPath = process.cwd() + that.getAppProperty("DATA_FOLDER_PATH") + RESOURCES_PATH,
        params = req.params, query = req.query, resourceId = params.id, name = params.name,
        folderId = params.folderId;
    var dbAction = DBActions.getInstance(req, RESOURCE_SCHEMA);
    //Debug._li("params: ", params, true);
    if (resourceId) {
        function sendFile(path, type, next) {
            var contentType = utils.contains(path, ".") ? path : path + "." + type;
            res.contentType(contentType);
            fs.readFile(path, function (err, data) {
                if (!err) {
                    that.setSend(req, data);
                }
                next(err, req, res);
            });
        }

        function getImage(model, next) {
            var resId = model.resourceId, w = params.w , h = params.h;
            if (ResourceManageUtil.isTypeImage(model.type) && w && h) {
                var fileName = w + ":" + h, extras = model.extras;
                //if image already scaled
                if (extras.hasOwnProperty(fileName) && extras[fileName] === true) {
                    sendFile(dirPath + "/" + fileName, model.type, next);
                    return;
                }

                if (validateInputDimensions(model.dimensions, w, h)) {
                    var destPath = dirPath + "/" + fileName;
                    ImageUtil.resize({
                        src:dirPath + "/" + model.resourceId,
                        dest:destPath,
                        width:w,
                        height:h
                    }, function (err, result) {
                        //Debug._li("resize: ", result, true);
                        //saving scaled image info to db
                        extras[fileName] = true;
                        dbAction.update({resourceId:model.resourceId, extras:extras}, function (err, result) {
                            if (err)
                                Debug._l(err);
                            if (result) {
                                sendFile(destPath, model.type, next);
                                return;
                            }
                        });
                    });
                    return;
                }
                else if (req.params.action === "detail") {
                    var path = resourceFolderPath + "/" + resourceId + "/" + resourceId;
                    sendFile(path, model.type, next);
                    return;
                }
                else {
                    return next(new Error("Invalid image dimensions"), req, res);
                }
            } else {
                var path = resourceFolderPath + "/" + resourceId + "/" + resourceId;
                sendFile(path, model.type, next);
                return;
            }
        }

        var dirPath = resourceFolderPath + "/" + resourceId;

        dbAction.authorizedGet("findByResourceId", [resourceId], function (err, model) {
            if (model) {
                if (params.action === "thumb") {
                    var thumbName = that.getAppProperty("DEFAULT_THUMB_NAME");
                    if (model.extras && model.extras.thumb === true) {
                        sendFile(dirPath + "/" + thumbName, model.type, next);
                    }
                    else {
                        var path = process.cwd() + "/public/images/fileicons/" + model.type.toLowerCase() + ".png";
                        sendFile(path, null, next);
                        createThumb(dirPath, model, that.getAppProperty("THUMB_DIMENSION"), thumbName, dbAction, model.extras);
                    }
                    return;
                }
                getImage(model, next);
            }
            else
                next(err, req, res);
        });
    }
    else {
        if (name && folderId) {
            dbAction.authorizedGet("findByNameAndFolderId", [name, folderId], function (err, model) {
                if (model) {
                    var path = resourceFolderPath + "/" + model.resourceId;
                    res.contentType(path + "." + model.type);
                    that.setSend(req, fs.readFileSync(path));
                }

                next(null, req, res);
            });
        } else {
            next(null, req, res);
        }
    }
}


function getResourcesByFolderId(req, res, next) {
    var that = this, DBActions = that.getDBActionsLib(),
        folderId = req.params.folderId || 0,
        dbAction = DBActions.getInstance(req, RESOURCE_SCHEMA),
        query = dbAction.getQuery().where("folderId", folderId);

    dbAction.authorizedGetByQuery(query, function (err, models) {
        if (err) {
            return next(null, req, res);
        }
        req.attrs.resourceModel = models;
        req.params.action = "getResources";
        next(err, req, res);
    });
}

function uploadResourceAction(req, res, next) {
    var that = this, file = req.files["ajaxUpload"], DBActions = that.getDBActionsLib();
    fs.readFile(file.path, function (err, data) {
        if (err) {
            that.setJSON(req, {error:err.message || "Some error occured."});
            next(null, req, res);
            return;
        }
        var resourceFolderPath = process.cwd() + that.getAppProperty("DATA_FOLDER_PATH") + RESOURCES_PATH,
            db = that.getDB(), folderId = req.query.folderId;

        //save info in db
        //check existance of resource in folder
        var dbAction = DBActions.getInstance(req, RESOURCE_SCHEMA);
        dbAction.get("findByNameAndFolderId", [file.name, folderId], function (err, model) {
            //Debug._li("model: >> ", model, false);
            if (err) {
                next(null, req, res);
                return;
            }

            //already same item exists in the folder
            if (model) {
                that.setJSON(req, {error:"File already exists: " + decodeURI(file.name)});
                next(null, req, res);
                return;
            }

            //save the new item
            var model = {
                name:file.name,
                type:file.type.split(".")[1],
                size:data.length,
                folderId:folderId
            };
            dbAction.authorizedSave(model, function (err, model) {
                if (err) {
                    that.setJSON(req, {error:err.message});
                    next(null, req, res);
                    return;
                }

                //save to resources folder only after it is persisted in DB

                var dirPath = resourceFolderPath + "/" + model.resourceId;
                fs.mkdir(dirPath, function (err) {
                    var ret = {};
                    if (err) {
                        ret.error = err.message;
                        that.setJSON(req, ret);
                        next(err, req, res);
                        return;
                    }
                    var filePath = dirPath + "/" + model.resourceId;
                    fs.writeFile(filePath, data, function (err) {
                        if (!err) {
                            ret = {success:true, folderId:folderId};
                            //createThumb(dirPath, model, that.getAppProperty("THUMB_DIMENSION"),
                            //  that.getAppProperty("DEFAULT_THUMB_NAME"), dbAction);
                            updateDimension(dirPath, model, dbAction);
                        }
                        if (err) ret.error = err.message;
                        that.setJSON(req, ret);
                        next(err, req, res);
                    });
                });
            });
        });
    });
}

function updateDimension(dirPath, model, dbAction) {
    if (ResourceManageUtil.isTypeImage(model.type)) {
        ImageUtil.imageInfo({path:dirPath + "/" + model.resourceId}, function (err, info) {
            dbAction.update({resourceId:model.resourceId, dimensions:info.width + ":" + info.height}, function (err, result) {
                if (err)
                    Debug._l(err);
            });
        });
    }
}

function createThumb(dirPath, model, dimesion, thumbName, dbAction, extras) {
    if (ResourceManageUtil.isTypeImage(model.type)) {
        process.nextTick(function () {
            extras = extras || {};
            var dims = dimesion.split("*");
            ImageUtil.thumbnail({
                src:dirPath + "/" + model.resourceId,
                dest:dirPath + "/" + thumbName,
                width:dims[0],
                height:dims[1]
            }, function (err, result) {
                //Debug._li("thumb: ", result, true);
                extras.thumb = true;
                dbAction.update({resourceId:model.resourceId, extras:extras}, function (err, result) {
                    if (err)
                        Debug._l(err);
                });
            });

        });
    }
}

/*function createDetail(dirPath, that, dbAction, extras) {
 if (ResourceManageUtil.isTypeImage(model.type)) {
 process.nextTick(function () {
 extras = extras || {};

 });
 }
 }*/

ResourceManageController.prototype.render = function (req, res, next) {
    var view = req.params.action;
    view = view || "index";
    var ret = {
        ResourceManageUtil:ResourceManageUtil
    };
    next(null, [ view, ret ]);
};


/***
 * Manages resources image and docs
 */
var RESOURCES_PATH = "resources", RESOURCE_SCHEMA = "Resource",
    RESOURCE_PERMISSION_SCHEMA_ENTRY = "model.resourceSchema.Resource",
    RESOURCE_PERMISSION_SCHEMA = "model.resourceSchema";
var BasePluginController = require(process.cwd() + "/lib/BasePluginController");
var ResourceManageUtil = require("./ResourceManageUtil"),
    ImageUtil = require(process.cwd() + "/lib/file/images/ImageUtil"),
    async = require("async");

var ResourceManageController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.get({
            route: '/getResources/:folderId?', action: getResourcesByFolderId
        });
        that.get({
            route: '/thumb/:id?', action: function (req, res, next) {
                req.params.action = "thumb";
                viewResourcesAction.apply(this, arguments);
            }
        });
        that.get({
            route: '/detail/:id?', action: function (req, res, next) {
                var dims = this.getAppProperty("IMAGE_DETAIL_DIMENSION").split("*");
                //Debug._l(dims);
                req.params.action = "detail";
                req.params.w = dims[0];
                req.params.h = dims[1];
                viewResourcesAction.apply(this, arguments);
            }
        });
        that.get({
            route: '/view/:id?/:w(\\d+)/:h(\\d+)', action: viewResourcesAction, isAppRoute: true
        });
        that.get({
            route: '/view/:id?', action: viewResourcesAction, isAppRoute: true
        });
        that.get({
            route: '/view/:name?/:folderId?', action: viewResourcesAction, isAppRoute: true
        });
        that.get({
            route: '/addFolder/:name?/:parentFolderId?', action: addFolderAction
        });
        that.get({
            route: '/rename/:newName?/:resourceId?/:parentFolderId?', action: renameAction
        });
        that.get({
            route: '/delete/:resourceId?/:type?', action: deleteAction
        });
        that.post({
            route: '/uploadResource',
            action: uploadResourceAction
        });
    });
};

util.inherits(ResourceManageController, BasePluginController);

function remove(that, resourceId, isFile, req, res, next) {
    var FileUtil = that.FileUtil,
        realPath = FileUtil.realPath,
        resourceFolderPath = realPath(process.cwd(), that.getAppProperty("DATA_FOLDER_PATH"), RESOURCES_PATH);

    var ResourceServiceAuth = that.getService(RESOURCE_SCHEMA).Auth,
        pv = new that.PermissionValidator(req, RESOURCE_PERMISSION_SCHEMA_ENTRY, RESOURCE_SCHEMA);

    ResourceServiceAuth.deleteById(resourceId, pv, function (err, result) {
        if (err) {
            that.setJSON(req, {error: err.message});
            next(null);
            return;
        }

        that.setJSON(req, {success: true, resourceId: resourceId});
        next(null);
        if (isFile) {
            utils.tick(function () {
                var dirPath = realPath(resourceFolderPath, resourceId);
                FileUtil.readDir(dirPath, function (err, files) {
                    async.eachSeries(files, function (file, next) {
                        FileUtil.removeFile(realPath(dirPath, file), next);
                    }, function (err) {
                        if (err) {
                            Debug._l(err);
                        } else {
                            FileUtil.removeDir(dirPath, function (err) {
                                if (err) {
                                    Debug._l(err);
                                }
                            });
                        }

                    });
                });
            });
        }
    });
}

function deleteAction(req, res, next) {
    var that = this,
        FileUtil = that.FileUtil,
        resourceId = req.params.resourceId, type = req.params.type;
    if (resourceId) {
        if (type == "folder") {
            that.getService(RESOURCE_SCHEMA).getByFolderId(resourceId, function (err, models) {
                if (err) {
                    that.setJSON(req, {error: err.message});
                    next(null);
                    return;
                }

                if (models.length > 0) {
                    that.setJSON(req, {error: "Folder not empty."});
                    next(null);
                    return;
                }
                remove(that, resourceId, false, req, res, next);
            });
        }
        else {
            remove(that, resourceId, true, req, res, next);
        }
    }
}

function renameAction(req, res, next) {
    var that = this,
        FileUtil = that.FileUtil,
        realPath = FileUtil.realPath,
        newName = req.params.newName, resourceId = req.params.resourceId, parentFolderId = req.params.parentFolderId;
    if (newName && resourceId && parentFolderId) {

        var ResourceService = that.getService(RESOURCE_SCHEMA),
            ResourceServiceAuth = ResourceService.Auth,
            pv = new that.PermissionValidator(req, RESOURCE_PERMISSION_SCHEMA_ENTRY, RESOURCE_SCHEMA);

        ResourceService.findById(resourceId, function (err, model) {
            if (err) {
                that.setJSON(req, {error: err.message});
                next(null);
                return;
            }

            var query = {
                where: {
                    name: newName,
                    folderId: parentFolderId,
                    resourceId: { neq: resourceId}
                }
            };

            ResourceService.find(query, function (err, models) {
                if (err) {
                    that.setJSON(req, {error: err.message});
                    next(null);
                    return;
                }

                if (models && models.length < 1) {
                    var data = {
                        name: newName
                    };

                    ResourceServiceAuth.updateById(model.resourceId, data, pv, function (err, model) {
                        if (err) {
                            that.setJSON(req, {error: err.message});
                            next(null);
                            return;
                        }

                        that.setJSON(req, {success: true, resourceId: resourceId});
                        next(null);
                    });
                }
                else {
                    that.setJSON(req, {error: "Duplicate name: " + decodeURI(newName)});
                    next(null);
                    return;
                }

            });
        });
    } else {
        that.setJSON(req, {error: "Invalid name"});
        next(null);
    }
}

function addFolderAction(req, res, next) {
    var that = this, FileUtil = that.FileUtil,
        name = req.params.name, parentFolderId = req.params.parentFolderId;
    if (name && parentFolderId) {
        //check existence of folder in parent folder
        var ResourceServiceAuth = that.getService(RESOURCE_SCHEMA).Auth,
            pv = new that.PermissionValidator(req, RESOURCE_PERMISSION_SCHEMA_ENTRY, RESOURCE_SCHEMA);

        ResourceServiceAuth.getByNameAndFolderId(name, parentFolderId, function (err, model) {
            if (err) {
                next(null);
                return;
            }

            //already same item exists in the folder
            if (model) {
                that.setJSON(req, {error: "Duplicate name: " + decodeURI(name)});
                next(null);
                return;
            }

            var model = {
                name: name,
                type: "folder",
                folderId: parentFolderId,
                rolePermissions: RESOURCE_PERMISSION_SCHEMA_ENTRY
            };

            ResourceServiceAuth.save(model, pv, function (err, model) {
                if (err) {
                    that.setJSON(req, {error: err.message});
                    next(null);
                    return;
                }

                that.setJSON(req, {success: true, folderId: parentFolderId});
                next(null);
            });
        });
    }
    else {
        that.setJSON(req, {error: "Invalid folder name"});
        next(null);
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
    var that = this, FileUtil = that.FileUtil,
        realPath = FileUtil.realPath,
        resourceFolderPath = realPath(process.cwd(), that.getAppProperty("DATA_FOLDER_PATH"), RESOURCES_PATH),
        params = req.params, query = req.query, resourceId = params.id, name = params.name,
        folderId = params.folderId;

    var ResourceService = that.getService(RESOURCE_SCHEMA), ResourceServiceAuth = ResourceService.Auth,
        pv = new that.PermissionValidator(req, RESOURCE_PERMISSION_SCHEMA_ENTRY, RESOURCE_SCHEMA);

    //Debug._li("params: ", params, true);
    if (resourceId) {
        function sendFile(path, type, next) {
            var contentType = utils.contains(path, ".") ? path : path + "." + type;
            res.contentType(contentType);
            FileUtil.readImage(path, function (err, data) {
                if (!err) {
                    that.setSend(req, data);
                }
                next(err);
            });
        }

        function getImage(model, next) {
            var resId = model.resourceId, w = params.w , h = params.h;
            if (ResourceManageUtil.isTypeImage(model.type) && w && h) {
                var fileName = w + ":" + h, extras = model.extras;
                //if image already scaled
                if (extras.hasOwnProperty(fileName) && extras[fileName] === true) {
                    sendFile(realPath(dirPath, fileName), model.type, next);
                    return;
                }

                if (validateInputDimensions(model.dimensions, w, h)) {
                    var destPath = realPath(dirPath, fileName);
                    ImageUtil.resize({
                        src: realPath(dirPath, model.resourceId),
                        dest: destPath,
                        width: w,
                        height: h
                    }, function (err, result) {
                        //Debug._li("resize: ", result, true);
                        //saving scaled image info to db
                        extras[fileName] = true;
                        ResourceServiceAuth.update(model.resourceId, { extras: extras}, function (err, result) {
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
                    var path = realPath(resourceFolderPath, resourceId, resourceId);
                    sendFile(path, model.type, next);
                    return;
                }
                else {
                    return next(new Error("Invalid image dimensions"));
                }
            } else {
                var path = realPath(resourceFolderPath, resourceId, resourceId);
                sendFile(path, model.type, next);
                return;
            }
        }

        var dirPath = realPath(resourceFolderPath, resourceId);

        ResourceServiceAuth.findById(resourceId, function (err, model) {
            if (model) {
                if (params.action === "thumb") {
                    var thumbName = that.getAppProperty("DEFAULT_THUMB_NAME");
                    if (model.extras && model.extras.thumb === true) {
                        sendFile(realPath(dirPath, thumbName), model.type, next);
                    }
                    else {
                        var path = realPath(process.cwd(), "public", "images", "fileicons", model.type.toLowerCase() + ".png");
                        sendFile(path, null, next);
                        createThumb(dirPath, model, that.getAppProperty("THUMB_DIMENSION"), thumbName, ResourceService, model.extras, FileUtil);
                    }
                    return;
                }
                getImage(model, next);
            }
            else {
                err = new Error("No resource exists");
                that.set404StatusCode(res);
                next(err);
            }
        });
    }
    else {
        if (name && folderId) {
            ResourceServiceAuth.getByNameAndFolderId(name, folderId, function (err, model) {
                if (model) {
                    var path = realPath(resourceFolderPath, model.resourceId);
                    res.contentType(path + "." + model.type);
                    that.setSend(req, FileUtil.readFile(path));
                }

                next(null);
            });
        } else {
            next(null);
        }
    }
}


function getResourcesByFolderId(req, res, next) {
    var that = this, FileUtil = that.FileUtil,
        realPath = FileUtil.realPath,
        folderId = req.params.folderId || 0;

    that.getService(RESOURCE_SCHEMA).getByFolderId(folderId, function (err, models) {
        if (err) {
            return next(null);
        }
        req.attrs.resourceModel = models;
        req.params.action = "getResources";
        next(err);
    });
}

function uploadResourceAction(req, res, next) {
    var that = this, file = req.files["ajaxUpload"],
        FileUtil = that.FileUtil,
        realPath = FileUtil.realPath;

    var resourceFolderPath = realPath(process.cwd(), that.getAppProperty("DATA_FOLDER_PATH"), RESOURCES_PATH);
    var ResourceService = that.getService(RESOURCE_SCHEMA), ResourceServiceAuth = ResourceService.Auth,
        pv = new that.PermissionValidator(req, RESOURCE_PERMISSION_SCHEMA_ENTRY, RESOURCE_SCHEMA);

    var file = req.attrs.file,
        postParams = that.getPluginHelper().getPostParams(req),
        folderId = postParams.folderId,
        fileName = file.originalname, tmpPath = file.path;
    var FILE_EXISTS_ERROR = "FILE EXISTS ERROR";

    async.waterfall([
        function (n) {
            //check existance of resource in folder
            ResourceService.getByNameAndFolderId(fileName, folderId, n);
        },
        function (model, n) {
            if (model) {
                //raise already exists error
                n(new Error(FILE_EXISTS_ERROR + " : " + decodeURI(fileName)));
            }
            else {
                //save the new item
                var model = {
                    name: file.originalname,
                    type: file.mimetype.split("/")[1],
                    size: file.size,
                    folderId: folderId,
                    rolePermissions: RESOURCE_PERMISSION_SCHEMA_ENTRY
                };

                if (model.size == 0) {
                    try {
                        var stat = FileUtil.stat(file.path);
                        model.size = stat.size;
                    } catch (e) {
                        Debug._l(e)
                    }
                }

                ResourceServiceAuth.save(model, n);
            }
        },
        function (done, n) {
            ResourceService.getByNameAndFolderId(fileName, folderId, n);
        },
        function (model, n) {
            if (!model) {
                n(new Error("Model not created."))
            }
            else {
                //save to resources folder only after it is persisted in DB
                var dirPath = realPath(resourceFolderPath, model.resourceId);
                FileUtil.createDir(dirPath, function (err) {
                    n(err, dirPath, model);
                });
            }
        },
        function (dirPath, model, n) {
            var destFilePath = realPath(dirPath, model.resourceId);
            FileUtil.copyFile(file.path, destFilePath, function (err) {
                !err && updateDimension(destFilePath, model, ResourceService);
                n(err);
            });
        }
    ], function (err, result) {
        if (err) {
            that.setError(req, err);
        }
        next(err);
    });
}

function updateDimension(filePath, model, Service) {
    if (ResourceManageUtil.isTypeImage(model.type)) {
        ImageUtil.imageInfo({path: filePath}, function (err, info) {
            Service.update({resourceId: model.resourceId, dimensions: info.width + ":" + info.height}, function (err, result) {
                if (err)
                    Debug._l(err);
            });
        });
    }
}

function createThumb(dirPath, model, dimesion, thumbName, Service, extras, FileUtil) {
    var realPath = FileUtil.realPath;
    if (ResourceManageUtil.isTypeImage(model.type)) {
        process.nextTick(function () {
            extras = extras || {};
            var dims = dimesion.split("*");
            ImageUtil.thumbnail({
                src: realPath(dirPath, model.resourceId),
                dest: realPath(dirPath, thumbName),
                width: dims[0],
                height: dims[1]
            }, function (err, result) {
                //Debug._li("thumb: ", result, true);
                if (err)
                    Debug._l(err);
                extras.thumb = true;
                Service.update({resourceId: model.resourceId, extras: extras}, function (err, result) {
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
    var that = this;
    var ret = {
        ResourceManageUtil: ResourceManageUtil
    };
    var pv = new that.PermissionValidator(req, RESOURCE_PERMISSION_SCHEMA, "");
    pv.hasPermissionWithoutModelId("ADD", function (err, perm) {
        if (!err) {
            ret.hasAdd = perm.isAuthorized;
        }
        req.pluginRender.setView(req.params.action).setLocals(ret);
        next(err instanceof that.PermissionError ? null : err);
    });
};


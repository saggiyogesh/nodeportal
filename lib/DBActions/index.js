var PermissionValidator = require('../permissions/PermissionValidator'),
    PermissionCache = require('../permissions/Cache'),
    PluginHelper = require("../PluginHelper"),
    ModelPath = "../../services/shell/model",
    InvalidModelIdValue = require("./InvalidModelIdValue"),
    _l = Debug._l,
    _li = Debug._li,
    _i = Debug._i;

var getModelEvent = require("../ModelEvents").getModelEvent;

var async = require("async"),
    Auth = require('./auth').Auth;

var mongoose = require('mongoose');
mongoose.set('debug', true);

DBActions.prototype.remove = function (modelIdValue, next) {
    var that = this, modelIdKey = getModelIdKey(that.modelName);
    var conditions = {};
    conditions[modelIdKey] = modelIdValue;
    var currentModel, evtObj = getModelEvent(that.modelName);
    async.series([
        function (n) {
            if (!evtObj) {
                return n(null, true);
            }

            that.getByDefaultFinderMethod(modelIdValue, function (err, model) {
                if (model) {
                    currentModel = model.toObject();
                }
                n(err, model);
            });
        },
        function (n) {
            that.Model.remove(conditions, n);
        }
    ], function (err, result) {
        next(err, result[1]);
        if (!err && result) {
            evtObj && evtObj.onDelete && evtObj.onDelete(modelIdValue, currentModel);
        }
        PermissionCache.remove(that.permissionSchemaKey, modelIdValue);

    });
};

/**
 * Multi save in a collection.
 * @param modelIds {Array} Model ids to be deleted
 * @param next {Function} Callback
 */
DBActions.prototype.multipleRemove = function (modelIds, next) {
    var that = this;
    if (!_.isArray(modelIds)) {
        that.save(modelIds, next);
    }

    async.mapSeries(modelIds, that.remove.bind(that), function (err, results) {
        next(err, results);
    });
};


DBActions.prototype.removeByQuery = function (query, next) {
    query.remove(next);
};


/**
 * update the model by passing the plain model object as param
 *
 * Don't pass mongoose object as param, it will result to stack overflow,
 * instead create plain js object from mongoose object
 */
DBActions.prototype.update = function (param, next) {
    var that = this, Model = that.Model, modelName = that.modelName,
        modelIdKey = getModelIdKey(modelName);
    var modelIdValue = param[modelIdKey];
    if (!modelIdValue) {
        return  next(new Error(modelName + " id is not available in model update"));
    }

    var query = {}, options = { multi: true };
    query[modelIdKey] = modelIdValue;
    var currentModel, evtObj = getModelEvent(that.modelName);
    async.series([
        function (n) {
            if (!evtObj) {
                return n(null, true);
            }

            that.getByDefaultFinderMethod(modelIdValue, function (err, model) {
                if (model) {
                    currentModel = model.toObject();
                }
                n(err, model);
            });
        },
        function (n) {
            Model.update(query, param, options, n);
        }
    ], function (err, result) {
        next(err, result[1]);
        if (!err && result) {
            evtObj && evtObj.onUpdate && evtObj.onUpdate(modelIdValue, currentModel);
        }
    });
};

/**
 * http://mongoosejs.com/docs/2.7.x/docs/updating-documents.html
 * @param query {Object} Query object to select objects to update
 * @param param {Object} Fields to add in selected objects
 * @param next {Function} callback
 */
DBActions.prototype.updateByQuery = function (query, param, next) {
    var that = this, Model = that.Model, modelName = that.modelName;
    var options = { multi: true };
    Model.update(query, param, options, next);
};


DBActions.prototype.incrementCounter = function (next) {
    require(ModelPath + "/CounterSchema");
    var Counter = this.db.model('Counter');
    Counter.findOne({}, function (err, co) {
        if (err) {
            next(err);
            return;
        }
        if (!co) {
            co = new Counter({
                counter: 1
            });
        } else {
            co.counter = ++co.counter;
        }
        co.save(next);
    });
};

/**
 * Multi save in a collection.
 * @param modelDataArr {Array} Model data array objects
 * @param next {Function} Callback
 */
DBActions.prototype.multipleSave = function (modelDataArr, next) {
    var that = this;
    if (!_.isArray(modelDataArr)) {
        that.save(modelDataArr, next);
    }

    async.mapSeries(modelDataArr, that.save.bind(that), function (err, results) {
        next(err, results);
    });
};


DBActions.prototype.save = function (modelData, next) {
    var that = this, modelName = that.modelName;
    var currentModel, c, evtObj = getModelEvent(that.modelName);
    async.series([
        function (n) {
            //increment counter
            that.incrementCounter(function (err, counter) {
                c = counter.counter;
                // attempt to set modelId as current counter
                modelData[getModelIdKey(modelName)] = c;
                n(err, counter);
            });
        },
        function (n) {
            //get & save model
            var model = new that.Model(modelData);
            model.save(n);
        },
        function (n) {
            // get model object
            if (!evtObj) {
                return n(null, true);
            }

            that.getByDefaultFinderMethod(c, function (err, model) {
                if (model) {
                    currentModel = model.toObject();
                }
                n(err, model);
            });
        }

    ], function (err, result) {
        next(err, result[1]);
        if (!err && result) {
            evtObj && evtObj.onSave && evtObj.onSave(c, currentModel);
            that.permissionSchemaKey && PermissionCache.storeByModelId(that.db, that.permissionSchemaKey, that.modelName, c);
        }
    });
};


/**
 * @param [isFindOne] {Boolean} If true then findOne method is used to generate query
 * @see http://mongoosejs.com/docs/query.html
 *
 * @returns mongoose query object
 */
DBActions.prototype.getQuery = function (isFindOne) {
    var methodName = isFindOne ? "findOne" : "find";
    var query = this.Model[methodName]();
    return query;
};

/**
 * query is retrieved by getQuery method.
 */
DBActions.prototype.getByQuery = function (query, next) {
    query.exec(next);
};


DBActions.prototype.count = function (query, next) {
    query.count(next);
};


/**
 *
 * @param methodName {String} Name of method defined in particular model schema file
 * @param [param] {*} Anything as required by above method to find in collection
 * @param next {Function} callback arguments are error and the query result
 */
DBActions.prototype.get = function (methodName, param, next) {
    var that = this, modelName = that.modelName;
//    require(ModelPath + "/" + modelName + "Schema");
    var Model = that.Model;
    if (!_.isArray(param)) {
        param = [param];
    }
    var query = Model[methodName].apply(Model, param),
        modelIdKey = getModelIdKey(modelName);
    if (modelIdKey) {
        query.sort(modelIdKey); // sorting by modelIdKey asc
    }
    query.exec(next);
};

DBActions.prototype.getByDefaultFinderMethod = function (param, next) {
    var that = this, modelName = that.modelName;
    var methodName = getDefaultFinderMethodName(modelName);
    _l(methodName);
    _l(param);
    that.get(methodName, param, next);
};

var getModelIdKey = exports.getModelIdKey = function (modelName) {
    return modelName ? modelName.charAt(0).toLowerCase() + modelName.substring(1, modelName.length) + "Id" : "";
};

var getModelIdValue = DBActions.prototype.getModelIdValue = function (model, modelName) {
    modelName = modelName || this.modelName;
    return model ? model[getModelIdKey(modelName)] : "";
};

function getDefaultFinderMethodName(modelName) {
    return modelName ? "findBy" + modelName + "Id" : "";
}

DBActions.prototype.setModelName = function (modelName) {
    if (modelName) {
        this.modelName = modelName;
        require(ModelPath + "/" + modelName + "Schema");
        this.Model = this.db.model(modelName);
    }
    else {
        throw new Error("Model Name is not defined");
    }
    return this;
};

function DBActions(db, options) {
    this.db = db;
    this.setModelName(options.modelName);
    this.permissionSchemaKey = options.permissionSchemaKey;
//    this.user = options.user;
//    if (this.user) {
//        this.roles = this.user.roles;
//    }
}

exports.DBActions = DBActions;

/**
 * Create DBActions instance from app object
 * @param app {Object} Express app object
 * @param modelName {String}
 * @param [permissionSchemaKey] {String}
 * @returns {DBActions}
 */
exports.getInstanceFromApp = function (app, modelName, permissionSchemaKey) {
    return new DBActions(app.set("db"), {modelName: modelName, permissionSchemaKey: permissionSchemaKey});
};

/**
 * Create DBActions instance from db object
 * @param db {Object} Mongoose db object
 * @param modelName {String}
 * @param [permissionSchemaKey] {String}
 * @returns {DBActions}
 */
exports.getInstanceFromDB = function (db, modelName, permissionSchemaKey) {
    return new DBActions(db, {modelName: modelName, permissionSchemaKey: permissionSchemaKey});
};

/**
 * Create DBActions instance from request
 * @param req {Object} request object
 * @param modelName {String}
 * @param [permissionSchemaKey] {String}
 * @returns {DBActions}
 */
var getInstance = exports.getInstance = function (req, modelName, permissionSchemaKey) {
    return new DBActions(req.app.set("db"), {modelName: modelName, permissionSchemaKey: permissionSchemaKey});
};

/**
 * Create DBActions auth instance merged auth methods for permission check
 * @param req {Object} request object
 * @param modelName {String}
 * @param permissionSchemaKey {String}
 * @returns {DBActions}
 */
var getAuthInstance = exports.getAuthInstance = function (req, modelName, permissionSchemaKey) {
    var dbAction = getInstance(req, modelName, permissionSchemaKey);
    _.extend(dbAction, Auth);
    var validator = new PermissionValidator(req, permissionSchemaKey, modelName);
    dbAction.hasPermission = validator.hasPermission.bind(validator);
    dbAction.getPermissionError = validator.getPermissionError.bind(validator);
    dbAction.getUser = function () {
        return req.session.user;
    };
    return dbAction;
};

/**
 * Returns basic DBAction instance without permissions for the schema name
 * @param app
 * @param {String} schemaName
 * @returns {DBActions}
 */
exports.getSimpleInstance = function (app, schemaName) {
    return new DBActions(app.set("db"), {modelName: schemaName})
};


exports.authorizedPopulateModelAndUpdate =
    function (req, modelName, otherValues, keyMapObj, permissionSchemaKey, next) {
        if (arguments.length != 6 || !_.isString(permissionSchemaKey)) {
            throw new Error("Unsupported arguments")
        }
        var modelValues = PluginHelper.populateModelFromRequest(req, modelName, otherValues, keyMapObj);
        getAuthInstance(req, modelName, permissionSchemaKey).authorizedUpdate(modelValues, next);
    };

exports.authorizedPopulateModelAndSave =
    function (req, modelName, otherValues, keyMapObj, permissionSchemaKey, next) {
        if (arguments.length != 6 || !_.isString(permissionSchemaKey)) {
            throw new Error("Unsupported arguments")
        }
        var modelValues = PluginHelper.populateModelFromRequest(req, modelName, otherValues, keyMapObj);
        getAuthInstance(req, modelName, permissionSchemaKey).authorizedSave(modelValues, next);
    };

exports.populateModelAndUpdate =
    function (req, modelName, otherValues, keyMapObj, next) {
        var modelValues = PluginHelper.populateModelFromRequest(req, modelName, otherValues, keyMapObj);
        getInstance(req, modelName).update(modelValues, next);
    };

exports.populateModelAndSave =
    function (req, modelName, otherValues, keyMapObj, next) {
        var modelValues = PluginHelper.populateModelFromRequest(req, modelName, otherValues, keyMapObj);
        getInstance(req, modelName).save(modelValues, next);
    };

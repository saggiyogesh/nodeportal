var Permissions = require("../permissions/Permissions"),
    PermissionValidator = require("../permissions/PermissionValidator"),
    PluginHelper = require("../PluginHelper"),
    ModelPath = "../../services/shell/model",
    PermissionError = require("../permissions/PermissionError"),
    PermissionCache = require("./Cache/Permissions"),
    getPermissionCache = PermissionCache.get,
    addPermissionCache = PermissionCache.add,
    InvalidModelIdValue = require("./InvalidModelIdValue"),
    hasKey = PermissionCache.hasKey,
    _l = Debug._l,
    _li = Debug._li,
    _i = Debug._i;

DBActions.prototype.remove = function (modelIdValue, next) {
    var that = this, modelIdKey = getModelIdKey(that.modelName);
    var conditions = {};
    conditions[modelIdKey] = modelIdValue;
    that.Model.remove(conditions, next);
    PermissionCache.remove(modelIdValue);
};


DBActions.prototype.authorizedRemove = function (modelIdValue, next) {
    var that = this;
    that.hasPermission(modelIdValue, Permissions.ActionKeys.DELETE, function (err, isAuth) {
        if (err) {
            next(err)
        }
        else if (isAuth) {
            that.remove(modelIdValue, next);
        }
    });
};

DBActions.prototype.authorizedRemoveByQuery = function (query, next) {
    this.addPermissionInQuery(query, Permissions.ActionKeys.DELETE).remove(next);
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

    var query = {}, options = { multi:true };
    query[modelIdKey] = modelIdValue;
    Model.update(query, param, options, next);
};

DBActions.prototype.authorizedUpdate = function (modelData, next) {
    var that = this, modelName = that.modelName,
        modelIdValue = getModelIdValue(modelData, modelName);
    if (!modelIdValue) {
        next(new Error(modelName + " id is not available in model update"));
        return;
    }

    that.hasPermission(modelIdValue, Permissions.ActionKeys.UPDATE, function (err, isAuth) {
        if (isAuth)
            that.update(modelData, next);

        else next(err);
    });
};

DBActions.prototype.authorizedUpdatePermissions = function (modelData, next) {
    var that = this, modelName = that.modelName,
        modelIdValue = getModelIdValue(modelData, modelName);
    if (!modelIdValue) {
        next(new Error(modelName + " id is not available in model update"));
        return;
    }

    that.hasPermission(modelIdValue, Permissions.ActionKeys.PERMISSION, function (err, isAuth) {
        if (isAuth)
            that.update(modelData, next);

        else next(err);
    });
};

DBActions.prototype.incrementCounter = function (next) {
    require(ModelPath + "/CounterSchema");
    var Counter = this.db.model('Counter');
    Counter.findOne({}, function (err, co) {
        if (err) {
            next(err);
            return;
        }
        co.counter = ++co.counter;
        co.save(next);
    });
};

DBActions.prototype.save = function (modelData, next) {
    var that = this, modelName = that.modelName;
    that.incrementCounter(function (err, counter) {
        if (err) {
            next(err);
            return;
        }

        var c = counter.counter;
        // attempt to set modelId as current counter
        modelData[getModelIdKey(modelName)] = c;
        var model = new that.Model(modelData);
        model.save(next);
    });
};

DBActions.prototype.authorizedSave = function (modelData, next) {
    var that = this, actionKey = Permissions.ActionKeys.ADD;
    that.hasPermission(null, actionKey, function (err, isAuthorized) {
        if (isAuthorized) {
            if (that.permissions && !modelData.hasOwnProperty("rolePermissions")) {
                var user = that.user;
                modelData.userId = user.userId;
                modelData.userName = user.userName;
                modelData.rolePermissions = that.permissions.rolePermissions;
            }
            that.save(modelData, next);
        }


        else next(err);
    });
};

/**
 * @see http://mongoosejs.com/docs/query.html
 *
 * @returns mongoose query object
 */
DBActions.prototype.getQuery = function () {
    var query = this.Model["find"]();
    return query;
};

/**
 * query is retrieved by getQuery method.
 */
DBActions.prototype.getByQuery = function (query, next) {
    query.exec(next);
};

DBActions.prototype.authorizedGetByQuery = function (query, next) {
    this.addPermissionInQuery(query).exec(next);
};

DBActions.prototype.count = function (query, next) {
    query.count(next);
};

DBActions.prototype.authorizedCount = function (query, next) {
    this.addPermissionInQuery(query).count(next);
};

DBActions.prototype.get = function (methodName, param, next) {
    var that = this, modelName = that.modelName;
//    require(ModelPath + "/" + modelName + "Schema");
    var Model = that.Model
    if (!_.isArray(param)) {
        param = [param];
    }
    var query = Model[methodName].apply(Model, param),
        modelIdKey = getModelIdKey(modelName);
    if (modelIdKey) {
        query.sort(modelIdKey, 1); // sorting by modelIdKey asc
    }
    query.exec(next);
};

/**
 * Return authorized queries. Use only for findOne queries, where one document is returned
 * @param methodName
 * @param param
 * @param next
 */
DBActions.prototype.authorizedGet = function (methodName, param, next) {
    var that = this, actionKey = Permissions.ActionKeys.VIEW;

    //first get the model by specified method using param, as param need not to be modelId Value
    that.get(methodName, param, function (err, model) {
        if (err || !model || _.isArray(model)) {
            return next(err, model);
        }
        var modelIdValue = getModelIdValue(model, that.modelName);
        !hasKey(modelIdValue) || addPermissionCache({modelId:modelIdValue, rolePermissions:model.rolePermissions });
        that.hasPermission(modelIdValue, actionKey, function (err, isAuth) {
            if (err || !isAuth) model = null;

            next(err, model);
        });
    });
};

/**
 * validate permissions
 * if authorized versions are called, then actionKey should be there otherwise non auth versions
 * to validate permissions
 * @param actionKey
 * @param rolePermissions
 * @param next
 */
DBActions.prototype.validatePermission = function (actionKey, rolePermissions, next) {
    var err, that = this,
        actionValue = that.permissions.actionsValue[actionKey],
        result = PermissionValidator.validatePermission(actionKey, actionValue, rolePermissions, that.roles);
    if (result.hasOwnProperty("isAuthorized")) {
        var isAuthorized = result.isAuthorized;

        if (!isAuthorized) {
            err = new PermissionError(result.role + " is not authorized to " + actionKey);
        }
        next(err, isAuthorized);
    } else {
        _l(actionKey + " :: No permission exists");
        next(err, false);
    }
};

DBActions.prototype.hasPermissionSync = function (modelIdValue, actionKey) {
    var err, that = this, actionValue = that.permissions.actionsValue[actionKey],
        rolePermissions = getPermissionCache(modelIdValue),
        result = PermissionValidator.validatePermission(actionKey, actionValue, rolePermissions, that.roles);
    if (result.hasOwnProperty("isAuthorized")) {
        var isAuthorized = result.isAuthorized;

        if (!isAuthorized) {
            err = new PermissionError(result.role + " is not authorized to " + actionKey);
        }
        return {isAuthorized:isAuthorized, error:err};
    } else {
        _l(actionKey + " :: No permission exists");
        return {isAuthorized:true, error:null};
    }
};


DBActions.prototype.hasPermission = function (modelIdValue, actionKey, next) {
    if (!this.permissions) {
        _l(actionKey + " :: No permission exists for model:  " + this.modelName);
        return next(null, true);
    }
    var that = this, modelName = that.modelName,
        modelIdKey = getModelIdKey(modelName);
    if (actionKey == Permissions.ActionKeys.ADD) {
        var rolePermissions = that.permissions.rolePermissions;
        that.validatePermission(actionKey, rolePermissions, next);
    }
    else if (!hasKey(modelIdValue)) {
        that.get(getDefaultFinderMethodName(modelName), modelIdValue, function (err, model) {
            if (!model) {
                return next(new InvalidModelIdValue("Invalid " + that.modelName.toLowerCase() + "Id: " + modelIdValue));
            }
            var rolePermissions = model.rolePermissions;
            addPermissionCache({modelId:modelIdValue, rolePermissions:rolePermissions});
            that.validatePermission(actionKey, rolePermissions, next);
        });
    }
    else {
        var rolePermissions = getPermissionCache(modelIdValue);
        that.validatePermission(actionKey, rolePermissions, next);
    }
};

DBActions.prototype.addPermissionInQuery = function (query, action) {
    if (this.permissions) {
        action = action || Permissions.ActionKeys.VIEW;
        var that = this, role = that.roles[0], roleQueryKey = "rolePermissions." + role;
        query.where(roleQueryKey, that.permissions.actionsValue[action]);
    }
    return query;

};

//function cachePermission(model) {
//    !getPermissionCache(modelIdValue) || addPermissionCache({modelId:modelIdValue, rolePermissions:model.rolePermissions });
//}
//function checkPermissionInCache(modelId) {
////    if (getPermissionCache(m))
//}

var getModelIdKey = exports.getModelIdKey = function (modelName) {
    return modelName ? modelName.charAt(0).toLowerCase() + modelName.substring(1, modelName.length) + "Id" : "";
};

function getModelIdValue(model, modelName) {
    return model ? model[getModelIdKey(modelName)] : "";
}

function getDefaultFinderMethodName(modelName) {
    return modelName ? "findBy" + modelName + "Id" : "";
}

DBActions.prototype.setModelName = function (modelName) {
    if (modelName) {
        this.modelName = modelName;
        require(ModelPath + "/" + modelName + "Schema");
        this.Model = this.db.model(modelName);
    }
    return this;
};

DBActions.prototype.setPermissions = function (permissions) {
    if (!permissions.hasOwnProperty("actionsValue")) {
        throw new Error("Missing actionsValue from permissions");
    }
    if (!permissions.hasOwnProperty("rolePermissions")) {
        throw new Error("Missing rolePermissions from permissions");
    }
    this.permissions = permissions;
    return this;
};

function DBActions(db, options) {
    this.db = db;
    this.setModelName(options.modelName);
    var modelName = this.modelName;
    this.user = options.user;
    if (options.permissions)
        this.permissions = options.permissions["model." + modelName + "Schema"];
    if (this.user) {
        this.roles = this.user.roles;
    }
}

exports.DBActions = DBActions;

var getInstance = exports.getInstance = function (req, modelName) {
    var app = req.app, db = app.set("db"), user = req.session.user;
    var dbAction = new DBActions(db, {modelName:modelName, user:user, permissions:app.set("permissions")});
    return dbAction;
};

/**
 * use only auth versions
 */

exports.authorizedPopulateModelAndUpdate =
    function (req, modelName, otherValues, keyMapObj, next) {
        var modelValues = PluginHelper.populateModelFromRequest(req, modelName, otherValues, keyMapObj);
        getInstance(req, modelName).authorizedUpdate(modelValues, next);
    };

/**
 * use only auth versions
 */
exports.authorizedPopulateModelAndSave =
    function (req, modelName, otherValues, keyMapObj, next) {
        var modelValues = PluginHelper.populateModelFromRequest(req, modelName, otherValues, keyMapObj);
        getInstance(req, modelName).authorizedSave(modelValues, next);
    };

/**
 * Generic method
 * save or update a model depends on modelIdValue
 */
exports.authorizedPopulateModelAndSaveOrUpdate =
    function (req, modelName, otherValues, keyMapObj, next) {
        var modelValues = PluginHelper.populateModelFromRequest(req, modelName, otherValues, keyMapObj);
        var modelIdKey = getModelIdKey(modelName);
        if (modelValues.hasOwnProperty(modelIdKey)) { //call update
            getInstance(req, modelName).authorizedUpdate(modelValues, next);
        }
        else { //call save
            getInstance(req, modelName).authorizedSave(modelValues, next);
        }
    };

exports.getPermissionCache = getPermissionCache;

exports.addPermissionCache = addPermissionCache;
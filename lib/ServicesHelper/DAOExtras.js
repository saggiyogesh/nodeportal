module.exports = DAOExtras;
exports.ModelNotFoundError = ModelNotFoundError;

function ModelNotFoundError(modelName, pk) {
    this.name = "ModelNotFoundError";
    this.message = "Model not found in " + modelName + " with primary key: " + pk;
    this.localizedMessageKey = "model-not-found-error";
}
util.inherits(ModelNotFoundError, Error);


/**
 * Constructor to create DAO Extras instance for given service.
 * Provides helper methods in service so as to call Loopback Model Hooks on CRUD operations.
 * @param Service {Model}
 */
function DAOExtras(Service) {
    this.Service = Service;

    var name = Service.definition.name;

    /**
     *
     * @param params {Object} Post data
     * @param otherValues {Object}
     * @param keyMapObj {Object}
     * @returns Object
     */
    function populateModel(params, otherValues, keyMapObj) {
        if (!params) {
            throw new Error("Request parameters does not exists");
        }

        var returnObj = {}, otherValues = otherValues || {}, keyMapObj = keyMapObj || {};

        var keys = Object.keys(Service.definition.properties);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i], val = null;
            if (params.hasOwnProperty(key)) {
                val = params[key];
            }
            if (otherValues.hasOwnProperty(key) && (_.isUndefined(val) || val === "" || val === null)) {
                val = otherValues[key];
            }
            if (_.isUndefined(val) || val === "" || val === null) {
                var tempKey = keyMapObj[key],
                    tempVal = tempKey && params[tempKey];
                if (!_.isUndefined(tempVal) && tempVal !== null) {
                    val = tempVal;
                }
            }
            if (!_.isUndefined(val) && val !== null) {
                returnObj[key] = val;
            }
        }
        return returnObj;
    }

    /**
     * Returns Service for the given service name
     * @param name {String} service name
     * @returns {Object}
     */
    Service.getService = function (name) {
        return Service.dataSource.models[name];
    };

    /**
     * Helper method to remove the model by primary key
     * @param pkValue {Number} value of primary key
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    Service.remove = function remove(pkValue, next) {
        async.waterfall([
            function (n) {
                Service.findById(pkValue, n)
            },
            function (model, n) {
                if (model) {
                    model.delete(n)
                }
                else {
                    n(new ModelNotFoundError(name, pkValue));
                }
            }
        ], function (err, result) {
            if (!err) {
                result = true;
            }
            next(err, result);
        });
    };

    /**
     * Helper to update the model by providing data.
     * @param data {Object} model data to be updated. Must have primary key
     * @param next {Function} callback. Parameters : err & boolean flag in case of no err
     */
    Service.update = function update(data, next) {
        var modelIdName = Service.getIdName();
        async.waterfall([
            function (n) {
                Service.findById(data[modelIdName], n);
            },
            function (model, n) {
                var pkValue = data[modelIdName];
                if (model) {
                    delete data[modelIdName];
                    model.updateAttributes(data, n);
                }
                else {
                    n(new ModelNotFoundError(name, pkValue));
                }
            }
        ], function (err, result) {
            if (!err) {
                result = true;
            }
            next(err, result);
        });
    };

    /**
     * Method to increament counter
     * @param next {Function} params: err, counter value
     */
    Service.incrementCounter = function incrementCounter(next) {
        var CounterService = Service.getDataSource().models.Counter;
        CounterService.beforeCreate = function (n, c) {
            console.log("beforeCreate: " + util.inspect(this, true))
            n()
        }
        CounterService.afterCreate = function (n, c) {
            console.log("afterCreate: " + util.inspect(this, true))
            n()
        }

        async.waterfall([
            function (n) {
                CounterService.findOne({}, n);
            },
            function (co, n) {
                if (!co) {
                    CounterService.create({counter: 1}, function (err, c) {
                        n(err, c.counter);
                    });
                } else {
                    var val = ++co.counter;
                    delete co[co.getIdName()];
                    co.updateAttribute("counter", val, function (err, c) {
                        n(err, c.counter);
                    });
                }
            }
        ], next);
    };

    /**
     * Method to save model data & using counter service for model id.
     * @param modelData {Object}
     * @param next {Function} params: err
     */
    Service.save = function save(modelData, next) {
        async.waterfall([
            function (n) {
                //increment counter
                Service.incrementCounter(n);
            },
            function (c, n) {
                modelData[Service.getIdName()] = c;
                Service.create(modelData, n);
            }
        ], next);
    };

    /**
     * Multi save method
     * @param modelDataArr {Array} Model data array objects
     * @param next {Function} Callback
     */
    Service.multipleSave = function (modelDataArr, next) {
        if (!_.isArray(modelDataArr)) {
            Service.save(modelDataArr, next);
        }

        async.mapSeries(modelDataArr, Service.save.bind(Service), function (err, results) {
            next(err, results);
        });
    };

    Service.populateModelAndUpdate = function (formData, otherValues, keyMapObj, next) {
        var modelValues = populateModel(formData, otherValues, keyMapObj);
        this.update(modelValues, next);
    };

    Service.populateModelAndSave = function (formData, otherValues, keyMapObj, next) {
        var modelValues = populateModel(formData, otherValues, keyMapObj);
        this.save(modelValues, next);
    };
}


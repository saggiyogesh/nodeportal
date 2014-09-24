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
                Service.findById(data[modelIdName], n)
            },
            function (model, n) {
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


}


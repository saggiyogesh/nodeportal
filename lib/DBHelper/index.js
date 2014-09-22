
var getModelEvent = require("../ModelEvents").getModelEvent;

exports.RegisterService = function(app, modelPath){
    var ds = app.dataSource;
    var service = require(modelPath);
    ds.attach(service);
    ds.autoupdate(function(err){
        throw err;
    });
};

exports.RegisterModelEvent = function(modelName){




}


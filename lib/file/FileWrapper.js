var fs = require('fs');

module.exports = function ReadFileWrapper() {
    var requestBatches = {};
    var requestCache = {};
    readFile.cacheLifetime = 1000;
    function readFile(key, callback) {
        if (requestCache.hasOwnProperty(key)) {
            var value = requestCache[key];
            process.nextTick(function () {
                callback(null, value);
            });
            return;
        }
        if (requestBatches.hasOwnProperty(key)) {
            requestBatches[key].push(callback);
            return;
        }
        var batch = requestBatches[key] = [callback];
        fs.readFile(key, onDone);
        function onDone(err, result) {
            if (!err && readFile.cacheLifetime) {
                requestCache[key] = result;
                setTimeout(function () {
                    delete requestCache[key];
                }, readFile.cacheLifetime);
            }
            delete requestBatches[key];
            for (var i = 0, l = batch.length; i < l; i++) {
                batch[i].apply(null, arguments);
            }
        }
    }
    return readFile;
};
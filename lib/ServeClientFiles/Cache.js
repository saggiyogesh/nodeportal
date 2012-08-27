var scriptCache = {};

exports.set = function (pluginId, data) {
    scriptCache[pluginId] = data;
};

exports.get = function (pluginId) {
    return scriptCache[pluginId];
};
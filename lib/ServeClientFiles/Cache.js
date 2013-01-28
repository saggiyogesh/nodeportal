var scriptCache = {};

/**
 * Cache the data
 * @param id
 * @param data
 */
exports.set = function (id, data) {
    scriptCache[id] = data;
};

/**
 * Gets data from cache
 * @param id
 */
exports.get = function (id) {
    return scriptCache[id];
};

/**
 * Removes the cache item from cache
 * @param id
 */
exports.remove = function (id) {
    delete scriptCache[id];
};
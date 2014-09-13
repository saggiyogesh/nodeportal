var CacheManager = require('cache-manager'),
    util = require("util"),
    RedisStore = require('./stores/redis'),
    getProp = require("../AppProperties").get;

var STORE_TYPE_MEMORY = "memory", STORE_TYPE_REDIS = "redis",
    DEFAULT_EXPIRATION_TIME = getProp("DEFAULT_CACHE_EXPIRE");

/**
 * Error thrown when id not given for new cache.
 * Each cache should have unique id.
 * @constructor
 */
function IdNotDefinedError() {
    Error.captureStackTrace(this);
    this.message = "Unique id added to each key does not exists";
    this.name = "IdNotDefinedError"
}
IdNotDefinedError.prototype = Object.create(Error.prototype);

/**
 * Error thrown when cache store type is wrong. it must be redis or memory
 * @param type
 * @constructor
 */
function InvalidCacheStoreTypeError(type) {
    Error.captureStackTrace(this);
    this.message = "Cache store type is invalid: " + type;
    this.name = "InvalidCacheStoreTypeError"
}
InvalidCacheStoreTypeError.prototype = Object.create(Error.prototype);

//store all the cache stores.
var caches = {};

/**
 * Abstract function to create cache store
 * @param [options]
 * @constructor
 */
function CacheStore(options) {
    if (!options.id) {
        throw new IdNotDefinedError();
    }
    var storeType, _cache;

    function parseKey(key) {
        return key.replace(/[^a-z0-9]/gi, '_').replace(/^-+/, '').replace(/-+$/, '').toLowerCase();
    }

    /**
     * Returns Cache Store object
     * @returns {Object}
     */
    this.getCacheStore = function () {
        return _cache;
    };

    /**
     * Method initiates cache store depends on type
     * @param type {String} cache store type
     * @returns {CacheStore}
     */
    this._setStoreType = function (type) {
        storeType = type;
        var ttl = options.expires || DEFAULT_EXPIRATION_TIME;
        options.max = options.max || 0; //makes lru cache to store infinite no of items
        switch (type) {
            case STORE_TYPE_MEMORY:
                _cache = CacheManager.caching({store: STORE_TYPE_MEMORY, max: options.max, ttl: ttl});
                break;

            case STORE_TYPE_REDIS:
                _cache = CacheManager.caching({store: RedisStore, db: options.db, ttl: ttl, host: options.host,
                    port: options.port, id: options.id
                });
                break;

            default :
                throw new InvalidCacheStoreTypeError(type);

        }
        //exposing delete method alias of _del
        _cache.delete = _cache.del;
        return this;
    };

    //setting public functions
    /**
     * Gets cache item
     * @param key {String} Key to retrieve cache item
     * @param next {Function} callback. parameters are err, value
     */
    this.get = function (key, next) {
        _cache.get(parseKey(key), next);
    };

    /**
     * Sets cache item in cache.
     * @param key {String} Key to retrieve cache item
     * @param value {String} Value to save cache item
     * @param next {Function} callback. parameters are err
     */
    this.set = function (key, value, next) {
        _cache.set(parseKey(key), value, next);
    };

    /**
     * Delete from cache
     * @param key {String} Key to retrieve cache item
     * @param next {Function} callback. parameters are err
     */
    this.delete = function (key, next) {
        _cache.del(parseKey(key), next);
    };

    /**
     * Wraps a function in cache, the first time the function is run,
     * its results are stored in cache so subsequent calls retrieve from cache
     * instead of calling the function.
     *
     * @example
     *
     *      var key = 'user_' + user_id;
     *      cache.wrap(key, function(cb) {
     *          User.get(user_id, cb);
     *      }, function(err, user) {
     *         console.log(user);
     *      });
     *
     * @param key {String} Key to retrieve cache item
     * @param wrapFn
     * @param next {Function} callback. parameters are err, value
     */
    this.wrap = function (key, wrapFn, next) {
        _cache.wrap(parseKey(key), wrapFn, next);
    };

    /**
     * Flushes the current cache store
     * @param next {Function} callback. parameters are err, success
     */
    this.reset = function (next) {
        _cache.reset(next);
    };

    /**
     * Gets all keys associated with this cache store
     * @param next {Function} callback. parameters are err, keys
     */
    this.keys = function (next) {
        _cache.keys(next);
    };
}

/**
 * Constructor to create cache store in memory.
 * options:
 *      [expires]: {Number} Seconds after cache item expires.  Default @AppProperties.DEFAULT_EXPIRATION_TIME
 *      [keyPrefix]: {String} Prefix before key of this cache. Default current millis
 *      [max]: {Number} No of maximum items in cache. Behaves as LRU cache.
 * @param [options] {Object}
 * @constructor
 */
function MemoryCacheStore(options) {
    options = options || {};
    CacheStore.call(this, options);
    this._setStoreType(STORE_TYPE_MEMORY);
}

/**
 * Constructor to create cache store in redis db.
 * options:
 *      [expires]: {Number} Seconds after cache item expires. Default @AppProperties.DEFAULT_EXPIRATION_TIME
 *      [keyPrefix]: {String} Prefix before key of this cache. Default is current millis
 *      [db]: {String} Redis DB name
 * @param [options]
 * @constructor
 */
function RedisCacheStore(options) {
    options = options || {};
    options.db = options.db || 0;
    CacheStore.call(this, options);
    this._setStoreType(STORE_TYPE_REDIS);
}
util.inherits(MemoryCacheStore, CacheStore);
util.inherits(RedisCacheStore, CacheStore);

//exports.MemoryCacheStore = MemoryCacheStore;
//exports.RedisCacheStore = RedisCacheStore;

/**
 * Create memory cache
 * @param [options] {Object}
 * @returns {MemoryCacheStore}
 */
exports.createMemoryCacheStore = function (options) {
    var c = new MemoryCacheStore(options);
    caches[options.id] = c;
    return c;
};

/**
 * Create redis cache
 * @param [options] {Object}
 * @returns {RedisCacheStore}
 */
exports.createRedisCacheStore = function (options) {
    var c = new RedisCacheStore(options);
    caches[options.id] = c;
    return c;
};

/**
 * Create MemoryCacheStore|RedisCacheStore depends on type
 * @param type {String} cache store type
 * @param options {Object}
 * @returns {MemoryCacheStore|RedisCacheStore}
 */
exports.create = function (type, options) {
    var c;
    switch (type) {
        case STORE_TYPE_MEMORY:
            c = exports.createMemoryCacheStore(options);
            break;
        case STORE_TYPE_REDIS:
            c = exports.createRedisCacheStore(options);
            break;
        default :
            throw new InvalidCacheStoreTypeError(type);
    }

    return c;
};

/**
 * Returns CacheStore by id
 * @param id
 * @returns {MemoryCacheStore|RedisCacheStore}
 */
exports.get = function (id) {
    if (!id) {
        throw new IdNotDefinedError();
    }
    return caches[id];
};

exports.REDIS = STORE_TYPE_REDIS;
exports.MEMORY = STORE_TYPE_MEMORY;


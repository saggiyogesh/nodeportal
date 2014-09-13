var RedisPool = require('sol-redis-pool'),
    getProp = require("../../AppProperties").get,
    async = require("async");

/**
 * Redis cache store.
 * @param args
 * @returns {{}}
 * @constructor
 */
function RedisStore(args) {
    args = args || {};
    var id = args.id;
    var self = {},
        host = args.host || getProp("CACHE_REDIS_HOST"),
        port = args.port || getProp("CACHE_REDIS_PORT");
    var ttl = args.ttl;
    self.name = 'redis';
    self.client = require('redis').createClient(port, host, args);
    self.id = id;

    var redisOptions = {
        redis_host: host,
        redis_port: port
    };

    var pool = new RedisPool(redisOptions),
        getKey = function (key) {
            return id + "__" + key;
        };

    function connect(cb) {
        pool.acquire(function (err, conn) {
            if (err) {
                pool.release(conn);
                return cb(err);
            }

            if (args.db || args.db === 0) {
                conn.select(args.db);
            }

            cb(null, conn);
        });
    }

    self.get = function (key, cb) {
        connect(function (err, conn) {
            if (err) {
                return cb(err);
            }

            conn.get(getKey(key), function (err, result) {
                pool.release(conn);
                if (err) {
                    return cb(err);
                }
                cb(null, JSON.parse(result));
            });
        });
    };

    self.set = function (key, value, cb) {
        connect(function (err, conn) {
            if (err) {
                return cb(err);
            }

            if (ttl) {
                conn.setex(getKey(key), ttl, JSON.stringify(value), function (err, result) {
                    pool.release(conn);
                    cb(err, result);
                });
            } else {
                conn.set(getKey(key), JSON.stringify(value), function (err, result) {
                    pool.release(conn);
                    cb(err, result);
                });
            }
        });
    };

    self.del = function (key, cb) {
        connect(function (err, conn) {
            if (err) {
                return cb(err);
            }

            conn.del(getKey(key), function (err, result) {
                pool.release(conn);
                cb(err, result);
            });
        });
    };

    self.reset = function (cb) {
        connect(function (err, conn) {
            if (err) {
                return cb(err);
            }

            conn.keys(self.id + "*", function (err, keys) {
                if (err) {
                    return cb(err);
                }
                //delete all keys
                keys.push(function (err, result) {
                    pool.release(conn);
                    cb(err, result);
                });
                conn.del.apply(conn, keys)
            });
        });
    };

    self.keys = function (cb) {
        connect(function (err, conn) {
            if (err) {
                return cb(err);
            }

            conn.keys(self.id + "*", function (err, keys) {
                if (err) {
                    return cb(err);
                }
                pool.release(conn);
                cb(err, keys);
            });
        });
    };

    return self;
}

var methods = {
    create: function (args) {
        return RedisStore(args);
    }
};

module.exports = methods;

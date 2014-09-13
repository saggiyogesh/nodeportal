var fixtures = require("../../fixtures"), Cache = require(fixtures.libPath + '/CacheStore'),
    should = require("should"), async = require('async'),
    util = require("util"),
    _ = require("underscore");

//some async function
function get_user(id, cb) {
    setTimeout(function () {
        console.log("Returning user from slow database.");
        cb(null, {id: id, name: 'Bob'}, true);
    }, 100);
}

function tester(cache) {
    it("set a value", function (done) {
        cache.set('foo', 'bar', function (err) {
            if (err) {
                throw err;
            }
            done();
        });
    });

    it("get a value", function (done) {
        cache.get('foo', function (err, val) {
            if (err) {
                throw err;
            }

            val.should.equal("bar");
            done();
        });
    });

    it("delete a value", function (done) {
        cache.delete('foo', function (err) {
            if (err) {
                throw err;
            }
            done();
        });
    });

    it("get keys", function (done) {
        var keys;
        async.parallel([
            function (n) {
                cache.set('foo', 'bar', n);
            },
            function (n) {
                cache.set('foo1', 'bar1', n);
            },
            function (n) {
                cache.set('foo2', 'bar2', n);
            },
            function (n) {
                cache.keys(function(err, k){
                    !err & (keys = k);
                    n(err);
                });
            }
        ], function (err, result) {
            if (err) throw err;
            console.log(keys)
            keys.length.should.equal(3);
            done()
        });
    });

    it("reset cache", function (done) {
        async.parallel([
            function (n) {
                cache.set('foo', 'bar', n);
            },
            function (n) {
                cache.set('foo1', 'bar', n);
            },
            function (n) {
                cache.set('foo2', 'bar', n);
            },
            function (n) {
                cache.reset(n);
            }
        ], function (err, result) {
            if (err) throw err;
            cache.get("foo", function (err, v) {
                (!!v).should.be.false;
                done()
            })

        });
    });

//    it("wrap method test", function (done) {
//        var user_id = 18;
//        var key = 'user_' + user_id;
//        cache.wrap(key, function (cb) {
//            get_user(user_id, cb);
//        }, function (err, user, fromDB) {
//            console.log(user)
//            user.should.eql({id: user_id, name: 'Bob'});
//
//            fromDB.should.be.true;
//            // Second time fetches user from redis_cache
//            cache.wrap(key, function (cb) {
//                get_user(user_id, cb);
//            }, function (err, user, fromDB) {
//                user.should.eql({id: user_id, name: 'Bob'});
//
//                (!!fromDB).should.be.false;
//
//                cache.reset(function (err) {
//                    (!!err).should.be.false;
//                    done();
//                })
//
//            });
//        });
//    })

};

describe("Memory Cache test", function () {
    var c = Cache.createMemoryCacheStore({
        id: "db.cache"
    })
    tester(c)

});

describe("Redis Cache test", function () {
    var c = new Cache.createRedisCacheStore({
//        keyPrefix: __filename,
//        expires: 15000,
        id: "db.cache",
        host: fixtures.redis.host || "127.0.0.1",
        port: fixtures.redis.port || "6379"
    })
    tester(c)
});


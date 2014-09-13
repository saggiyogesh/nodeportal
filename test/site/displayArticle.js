var async = require("async"),
    fixtures = require("../fixtures"),
    WDUtil = require("../WDUtil"),
    should = require("should"),
    util = require("util"),
    _ = require("underscore");


/**
 * Test cases
 * - checking hidden test page not available on top menu
 * - configuring display article plugin to test page, changing its title
 * - configuring wrong article.
 * - remove display article
 */
describe("Crawl site", function () {
    this.timeout(99999999);

    describe("Admin user", function () {
        var user = fixtures.admin;
        var browser;
        //login before each test
        before(function (done) {
            async.waterfall([
                    function (n) {
                        WDUtil.Browser({
                            url: fixtures.appLogin
                        }, n)
                    } ,
                    function (b, n) {
                        if (b) {
                            browser = b;
                            n()
                        }
                    },
                    function (n) {
                        browser.maximize(null, n)
                    },
                    function (n) {
                        browser.fill('#login_email', user.email, n)
                    },
                    function (n) {
                        browser.fill('#login_password', user.password, n)
                    },
                    function (n) {
                        browser.fireClick('#login_submit_login', n)
                    }
                ],
                function (err, result) {
                    console.log(new Date())
//                browser.quit();
                    done();
                });

        });

        after(function () {
            return browser.quit();
        });


        it("Hidden test page not shown in top menu", function (done) {
            var fn = function () {
                return $(".nav:eq(0) li").text().indexOf("test") != -1
            };
            browser.runScript(fn, function (err, result) {
                if (err) throw  err;
                result.should.be.false;

                //open test page
                var fn = function () {
                    location.href = "/test";
                };
                browser.runScript(fn, done)
            })
        });

        it("add display article plugin", function (done) {
            async.series([
                function (n) {
                    browser.fireClick(".dropdown-toggle", n);
                } ,
                function (n) {
                    browser.fireClick("#add_plugins", n, true);
                } ,
                function (n) {
                    browser.fireClick("#addPlugins_Modal #displayArticle", n, true);
                }
            ], function (err, result) {
                if (err) throw  err;
                done();
            });
        });

        it("Edit display article title", function (done) {
            async.series([
                function (n) {
                    browser.fireClick("#displayArticle_1 .tools .edit", n, true);
                } ,
                function (n) {
                    browser.fill("#managePluginEditTitle input", " TDA", n, true);
                } ,
                function (n) {
                    browser.fireClick("#managePluginEditTitle button", n);
                },
                function (n) {
                    browser.fireClick("#editPlugin_Modal .modal-footer button", n);
                },
                function (n) {
                    browser.getElementText("#displayArticle_1 .header", n);
                }
            ], function (err, result) {
                if (err) throw  err;
                var n = 5
                if (result && result.length == n) {
                    result[ n - 1].should.eql("Display Article TDA")
                    done();
                }
            });
        });

        it("configure dummy article id to display article", function (done) {
            async.series([
                function (n) {
                    browser.fireClick("#displayArticle_1 .tools .edit", n, true);
                } ,
                function (n) {
                    browser.fill("#displayArticle_1_id", " test", n, true);
                } ,
                function (n) {
                    browser.fireClick("#displayArticle_1_enableComments", n);
                },
                function (n) {
                    browser.fireClick("#managePluginEditTitle button", n);
                },
                function (n) {
                    browser.fireClick("#editPlugin_Modal input[type='submit']", n);
                },
                function (n) {
                    browser.getElementText("#displayArticle_1 .alert-error", n);
                }
            ], function (err, result) {
                if (err) throw  err;
                var n = 6
                if (result && result.length == n) {
                    console.log(result[n - 1])
                    done();
                }
            });
        });

        //test for adding a new display article plugin & test for 2 flash messages on page
        it("add second display article plugin and check for 2 flash message", function (done) {
            //TODO inclomplete
            async.series([
                function (n) {
                    browser.fireClick(".dropdown-toggle", n);
                } ,
                function (n) {
                    browser.fireClick("#add_plugins", n, true);
                } ,
                function (n) {
                    browser.fireClick("#addPlugins_Modal #displayArticle", n, true);
                }
            ], function (err, result) {
                if (err) throw  err;
                done();
            });
        });


        it("remove display article", function (done) {
            async.series([
                function (n) {
                    browser.querySelector("#displayArticle_1", n)
                },
                function (n) {
                    browser.fireClick("#displayArticle_1 .tools .remove", n, true);
                },
                function (n) {
                    setTimeout(function () {
                        browser.hasElementByCssSelector("#displayArticle_1", n)
                    }, 2000)
                }
            ], function (err, result) {
                if (err) throw  err;
                var n = 3
                if (result && result.length == n) {
                    console.log(result)
                    var el = result[n - 1];
                    el.should.be.false;
                    done();
                }
            });
        });


        //TODO test after configuring correct article to displayArticle

    });


//    describe("Logged in user", function (done) {
//        var user = fixtures.user;
//        test(user)
//    });
});
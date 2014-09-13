var async = require("async")
fixtures = require("../fixtures"),
    WDUtil = require("../WDUtil"),
    should = require("should"),
    util = require("util"),
    _ = require("underscore");

function doUpload(browser, done) {
    async.series([
        function (n) {
            browser.fireClick("#manageResource_UploadButton", n);
        },
        function (n) {
            browser.querySelector("#manageResource_uploader", n, true);
        },
        function (n) {
            browser.chooseFile(".fileinput-button input", __dirname + "/test.jpg", n);
        },
        function (n) {
            setTimeout(function () {
                browser.fireClick("td.start button", n);
            }, 500)
        },
        function (n) {
            browser.querySelector("td.success", function (e, el) {
                if (el) {
                    el.should.be.ok;
                }
                n(e)
            }, true);
        },
        function (n) {
            browser.fireClick('#manageResource_uploader_Modal button.close', n);

        }
    ], function (err, result) {
        if (err) throw err
        if (!err)
            done()
    });
}

function test(user) {
    var browser;
    var name = "TEST FOLDER", newName = "TEST FOLDER 1"
    var that = this, isAdmin = _.indexOf(user.roles, "Admin") > -1;
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


    it("should able to open settings page", function (done) {
        browser.get(fixtures.settings, done)
    });

    it("should open user manage plugin page", function (done) {
        browser.fire("#manageResource a", "click", function (err) {
            if (err) throw  err;

            browser.querySelector("#manageResource_UploadButton", function (err, el) {
                if (err) throw  err;
                el.should.be.ok;
                done();
            })

        });
    });

    it("have Home in breadcrumb", function (done) {
        browser.getElementText("#breadcrumbs > li a", function (err, text) {
            if (err) throw  err;
            "Home".should.equal(text);
            done();

        }, true)
    });

    it("should upload a test.jpg file", function (done) {
        doUpload(browser, done)
    })

    it("should add new folder named 'TEST FOLDER'", function (done) {
        browser.fire("#addFolder", "click", function (err) {
            if (err) throw  err;

            browser.fill(".bootbox input", name, function () {
                browser.fireClick("a.btn-primary", function (err) {
                    if (err) throw  err;

                    browser.getElementText("#manageResource_successFlash .message", function (err, t) {
                        if (err) throw  err;

                        t.should.equal("Folder added successfully.");

                        setTimeout(function () { //let wait for flash msg to hide 5sec delay
                            done();

                        }, 5000);
                    });


                })
            }, true);

        })
    });

    it("should not add same folder named 'TEST FOLDER'", function (done) {
        browser.fire("#addFolder", "click", function (err) {
            if (err) throw  err;

            browser.fill(".bootbox input", name, function () {
                browser.fireClick("a.btn-primary", function (err) {
                    if (err) throw  err;

                    browser.getElementText("#manageResource_errorFlash .message", function (err, t) {
                        if (err) throw  err;

                        console.log(">> " + t)

                        t.should.equal("Duplicate name: " + name);
                        setTimeout(function () { //let wait for flash msg to hide 5sec delay
                            done();
                        }, 5000)
                    });
                });
            }, true);

        })
    });

    it("should rename 'TEST FOLDER' to TEST FOLDER 1", function (done) {
        async.series([
            function (n) {
                var fn = function () {
                    var els = $('.resource-view li .thumbnail'), el;

                    els.each(function (i, n) {
                        if ($(n).text().trim() == "TEST FOLDER") {
                            el = n;
                        }
                    })
                    //set temp class on el
                    $(el).addClass('TEST_FOLDER_1')

                };
                browser.runScript(fn, n)
            },
            function (n) {
                browser.fire(".TEST_FOLDER_1 .action-button", "click", n)
            },
            function (n) {
                browser.fire(".TEST_FOLDER_1 .dropdown-menu li a.rename", "click", n, true)
            },
            function (n) {
                browser.fill(".bootbox input", newName, n, true)
            },
            function (n) {
                browser.fireClick("a.btn-primary", n)
            },

            function (n) {
                browser.getElementText("#manageResource_successFlash .message", function (err, t) {
                    !err && t.should.equal("Renamed successfully.");
                    setTimeout(function () { //let wait for flash msg to hide 5sec delay
                        n(err);
                    }, 5000)
                });

            }
        ], function (err, result) {
            if (err) throw err
            if (!err)
                done()
        });
    })

    it("open TEST FOLDER 1 & check breadcrumb & upload", function (done) {
        async.series([
            function (n) {
                var fn = function () {
                    var els = $('.resource-view li .thumbnail'), el;

                    els.each(function (i, n) {
                        if ($(n).text().trim() == "TEST FOLDER 1") {
                            el = n;
                        }
                    })
                    //set temp class on el
                    $(el).addClass('TEST_FOLDER_1')

                };
                browser.runScript(fn, n)
            },
            function (n) {
                browser.fire(".TEST_FOLDER_1", "click", n)
            },
            function (n) {
                browser.querySelector(".no-resource", function (e, el) {
                    el.should.be.ok;
                    n(e);
                }, true)
            },
            function (n) {
                browser.getElementText('ul#breadcrumbs li:last-child', function (e, t) {
                    t.should.equal(newName);
                    n(e)
                })
            }
            ,
            function (n) {
                doUpload(browser, n)
            }
        ], function (err, result) {
            if (err) throw err
            if (!err)
                done()
        });
    })

    //TODO delete folder tests
//    it("should not delete TEST FOLDER 1", function (done) {
//        async.series([
//            function (n) {
//
//            },
//            function (n) {
//
//            },
//            function (n) {
//
//            },
//            function (n) {
//
//            }
//
//        ], function (err, result) {
//        });
//    })

}


describe("Settings page Manage resource plugin", function () {
    this.timeout(99999999);

    describe("Admin user", function () {
        var user = fixtures.admin;
        test(user)
    });

//    describe("Logged in user", function (done) {
//        var user = fixtures.user;
//        test(user)
//    });
});
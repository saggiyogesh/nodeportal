var assert = require('assert');
var Browser = require('zombie'),
    fixtures = require("../fixtures.js"),
    should = require("should"),
    util = require("util"),
    Helpers = require("../Helpers"),
    _ = require("underscore");

function getPageFromTitle(browser, pageTitle) {
    var t;
    Helpers.$(browser)("a.dynatree-title").each(function (i, n) {
        if (Helpers.$(browser)(n).text() == pageTitle) {
            t = n;
        }
    });
    return t;
}

var CHILDREN_TAB_SELECTOR = "a[href='#tabs-2']";

function hasSuccessMessage(browser) {
    browser.querySelector(".alert-success").should.be.ok;
}

function test(user) {
    var isAdmin = _.indexOf(user.roles, "Admin") > -1;

    //login before each test
    before(function (done) {
        this.browser = new Browser({ debug: false  });
        Helpers.doLogin(this.browser, isAdmin, done);
    });

    //settings page opened by admin
    it("Open manage page plugin", function (done) {
        var browser = this.browser;
        browser.visit(fixtures.settings, function (err) {
            if (err) throw  err;
            browser.statusCode.should.not.eql(401);

            //clicking user manage link to open manage page plugin
            //admin can open it
            if (isAdmin) {
                browser.fire("#managePage a", "click", function (err) {
                    if (err) throw  err;
                    browser.querySelector(".pagesTree ul:last-child li").should.be.ok;
                    done();
                });
            } else { //401 err for logged in user
                browser.visit(fixtures.settings + "/managePage", function (err) {
//                    if (err) throw  err;
                    browser.statusCode.should.eql(401);
                    done();
                });
            }


        });
    });


    isAdmin && it("create page test page 1", function (done) {
        var b = this.browser, $ = Helpers.$(b);
        b.clickLink(".add-page a", function (err) {
            if (err) throw  err;
            var t = $("form#managePage_fm").attr("action").indexOf("updatePage") > 1;
            t.should.be.true; //correct form

            b.fill("#managePage_name", "test page 1")
                .fill("#managePage_friendlyURL", "tp1")
                .pressButton("#managePage_submit_update", function (err) {
                    if (err) throw  err;
                    hasSuccessMessage(b);

                    done()
                })
        });

    });


    isAdmin && it("open edit of test page 1", function (done) {
        var b = this.browser,
            testPage = getPageFromTitle(b, "test page 1");
        testPage.should.be.ok;

        b.click(testPage, function (err) {
            if (err) throw  err
            var edit = b.querySelector("#managePage_Actions #edit");
            b.click(edit, function (err) {
                if (err) throw  err;

                var v = !!Helpers.$(b)("#managePage_name").attr("disabled");
                v.should.be.false
                done();
            })

        });
    });

    isAdmin && it("change url of test page 1", function (done) {
        var b = this.browser;
        b.fill("#managePage_friendlyURL", "testPage1")
            .pressButton("#managePage_submit_update", function (err) {
                if (err) throw err;

                hasSuccessMessage(b)
                done();
            });
    });
//
    isAdmin && it("should not open page order form", function (done) {
        var b = this.browser,
            testPage = getPageFromTitle(b, "test page 1");
        testPage.should.be.ok;

        b.click(testPage, function (err) {
            if (err) throw err;
            Helpers.$(b)(CHILDREN_TAB_SELECTOR).parent().hasClass("ui-state-disabled").should.be.true;
            setTimeout(function() { //hack to clear the test :(
                done();
            }, 500);
        });
    });

    isAdmin && it("add child page 1 of test page 1", function (done) {
        var b = this.browser,
            testPage = getPageFromTitle(b, "test page 1");
        testPage.should.be.ok;

        b.click(testPage, function (err) {
            if (err) throw err;
            var addChild = b.querySelector("#managePage_Actions #addChild");

            b.click(addChild, function (err) {
                if (err) throw err;

                b.fill("#managePage_name", "child page 1")
                    .fill("#managePage_friendlyURL", "cp1")
                    .pressButton("#managePage_submit_update", function (err) {
                        if (err) throw  err;
                        hasSuccessMessage(b)

                        getPageFromTitle(b, "child page 1").should.be.ok

                        done()
                    })
            });
        });
    });

    isAdmin && it("add child page 2 of test page 1", function (done) {
        var b = this.browser,
            testPage = getPageFromTitle(b, "test page 1");
        testPage.should.be.ok;

        b.click(testPage, function (err) {
            if (err) throw err;
            var addChild = b.querySelector("#managePage_Actions #addChild");

            b.click(addChild, function (err) {
                if (err) throw err;

                b.fill("#managePage_name", "child page 2")
                    .fill("#managePage_friendlyURL", "cp2")
                    .pressButton("#managePage_submit_update", function (err) {
                        if (err) throw  err;
                        hasSuccessMessage(b)

                        getPageFromTitle(b, "child page 2").should.be.ok

                        done()
                    })
            });
        });
    });

    isAdmin && it("open children tab & reorder the child pages", function (done) {
        var b = this.browser,
            testPage = getPageFromTitle(b, "test page 1");
        testPage.should.be.ok;

        b.click(testPage, function (err) {
            if (err) throw err;
            //click on "Children" tab
            b.click(b.querySelector(CHILDREN_TAB_SELECTOR), function (err) {
                if (err) throw err;

                //select childtab 2
                Helpers.$(b)("#childSelect option:eq(1)").attr("selected", "true");

                b.click(b.querySelector("#btn-up"), function (e) {
                    if (e) throw  e;

                    b.pressButton("#managePage_update_order_fm #managePage_submit_update", function (err) {
                        if (err) throw err;

                        hasSuccessMessage(b)

                        testPage = getPageFromTitle(b, "test page 1");

                        Helpers.$(b)(testPage).closest("li").find("ul li:eq(0)").text().should.eql("child page 2");

                        done();

                    })
                });
            });
        });
    });

    isAdmin && it("delete child page 2 and render page tree correctly", function (done) {
        var b = this.browser,
            cp = getPageFromTitle(b, "child page 2");
        cp.should.be.ok;

        b.click(cp, function (err) {
            if (err) throw  err
            var del = b.querySelector("#managePage_Actions #delete");

            b.click(del, function (err) {
                if (err) throw  err;

                var ok = b.querySelector("a[data-handler='1']");

                ok.should.be.ok;

                b.click(ok, function (e) {
                    if (e) throw e;

                    getPageFromTitle(b, "child page 1").should.be.ok;
                    (!!getPageFromTitle(b, "child page 2")).should.be.false;

                    done();
                });
            });
        });
    });


}

describe("Settings page Manage page plugin", function () {
    describe("Admin user", function () {
        var user = fixtures.admin;
        test(user)
    });

    describe("Logged in user", function (done) {
        var user = fixtures.user;
        test(user)
    });
});
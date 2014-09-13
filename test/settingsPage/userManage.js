var assert = require('assert');
var Browser = require('zombie'),
    fixtures = require("../fixtures.js"),
    should = require("should"),
    util = require("util"),
    Helpers = require("../Helpers"),
    _ = require("underscore");


var home = "/home", settings = "/settings";

function test(user) {
    var isAdmin = _.indexOf(user.roles, "Admin") > -1;

    //login before each test
    before(function (done) {
        this.browser = new Browser({ debug: false  });
        Helpers.doLogin(this.browser, isAdmin, done);
    });

    //settings page opened by admin
    it("should able to open settings page", function (done) {
        var browser = this.browser;
        browser.visit(fixtures.settings, function (err) {
            if (err) throw  err;
            browser.statusCode.should.not.eql(404);
            done();
        });
    });

    it("should open user manage plugin page", function (done) {
        var browser = this.browser;
        browser.fire("#userManage a", "click", function (err) {
            if (err) throw  err;
            browser.querySelector("#userManage_img").should.be.ok;
            done();
        });
    });

    //dob required validation
    it("should not save user info, as dob is required", function (done) {
        var browser = this.browser;
        browser.fill("#userManage_firstName", "Test Admin")
            .fill("#userManage_middleName", "Test Admin middle name")
            .select("#userManage_gender", "male")
            .pressButton("#userManage_submit_update", function (err) {
                if (err) throw err;
                var $ = Helpers.$(browser);
                browser.querySelector("#userManage_user .alert-error").should.be.ok;
                $("#userManage_dob").hasClass("error").should.be.true;
                done();
            });
    });

    it("should not save user info", function (done) {
        var browser = this.browser;
        browser.fill("#userManage_firstName", "Test Admin")
            .fill("#userManage_middleName", "Test Admin middle name")
            .fill("#userManage_dob", "05.Feb.2014")
            .select("#userManage_gender", "male")
            .pressButton("#userManage_submit_update", function (err) {
                if (err) throw err;
                browser.querySelector("#userManage_user .alert-success").should.be.ok;
                browser.querySelector("#userManage_middleName").value.should.eql("Test Admin middle name");
                browser.querySelector("#userManage_gender").value.should.eql("male");
                done();
            });

    });

//    it("should upload profile pic", function (done) {
//        var b = this.browser;
//
//        b.click("#userManage_uploadButton", function (e) {
//            if (e) throw e;
//
//            console.log(">>> " + Helpers.$(b)("#userManage_uploader input").val());
//
//
//            b.attach("#userManage_uploader input", "F:\\Nodeportal\\np_7-12-13\\nodefirstapp\\test\\test.jpg");
//
//            setTimeout(function(){
//                console.log(">>> " + Helpers.$(b)("#userManage_uploader input").val());
//                console.log(">>> " + Helpers.$(b)("#userManage_uploader_Modal  button.start").text());
//
//                b.click("#userManage_uploader_Modal  td.start button", function (e) {
//                    setTimeout(function(){
//                        if (e) throw e;
//                        console.log("... >>> " +b.html())
////                b.querySelector(".success").should.be.ok;
//                        done();
//                    }, 1000)
//                })
//            }, 1000)
//        })
//    })

//        it("should open update password form", function (done) {
//            var browser = this.browser,
//                el = browser.querySelectorAll("#userManage_user ul.nav-tabs li a")[1];
//            browser.fire(el, "click");
//            browser.wait(function (err) {
//                lconsole.log(browser.html())
//                if (err) throw  err;
//                browser.querySelector("#userManage_securityFM").should.be.ok;
//
//                browser
//                    .fill("#userManage_oldPassword", fixtures.admin.password)
//                    .fill("#userManage_newPassword", fixtures.admin.password + "1")
//                    .fill("#userManage_confirmNewPassword", fixtures.admin.password + "1")
//                    .pressButton("#userManage_submit_update", function (err) {
//
//
//                        done();
//                    });
//            });
//        });

}

describe("Settings page User manage plugin", function () {
    describe("Admin user", function () {
        var user = fixtures.admin;
        test(user)
    });

    describe("Logged in user", function (done) {
        var user = fixtures.user;
        test(user)
    });
});
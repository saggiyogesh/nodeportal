var assert = require('assert');
var Browser = require('zombie'),
    fixtures = require("./fixtures"),
    should = require("should"),
    util = require("util");


describe("App", function () {

    /**
     * Login test by admin
     */
    it("should be started and home page is loaded and able to login", function (done) {
        Browser.visit(fixtures.home, function (err, browser) {
            if (err) throw  err;
            browser.success.should.be.ok;
            browser
                .fill('#login_email', fixtures.admin.email)
                .fill('#login_password', fixtures.admin.password)
                .pressButton('#login_submit_login', function (err) {
                    if (err) throw err;
                    browser.text('#login .content').should.eql('Welcome');
                    done();
                });
        });
    });

    /**
     * settings page open by guest
     */
    it("should give 401 error for settings page", function (done) {
        Browser.visit(fixtures.settings, function (err, browser) {
            browser.statusCode.should.eql(401);
            done();
        });
    });


});
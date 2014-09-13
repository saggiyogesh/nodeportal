var Browser = require('zombie'),
    fixtures = require("./fixtures");

/**
 * function to process login for testing
 *
 * @param browser {Object} zombie browser object
 * @param isAdmin {Boolean} login by is admin role.
 * @param next {Function} callback function
 */
exports.doLogin = function (browser, isAdmin, next) {
    var user = fixtures.admin;
    if (!isAdmin) {
        user = fixtures.user;
    }
    browser.visit(fixtures.appLogin, function (err) {
        if (err) throw  err;
        browser.success.should.be.ok;
        browser
            .fill('#login_email', user.email)
            .fill('#login_password', user.password)
            .pressButton('#login_submit_login', function (err) {
                if (err) throw  err;
                //login success & has logout link
                browser.querySelector("a[href='/app/logout']").should.be.ok;
                next();
            });
    });
};

/**
 * @param browser
 * @returns {Object} jQuery object
 */
exports.$ = function(browser){
    return browser.window.$;
};

exports.doLoginWD = function (browser, isAdmin, next) {


}
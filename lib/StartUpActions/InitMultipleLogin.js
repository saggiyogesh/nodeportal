/**
 * Setup multiple accounts login via FB, Google, Twitter etc.
 */

module.exports = function (app, done) {
    return function (next) {
        require("../login/PassportUtil").init(app);
        next(null, done);
    };
};
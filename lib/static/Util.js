/**
 * Util class for serving client's static files
 */

var getProp = require("../AppProperties").get, loopback = require("loopback");

/**
 * Sets static folders for express to serve client's js and css.
 * Method also sets max age for files as per mode(dev or prod)
 * @param app {Object}
 * @param dirPath {String}
 */
exports.setStaticFolder = function (app, dirPath) {
    var static = function (maxAge) {
        app.use(loopback.static(dirPath, { maxAge: maxAge }));
    };
    if ('development' == app.get('env')) {
        var maxAge = getProp("DEV_STATIC_MAX_AGE");
        static(maxAge);
    }

    if ('production' == app.get('env')) {
        loopback.compress && app.use(loopback.compress());
        var maxAge = getProp("PROD_STATIC_MAX_AGE");
        static(maxAge);
    }

};
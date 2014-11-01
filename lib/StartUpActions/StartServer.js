/**
 * Startup action to bind port to application
 */

var AppProperties = require("../AppProperties");
var https = require('https');
var http = require('http');

module.exports = function (app, done) {
    return function (next) {
        //if port is given in terminal
        var server ,
            httpsPort = AppProperties.get("HTTPS_SERVER_PORT"),
            httpPort = process.argv[2] || AppProperties.get("HTTP_SERVER_PORT") || 3000;

        if (httpsPort) {

            var certificateFile = AppProperties.get("HTTPS_CERTIFICATE_FILE_PATH"),
                keyFile = AppProperties.get("HTTPS_KEY_FILE_PATH");

            Debug._l(certificateFile);
            Debug._l(keyFile);

            server = https.createServer({
                key: fs.readFileSync(keyFile),
                cert: fs.readFileSync(certificateFile)
            }, app).listen(httpsPort);
        }
        else {
            server = http.createServer(app).listen(httpPort);
        }

        app.server = server;
        Debug._l("Express server listening on port " + httpPort + " in " + app.settings.env + " mode");

        Debug._l('all routes.....................................');

        app._router.stack.forEach(function (r) {
            if (r.route) {
                var route = r.route
                var method = "GET";
                if (route.methods.post && route.methods.post) method = "POST";
                console.log("%s :: %s", method, route.path);
            }
        });
        next(null, done);
    };
};
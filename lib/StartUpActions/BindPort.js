/**
 * Startup action to bind port to application
 */

var AppProperties = require("../AppProperties");
module.exports = function (app, done) {
    return function (next) {
        //if port is given in terminal
        var port = process.argv[2] || AppProperties.get("SERVER_PORT");
        app.listen(port);
        Debug._l("Express server listening on port " + port + " in " + app.settings.env + " mode");

        console.log('all routes.....................................');

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
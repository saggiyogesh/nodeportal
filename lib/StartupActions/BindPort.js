/**
 * Startup action to bind port to application
 */

var AppProperties = require("../AppProperties");
module.exports = function (app, done) {
    return function (next) {
        //if port is given in terminal
        app.listen(process.argv[2] || AppProperties.get("SERVER_PORT"));
        Debug._l("Express server listening on port " + app.address().port +" in " + app.settings.env +" mode");

        console.log('all routes.....................................');
        app.routes.all().forEach(function (route) {
            console.log('  \033[90m%s \033[36m%s\033[0m', route.method.toUpperCase(), route.path);
        });

        next(null, done);
    };
};
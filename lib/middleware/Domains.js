/**
 * Middleware binding domains to request and handling graceful shutdown of app & server.
 */
var domain = require("domain");

/**
 * Function handling gracefully shutdown of process
 * Do handle to close connections & utilities in this.
 * @param app
 */
function ExitServer(app){
    app.set("isShuttingDown", true); // <-- set state
    Debug._l('Closing down the server');
    require("../Mailer").Transport.close();
    app.server.close(function() {
        Debug._l('All connections done, stopping process')
        process.exit(1);  // <-- all clear to exit
    });
}

module.exports = function (app) {
    return function (req, res, next) {
        var reqDomain = domain.create();
        reqDomain.add(req);
        reqDomain.add(res);

        reqDomain.once('error', function (err) {
            require('util').debug(err.stack || err);
            ExitServer(app);
            next(err);
        });

        reqDomain.run(next);
    };
};
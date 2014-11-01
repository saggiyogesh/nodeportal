/**
 * Middleware killing keep alive connections for graceful shutdown of app & server.
 */

module.exports = function (app) {
    return function (req, res, next) {
        if (app.get("isShuttingDown")) {  // <-- check state
            req.connection.setTimeout(1);  // <-- kill keep-alive
        }
        next();
    };
};
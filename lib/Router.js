//method will create a route in runtime as per express
var AppURL = require("./AppProperties").get("APP_URL");
var routes = [], appRoutes = [];

/*
 * Function return the proper route for a plugin, depending on its type
 * i.e. instantiable or non instantiable
 */
function getRoute(params) {
    return (params.isAppRoute ? AppURL + "/" : "/:page/") + params.pluginId + (params.many ? "/:iId" : "") + params.route;
}

exports.createRoute = function (app, method, params, fn) {
    var route = new Route(method.toLowerCase(), getRoute(params), fn);
    if (!params.isAppRoute) {
        routes.push(route)
    } else {
        appRoutes.push(route(app));
    }
};

/**
 * Returns a fn, which return the express route object
 * @param method
 * @param route
 * @param fn
 */
function Route(method, route, fn) {
    this.method = method;
    this.route = route;
    this.fn = fn;

    return function (app) {
        var args = [method, route, fn];
        var routes = app.routes._route.apply(app.routes, args);
        var methodRoutes = routes.routes[method];
        return methodRoutes[methodRoutes.length - 1];
    };
}

exports.addPluginRoutes = function (app) {
    routes.forEach(function (route) {
        route(app);
    });
};

exports.isAppRoute = function (url) {
    for (var i = 0; i < appRoutes.length; i++) {
        var appRoute = appRoutes[i];
        if (appRoute.match(url)) {
            return true;
        }
    }
    return false;
};
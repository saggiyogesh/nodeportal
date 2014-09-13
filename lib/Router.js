//method will create a route in runtime as per express
var AppURL = require("./AppProperties").get("APP_URL");
var SettingsURL = require("./AppProperties").get("SETTINGS_URL");
var routes = [], appRoutes = [];

/*
 * Function return the proper route for a plugin, depending on its type
 * i.e. instantiable or non instantiable
 */
function getRoute(params) {
    params.route = params.route || "";
    var localeRoute = utils.getLocaleRoute(),
        pageRoute = localeRoute + "/:page/",
        settingsRoute = utils.getAppSettingsRoute() + "/";

    return (params.isAppRoute ? AppURL + "/" : params.settings ? settingsRoute : pageRoute)
        + params.pluginId + (params.many ? "/:iId" : "") + params.route
}

exports.createRoute = function (app, method, params, fn) {
    var route = new Route(method.toLowerCase(), getRoute(params), fn, params.settings);
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
        var middleware = exports.isAppSettingsRoute(route) ? utils.getSettingsMiddlewares() :
            utils.getRequestMiddlewares();

        if (method == "get") {
            app.get(route, middleware, fn)
        }
        else if (method == "post") {
            app.post(route, middleware, fn);
        }
//        var methodRoutes = app.routes[method];
//        return methodRoutes[methodRoutes.length - 1];
    };
}

exports.addPluginRoutes = function (app) {
    routes.forEach(function (route) {
        route(app);
    });
};

exports.isAppRoute = function (url) {

    //regex checks for app url at the beginning.
    var pattern = new RegExp("^" + AppURL + "/");
    return pattern.test(url);
};

exports.isAppSettingsRoute = function (route) {
//    console.log("--- " + route + " :: " + ( route.split(utils.getAppSettingsRoute()).length == 2))
    return route.split(utils.getAppSettingsRoute()).length == 2;
};
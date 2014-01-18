define(["util", "plugin"], function () {
    var cache = {};

    Rocket.PluginURL = function (params) {
        var currentPlugin = Rocket.Plugin.currentPlugin,
            url = [params.isAppRoute ? Rocket.Props.getAppUrl() : Rocket.PageValues.getPageFriendlyURL(), currentPlugin.pluginId ];
        if (currentPlugin.iId) {
            url.push(currentPlugin.iId);
        }

        if (params && params.action) {
            url.push(params.action);
        }

        url = url.join("/");

        if (params && params.mode) {
            url += "?mode=" + params.mode;
        }

        return url;
    };

    Rocket.PluginURL.createByNamespace = function (namespace, paths, params, mode, isAppRoute) {
        var o = Rocket.Props.getPluginIdAndIId(namespace);
        var arr = [o.pluginId];
        if (o.iId) {
            arr.push(o.iId);
        }

        if (!_.isArray(paths)) {
            paths = [paths];
        }

        arr = _.union(arr, paths);

        if (mode) {
            params = params || {};
            params.mode = mode;
        }

        var query = params && $.param(params);
        var url = Rocket.Util.getOrigin() + (isAppRoute ? Rocket.Props.getAppUrl() : Rocket.PageValues.getPageFriendlyURL()) + "/" + arr.join("/");
        if (query) {
            url = url + "?" + query;
        }

        return url;


    };

    Rocket.PluginURL.async = function (params, callback) {
        var pageUrl = Rocket.PageValues.getPageFriendlyURL(), namespace = Rocket.Plugin.currentPlugin.namespace,
            data = {
                page: pageUrl,
                namespace: namespace
            }, key = [namespace];


        if (params && params.action) {
            data.action = params.action;
            key.push(params.action);
        }

        if (params && params.mode) {
            data.mode = params.mode;
            key.push(params.mode);
        }
        key = key.join("_");

        if (cache[key]) {
            callback(cache[key]);
            return;
        }
        Rocket.ajax({
            url: Rocket.Props.getAppUrl() + "/pluginUrl",
            data: data,
            success: function (response) {
                if (response.success == true) {
                    if (callback) {
                        callback(response.url);
                    }
                    cache[key] = response.url;
                }
                else {
                    alert("Some problem at server.");
                }
            }
        });
    };


});
;
(function ($, Rocket) {
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

    Rocket.PluginURL.async = function (params, callback) {
        var pageUrl = Rocket.PageValues.getPageFriendlyURL(), namespace = Rocket.Plugin.currentPlugin.namespace,
            data = {
                page:pageUrl,
                namespace:namespace
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
            url:Rocket.Props.getAppUrl() + "/pluginUrl",
            data:data,
            success:function (response) {
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


})(jQuery, Rocket);
/**
 *
 */

define(["events", "util"], function () {
    var list = {};
    Rocket.Plugin = {
//	    add : function(id) {
//		list.push(id);
//	    },
        getPlugins: function () {
            return list;
        },
        getPlugin: function (namespace) {
            return list[namespace];
        },
        onLoad: function (options) {
            var namespace = options.namespace;
            list[namespace] = options.props;
            Rocket.trigger("plugin:" + namespace + ":ready");
            //console.log(list);
        },
        getThisPluginId: function () {
            //get this from URL
        },
        /**
         *
         * @param modelId {Number} model unique id
         * @param modelName {String} model name
         * @param modelPermissionSchema {String} Permission schema key in which permission should be checked
         * @param redirect {URL} Redirection url after submit
         * @returns {string} {URL} Permission url
         */
        permissionURL: function (modelId, modelName, modelPermissionSchema, redirect) {
            var arr = ["/managePermissions/model", modelId, modelName, modelPermissionSchema];
            var permissionURL = Rocket.Util.getOrigin() + Rocket.PageValues.getPageFriendlyURL() + arr.join("/") + "?redirect="
                + encodeURIComponent(redirect);
            return permissionURL;
        },

        isActionsAuthorized: function (modelId, modelName, permissionSchemaKey, actions, next) {
            var arr = [Rocket.Props.getAppUrl(), "permissions", modelId, modelName, permissionSchemaKey, _.compact(actions).join()];
            var url =  arr.join("/");
            Rocket.ajax({
                url: url,
                success: function(response){
                    if(response && response.success && response.success== true){
                        return next(response);
                    }
                    next(false);
                }
            });
        }
    };
});
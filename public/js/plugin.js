/**
 *
 */

(function ($, Rocket) {
    var list = {};
    Rocket.Plugin = {
//	    add : function(id) {
//		list.push(id);
//	    },
        getPlugins:function () {
            return list;
        },
        getPlugin:function (namespace) {
            return list[namespace];
        },
        onLoad:function (options) {
            var namespace = options.namespace;
            list[namespace] = options.props;
            Rocket.trigger("plugin:" + namespace + ":ready");
            console.log(list);
        },
        getThisPluginId:function () {
            //get this from URL
        }



    };

})(jQuery, Rocket);
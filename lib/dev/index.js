var plugins = require("../plugins"), Watcher = require("../Watcher");

/*function watchPluginFile(pluginId, pluginPath, files, app) {
    files.forEach(function (file) {
        if (file.indexOf(".js") > -1) {
            var filePath = pluginPath + file;
            fs.watch(filePath, function (event, filename) {
                if(event == "change"){
                    console.log('event is: ' + event);
                    console.log('event is: ' + filePath);
                    if (filename) {
                        console.log('filename provided: ' + filename);
                    } else {
                        console.log('filename not provided');
                    }
                    console.log("is valid: " + (event == "change" && filename  && filePath))

                    if(event == "change" && filename  && filePath){
                        console.log('reload : ' + pluginId);
                        plugins.reload(pluginId, app);
                    }
                }
            });
        }

    });
}*/

function doProcess(app) {
    Debug._l("Dev file watcher installed");
    var pluginsHomePath = utils.getRootPath() + "/plugins/";
//    Debug._l(pluginsHomePath);
    var allPlugins = plugins.getAll();

    Object.keys(allPlugins).forEach(function (pluginId) {
        var plugin = allPlugins[pluginId];

        var pluginPath = pluginsHomePath + pluginId + "/";
//        Debug._l(pluginPath + pluginId);
        /*fs.readdir(pluginPath, function (err, files) {
//            Debug._l("pl: id : " + pluginId);
//            Debug._l(files);
            watchPluginFile(pluginId, pluginPath, files, app);
        });*/

        var watch = Watcher(pluginPath, function (filePath, isModified, isDeleted) {
            //only reload plugin when change in server js files
            if(!utils.contains(filePath, "/client/") || !utils.contains(filePath, "/views/")){
                Debug._l(filePath);
                if (isModified || isDeleted) {
                    Debug._l('reload : ' + pluginId);
                    plugins.reload(pluginId, app);
                }
            }
        });
    });


    /*fs.readdir(pluginPath, function(err, files){
     Debug._l(files);
     });*/

}

exports.init = function (app) {
    app.configure('development', function () {
        doProcess(app);
    });

};
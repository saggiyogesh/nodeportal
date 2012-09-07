var fs = require("fs"), path = require("path"), plugins = require("../plugins"), setCache = require("./Cache").set;


function regenerateCache(pluginId, pluginJSFilePath) {
    fs.readFile(pluginJSFilePath, 'utf8', function (err, data) {
        if (err) {
            Debug._l("err: " + err);
            return;
        }
        fs.stat(pluginJSFilePath, function (err, stat) {
            setCache(pluginId, {modified :stat.mtime, content:data });
        });
    });
}
function addWatcher(pluginid, pluginJSFilePath) {
    fs.watchFile(pluginJSFilePath, function (curr, prev) {
//        console.log('the current mtime is: ' + curr.mtime);
//        console.log('the previous mtime was: ' + prev.mtime);

        regenerateCache(pluginid, pluginJSFilePath);
    });
}
exports.init = function (app) {
    var pluginsHome = app.set('appPath') + "/plugins";
    var allPlugins = plugins.getAll();
    Object.keys(allPlugins).forEach(function (pluginid) {
        var pluginJSFilePath = pluginsHome + "/" + pluginid + "/client/" + pluginid + ".js";
        var exists = path.exists || fs.exists;
        exists(pluginJSFilePath, function (exists) {
            if (exists) {
                regenerateCache(pluginid, pluginJSFilePath);
                addWatcher(pluginid, pluginJSFilePath);
            }
            /*else{
                Debug._l("Not found: " + pluginJSFilePath);
            }*/
        });
    });
};


/***
 * Library used to add plugin in theme.
 * Performance tips plugin included should be async one, if taking time for processing
 */
//TODO not finished
var plugins = require("../plugins");
exports.include = function(req, id){
    var plugin = plugins.get(id);
    var ajaxTMPL = "<div id='" + pluginId_iID + "' />";

}

/**
 * permission mapping of each resource
 */

/**
 * These are related to plugin's permission rendered on page
 * So unique id should be given combining pageId with pluginId
 * Values are "VIEW"
 */
/*var PluginPermissions = exports.PluginPermissions = {

};*/

var permissionProcessor = require("./PermissionDefinitionProcessor");
//exports.ActionKeys = permissionProcessor.PermissionActions;
exports.ActionKeys = {};
permissionProcessor.PermissionActions.forEach(function(key){
    exports.ActionKeys.__defineGetter__(key, function(){
         return key;
    });
});

    //exports.ActionKeys = {};
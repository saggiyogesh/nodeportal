/**
 * If cache is absent, then its added.
 * If model is deleted then cache is also deleted
 * If model is updated then only cache is updated
 *
 * since every model will have a unique counter, no need to distinguish by schema name
 */
var PermissionsCache = {};

exports.add = function(permObj){
    var key = permObj["modelId"], rolePermissions = permObj["rolePermissions"];
    if(!key){
        Debug.l("modelId not found");
        return;
    }

    if(!rolePermissions){
        Debug.l("Role Permissions not found");
        return;
    }

    PermissionsCache[key] = rolePermissions;
};

exports.get = function(modelId){
    if(!modelId){
        Debug.l("modelId not found");
        return;
    }

    return PermissionsCache[modelId];
};

var hasKey = exports.hasKey = function(modelId){
  return PermissionsCache.hasOwnProperty(modelId);
};

exports.remove = function(modelId){
    if(hasKey(modelId))
        delete PermissionsCache[modelId];
};
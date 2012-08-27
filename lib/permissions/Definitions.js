/**
 * Model CRUD operations related permissions. Specific to DB
 * Values are "ADD", "UPDATE", "VIEW", "DELETE"
 *
 * @ Not used - can be deleted
 */
var ModelPermissions = exports.ModelPermissions = {
    "model.PageSchema":{
        permissions:["VIEW", "ADD", "UPDATE", "DELETE"], //all permissions for this model
        guest:["VIEW"], //permission given to guest
        user :["VIEW"]  //permission given to user
    }

};
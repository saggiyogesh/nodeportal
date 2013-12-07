module.exports = {
    Actions: ["ADD", "VIEW", "UPDATE", "DELETE", "ADD_PLUGIN", "REMOVE_PLUGIN"],
    ModelPermissions: {
        //permission for each record
        "model.pageSchema.Page": {
            permissions: ["VIEW", "UPDATE", "DELETE", "ADD_PLUGIN", "REMOVE_PLUGIN"], //all permissions for this model
            guest: ["VIEW"], //permission given to guest
            user: ["VIEW"]  //permission given to user
        },
        "model.pageSchema": {
            permissions: ["ADD"] //all permissions for this model
        }
    }
};
module.exports = {
    Actions: ["ADD", "VIEW", "UPDATE", "DELETE"],
    ModelPermissions: {
        "model.resourceSchema.Resource": {
            permissions: ["VIEW", "UPDATE", "DELETE"], //all permissions for this model
            guest: ["VIEW"], //permission given to guest
            user: ["VIEW"]  //permission given to user
        },
        "model.resourceSchema": {
            permissions: ["ADD"] //all permissions for this model
        }
    }
};
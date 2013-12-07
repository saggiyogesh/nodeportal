module.exports = {
    Actions: ["ADD", "VIEW", "UPDATE", "DELETE"],
    ModelPermissions:{
        "model.articleSchema.Article": {
            permissions: ["VIEW", "UPDATE", "DELETE"], //all permissions for this model
            guest: ["VIEW"], //permission given to guest
            user: ["VIEW"]  //permission given to user
        },
        "model.articleSchema": {
            permissions: ["ADD"], //will handle add folder and upload a file
            user: ["VIEW"]
        }
    }
};
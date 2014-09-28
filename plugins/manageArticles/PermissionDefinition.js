module.exports = {
    Actions: ["ADD", "VIEW", "UPDATE", "DELETE", "ADD_DISCUSSION", "EDIT_DISCUSSION", "DELETE_DISCUSSION"],
    ModelPermissions:{
        "model.articleSchema.Article": {
            permissions: ["VIEW", "UPDATE", "DELETE",
                "ADD_DISCUSSION", "EDIT_DISCUSSION", "DELETE_DISCUSSION"
            ], //all permissions for this model
            guest: ["VIEW"], //permission given to guest
            user: ["VIEW", "ADD_DISCUSSION"]  //permission given to user
        },
        "model.articleSchema": {
            permissions: ["ADD"], //will handle add folder and upload a file
            user: ["ADD"] //user role will have add permission
        }
    }
};
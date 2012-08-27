module.exports = {
    ModelPermissions:{
        "model.ArticleSchema":{
            permissions:["VIEW", "ADD", "UPDATE", "DELETE"], //all permissions for this model
            guest:["VIEW"], //permission given to guest
            user:["VIEW","ADD"]  //permission given to user
        }
    }
};
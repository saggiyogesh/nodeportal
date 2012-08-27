module.exports = {
    ModelPermissions:{
        "model.ResourceSchema":{
            permissions:["VIEW", "ADD", "UPDATE", "DELETE"], //all permissions for this model
            guest:["VIEW"], //permission given to guest
            user:["VIEW"]  //permission given to user
        }
    }
};
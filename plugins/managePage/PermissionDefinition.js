module.exports = {
    ModelPermissions:{
        "model.PageSchema":{
            permissions:["VIEW", "ADD", "UPDATE", "DELETE"], //all permissions for this model
            guest:["VIEW"], //permission given to guest
            user:["VIEW"]  //permission given to user
        }
    }
};
/**
 * Template file for Model Schema
 * 
 * replace "permissionActionSchema" by schema object like "roleSchema" and "Default" by Schema name like "Role"
 */

var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var permissionActionSchema = new Schema({
    permissionActionId: { type: Number, unique: true} ,
    name: String ,
    resourceId : { type: Number, index: true} ,
    userId : Number,
    rolePermissions: {}
});



permissionActionSchema.statics.findByPermissionActionId = function (permissionActionId, callback) {
    return this.findOne({ "permissionActionId": permissionActionId }, callback);
};

//
//permissionActionSchema.statics.findByName = function (name, callback) {
//    return this.findOne({ "name": name }, callback);
//};

permissionActionSchema.statics.findByResourceId = function (resourceId, callback) {
    return this.findOne({ "resourceId": resourceId }, callback);
};

module.exports = mongoose.model('PermissionAction', permissionActionSchema);

/**
 * PermissionEntries Schema
 */

var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var permissionEntriesSchema = new Schema({
    permissionEntriesId: { type: Number, unique: true} ,
    name: { type: String, unique: true} ,
    permissions :{},
    rolePermissions :{}
});



permissionEntriesSchema.statics.findByPermissionEntriesId = function (permissionEntriesId, callback) {
    return this.findOne({ "permissionEntriesId": permissionEntriesId }, callback);
};


permissionEntriesSchema.statics.findByName = function (name, callback) {
    return this.findOne({ "name": name }, callback);
};


module.exports = mongoose.model('PermissionEntries', permissionEntriesSchema);

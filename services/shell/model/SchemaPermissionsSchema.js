/**
 *   Processed rolePermission with bitwise value of all action with roles per schema
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var schemaPermissionsSchema = new Schema({
    schemaPermissionsId: { type: Number, unique: true},
    permissionSchemaKey: { type: String, unique: true},  //schema key defined in permissions definition file
    actionsValue: {}, //  saving action value for parsed permissions, bit value of each action
    rolePermissions: {}
});


schemaPermissionsSchema.statics.findByPermissionSchemaKey = function (permissionSchemaKey, callback) {
    return this.findOne({ "permissionSchemaKey": permissionSchemaKey }, callback);
};


module.exports = mongoose.model('SchemaPermissions', schemaPermissionsSchema);

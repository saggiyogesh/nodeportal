/**
 * Schema used to save permissions actions key with their calculated bitwise value for
 * not used
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var PermissionsActionsSchema = new Schema({
    schemaKey: String, //schema key defined in permissions definition file
    actionKey: String, // VIEW, UPDATE, DELETE etc
    bitValue: Number // calculated bitwise value by permission processor respective to schemaId
});


PermissionsActionsSchema.statics.findByDefaultId = function (defaultId, callback) {
    return this.findOne({ "defaultId": defaultId }, callback);
};


module.exports = mongoose.model('PermissionsActions', PermissionsActionsSchema);

/**
 * Schema used to save schema with unique key
 * Used to save Keys of ModelPermissions in PermissionDefinition(ie. model.pageSchema, model.pageSchema.Page etc)
 */

var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var schemaEntriesSchema = new Schema({
    schemaId: { type: Number, unique: true} ,
    name: String
});




module.exports = mongoose.model('SchemaEntries', schemaEntriesSchema);

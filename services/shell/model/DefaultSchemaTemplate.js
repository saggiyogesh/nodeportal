/**
 * Template file for Model Schema
 * 
 * Model name is Default, that can be changed to required table name
 *
 * replace "defaultSchema" by schema object like "roleSchema" and "Default" by Schema name like "Role"
 */

var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var defaultSchema = new Schema({
    defaultId: { type: Number, unique: true} ,
    field1: String
});



defaultSchema.statics.findByDefaultId = function (defaultId, callback) {
    return this.findOne({ "defaultId": defaultId }, callback);
};


module.exports = mongoose.model('Default', defaultSchema);

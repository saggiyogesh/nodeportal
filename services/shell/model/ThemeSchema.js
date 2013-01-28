/**
 * 
 */

var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var themeSchema = new Schema({
    themeId: { type: Number, unique: true} ,
    name : { type: String, unique: true },
    path: String
});



themeSchema.statics.findByThemeId = function (themeId, callback) {
    return this.findOne({ "themeId": themeId }, callback);
};

themeSchema.statics.findByName = function (name, callback) {
    return this.findOne({ "name": name }, callback);
};

themeSchema.statics.getAll = function(callback){
    return this.find({}, callback);
};

themeSchema.statics.getAllExceptDefault = function(callback){
    return this.find({ name : { $ne : "Default" } }, callback);
};

module.exports = mongoose.model('Theme', themeSchema);
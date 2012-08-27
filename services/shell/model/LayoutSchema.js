/**
 * 
 */

var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var layoutSchema = new Schema({
    layoutId: { type: Number, unique: true } ,
    name : { type: String, unique: true },
    path: String,
    placeHolderNames: Array
});



layoutSchema.statics.findByLayoutId = function (layoutId, callback) {
    return this.findOne({ "layoutId": layoutId }, callback);
};

layoutSchema.statics.findByName = function (name, callback) {
    return this.findOne({ "name": name }, callback);
};

module.exports = mongoose.model('Layout', layoutSchema);
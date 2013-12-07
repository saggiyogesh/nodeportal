/**
 *
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var layoutSchema = new Schema({
    layoutId: { type: Number, unique: true },
    name: { type: String, unique: true },
    path: String,
    placeHolderNames: Array
});


layoutSchema.statics.findByLayoutId = function (layoutId, callback) {
    return this.findOne({ "layoutId": layoutId }, callback);
};

layoutSchema.statics.findByName = function (name, callback) {
    return this.findOne({ "name": name }, callback);
};

layoutSchema.statics.getAllExceptDefaults = function (callback) {
    return this.find({$and: [
        { name: { $ne: "2-col-70-30" } },
        { name: { $ne: "1-col" } }
    ]}, callback);
};

layoutSchema.statics.getDefault = function (callback) {
    return this.findOne({ "name": "2-col-70-30" }, callback);
};

layoutSchema.statics.getOneCol = function (callback) {
    return this.findOne({ "name": "1-col" }, callback);
};

module.exports = mongoose.model('Layout', layoutSchema);
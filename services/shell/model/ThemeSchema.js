/**
 *
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var themeSchema = new Schema({
    themeId: { type: Number, unique: true},
    name: { type: String, unique: true },
    type: {type: String, default: "page"}, //settings or page
    path: String
});


themeSchema.statics.findByThemeId = function (themeId, callback) {
    return this.findOne({ "themeId": themeId }, callback);
};

themeSchema.statics.findByName = function (name, callback) {
    return this.findOne({$and:[{ "name": name },{type: "page"} ]}, callback);
};

themeSchema.statics.getAll = function (callback) {
    return this.find({}, callback);
};

themeSchema.statics.getAllPageType = function (callback) {
    return this.find({type: "page"}, callback);
};

themeSchema.statics.getAllExceptDefault = function (callback) {
    return this.find({$and:[{ name: { $ne: "Default" } }, {type: "page"}]}, callback);
};

themeSchema.statics.getDefault = function (callback) {
    return this.findOne({$and:[{ name: "Default" }, {type: "page"}]}, callback);
};

themeSchema.statics.getDefaultSettingsTheme = function (callback) {
    return this.findOne({$and:[{ "name": "Settings" },{type: "settings"} ]}, callback);
};


module.exports = mongoose.model('Theme', themeSchema);
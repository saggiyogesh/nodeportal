/**
 * Schema for articles
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var articleSchema = new Schema({
    articleId: { type: Number, unique: true},
    id: Number, //this id is used as for many versions of same article, this id will be same
    localizedTitle: {},
    localizedContent: {},
    displayDate: Date,
    expiryDate: Date,
    version: Number,
    createDate: Date,
    updateDate: Date,
    isExpired: { type: Boolean, "default": false },

//    compulsory fields for permissions
    userId: Number,
    userName: String,
    rolePermissions: {}
});


articleSchema.statics.findByArticleId = function (articleId, callback) {
    return this.findOne({ "articleId": articleId }, callback);
};

articleSchema.statics.findById = function (id, callback) {
    return this.findOne({ "id": id }, callback);
};

articleSchema.statics.findByIdAndVersion = function (id, version, callback) {
    return this.findOne({ "id": id, "version": version}, callback);
};

articleSchema.pre('save', function (next) {
    if (this.isNew) {
        this.createDate = Date.now();
    }
    this.displayDate = this.displayDate || Date.now();
    this.updateDate = this.updateDate || Date.now();

    next();
});


module.exports = mongoose.model('Article', articleSchema);

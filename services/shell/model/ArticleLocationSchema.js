/**
 * Schema for article locations.
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var articleLocationSchema = new Schema({
    articleLocationId: { type: Number, unique: true},
    namespace: {type: String, required: true },
    pageId: {type: Number, required: true },
    id: {type: Number, required: true } //id of article
});


articleLocationSchema.statics.findByArticleLocationId = function (articleLocationId, callback) {
    return this.findOne({ "articleLocationId": articleLocationId }, callback);
};

articleLocationSchema.statics.findById = function (id, callback) {
    return this.find({ "id": id }, callback);
};

articleLocationSchema.statics.findByPageIdAndNamespace = function (pageId, namespace, callback) {
    return this.findOne({ "pageId": pageId, "namespace": namespace }, callback);
};

articleLocationSchema.statics.findByPageIdAndNamespaceAndId = function (pageId, namespace, id, callback) {
    return this.findOne({ "pageId": pageId, "namespace": namespace, "id": id}, callback);
};

module.exports = mongoose.model('ArticleLocation', articleLocationSchema);

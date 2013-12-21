/**
 * Schema to store message threads
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var ThreadSchema = new Schema({
    threadId: { type: Number, unique: true},
    linkedModelId: Number,
    linkedModelName: String,
    linkedPermissionSchemaKey: String,
    linkedModelPK: Number

});


ThreadSchema.statics.findByThreadId = function (threadId, callback) {
    return this.findOne({ "threadId": threadId }, callback);
};

ThreadSchema.statics.findByLinkedModelIdAndLinkedModelName = function (linkedModelId, linkedModelName, callback) {
    return this.findOne({ "linkedModelId": linkedModelId, "linkedModelName": linkedModelName }, callback);
};


module.exports = mongoose.model('Thread', ThreadSchema);
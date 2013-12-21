/**
 * Stores comments related to thread
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var CommentSchema = new Schema({
    commentId: { type: Number, unique: true},
    threadId: Number,
    parentCommentId: { type: Number, "default": 0 },
    authorId: Number,
    content: String,
    createDate: Date,
    updateDate: Date

});

CommentSchema.pre('save', function (next) {
    if (this.isNew) {
        this.createDate = Date.now();
    }
    this.updateDate = Date.now();
    next();
});


CommentSchema.statics.findByCommentId = function (commentId, callback) {
    return this.findOne({ "commentId": commentId }, callback);
};

CommentSchema.statics.findByParentCommentId = function (parentCommentId, callback) {
    return this.find({ "parentCommentId": parentCommentId }, callback);
};

CommentSchema.statics.findByThreadId = function (threadId, callback) {
    return this.find({ "threadId": threadId }, callback);
};


module.exports = mongoose.model('Comment', CommentSchema);

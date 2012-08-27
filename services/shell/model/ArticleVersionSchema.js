/**
 * Schema for articles
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var articleVersionSchema = new Schema({
    articleId:{ type:Number, unique:true},
    id:Number, //this id is used as for many versions of same article, this id will be same
    localizedTitle:{},
    localizedContent:{},
    displayDate:Date,
    expiryDate:Date,
    version:Number,
    createDate:Date,
    updateDate:Date,
    isExpired:{ type:Boolean, "default":false },

//    compulsory fields for permissions
    userId:Number,
    userName:String,
    rolePermissions:{}
});


articleVersionSchema.statics.findByArticleId = function (articleId, callback) {
    return this.findOne({ "articleId":articleId }, callback);
};

articleVersionSchema.statics.findById = function (id, callback) {
    return this.find({ "id":id }, callback);
};

articleVersionSchema.statics.findByIdAndVersion = function (id, version, callback) {
    return this.findOne({ "id":id, "version":version}, callback);
};

articleVersionSchema.pre('save', function (next) {
    if (this.isNew) {
        this.createDate = Date.now();
    }
    this.displayDate = this.displayDate || Date.now();
    this.updateDate = this.updateDate || Date.now();

    next();
});


module.exports = mongoose.model('ArticleVersion', articleVersionSchema);

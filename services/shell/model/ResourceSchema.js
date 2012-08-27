var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var resourceSchema = new Schema({
    resourceId:{ type:Number, unique:true},
    name:String,
    type:String,
    size:{ type:Number, "default":0 },
    createDate:Date,
    updateDate:Date,
    folderId:{ type:Number, "default":0 },
    description:String,
    dimensions:String,
    extras:{},

    //compulsory fields for permissions
    userId:Number,
    userName:String,
    rolePermissions:{}
});

resourceSchema.pre('save', function (next) {
    if (this.isNew) {
        this.createDate = Date.now();
    }
    this.updateDate = Date.now();
    next();
});

resourceSchema.statics.findByResourceId = function (resourceId, callback) {
    return this.findOne({ "resourceId":resourceId }, callback);
};

resourceSchema.statics.findByNameAndFolderId = function (name, folderId, callback) {
    return this.findOne({ "name":name, folderId:folderId }, callback);
};

resourceSchema.statics.findByFolderId = function (folderId, callback) {
    return this.find({ "folderId":folderId }, callback);
};


module.exports = mongoose.model('Resource', resourceSchema);

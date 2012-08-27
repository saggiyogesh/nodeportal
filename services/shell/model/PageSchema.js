/**
 *
 */

var mongoose = require('mongoose'), Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var pageSchema = new Schema({
    pageId:{
        type:Number,
        unique:true
    },
    layoutId:Number,
    themeId:Number,
    friendlyURL:{
        type:String,
        unique:true
    },
    localizedName:{},
    data:{},
    parentPageId:{ type:Number, "default":0 },
    order:{ type:Number, "default":0 },
    isIndex:{ type:Boolean, "default":false },
    isHidden:{ type:Boolean, "default":false },
    description:String,
    keywords:String,
    createDate:Date,
    updateDate:Date,

    //compulsory fields for permissions
    userId:Number,
    userName:String,
    rolePermissions:{}
});

pageSchema.pre('save', function (next) {
    if (this.isNew) {
        this.createDate = Date.now();
    }
    this.updateDate = Date.now();
    var url = this.friendlyURL;
    if (url.charAt(0) != '/') {
        this.friendlyURL = "/" + url;
    }

    if (!this.data) {
        this.data = {};
    }
    next();
});


pageSchema.statics.findByPageId = function (pageId, callback) {
    return this.findOne({
        "pageId":pageId
    }, callback);
};

pageSchema.statics.findByFriendlyURL = function (friendlyURL, callback) {
    return this.findOne({
        "friendlyURL":friendlyURL
    }, callback);
};

// function plugin(schema, options) {
// var i = require("util").inspect;
// console.log(i("plugin>>"));
// console.log(i(schema));
// console.log(i(options));
// }
//
// pageSchema.plugin(plugin);
module.exports = mongoose.model('Page', pageSchema);
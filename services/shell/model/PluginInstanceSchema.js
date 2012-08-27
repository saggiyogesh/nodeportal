/**
 * Schema for saving plugin instance
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var pluginInstanceSchema = new Schema({
    pluginInstanceId:{ type:Number, unique:true},
    pluginNamespace:String,
    pageId:Number,
    title : {},
    settings:{},

    //    compulsory fields for permissions
    userId:Number,
    userName:String,
    rolePermissions:{}
});


pluginInstanceSchema.statics.findByPluginInstanceId = function (pluginInstanceId, callback) {
    return this.findOne({ "pluginInstanceId":pluginInstanceId }, callback);
};

pluginInstanceSchema.statics.findByPluginNamespaceAndPageId = function (pluginNamespace, pageId, callback) {
    return this.findOne({ "pluginNamespace":pluginNamespace, "pageId":pageId}, callback);
}
module.exports = mongoose.model('PluginInstance', pluginInstanceSchema);

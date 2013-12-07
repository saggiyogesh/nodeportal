/**
 * Role Schema
 *
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
//    , ObjectId = Schema.ObjectId;

var roleSchema = new Schema({
    roleId: { type: Number, unique: true},
    name: { type: String, unique: true},
    description: String
});


roleSchema.statics.findByRoleId = function (roleId, callback) {
    return this.findOne({ "roleId": roleId }, callback);
};


roleSchema.statics.findByName = function (name, callback) {
    return this.findOne({ "name": name }, callback);
};

roleSchema.statics.getAll = function (callback) {
    return this.find({ }, callback);
};


roleSchema.statics.getGuestRole = function (callback) {
    return this.findOne({ "name": 'Guest' }, callback);
};

roleSchema.statics.getAdministratorRole = function (callback) {
    return this.findOne({ "name": 'Administrator' }, callback);
};

module.exports = mongoose.model('Role', roleSchema);

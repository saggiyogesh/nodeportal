/**
 * User Schema
 */


var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var userSchema = new Schema({
    userId: { type: Number, unique: true},
    userName: { type: String, index: true },
    firstName: String,
    middleName: String,
    lastName: String,
    passwordEnc: String,
    emailId: { type: String, index: true },
    phoneNo: { type: String, index: true },
    dob: { type: Date},
    gender: {type: String, default: ""},
    roles: [],
    active: Boolean,
    createDate: Date,
    updateDate: Date,
    "default": { type: Boolean, default: false },
    /**
     * properties of profilePic:
     *      gravatar {String} gravatar hash
     *      uploaded {Boolean} if image is uploaded by user
     */
    profilePic: {type: Object, default: {}},
    address: {},
    telNos: {},
    notifications: {type: Object, default: {}}
});

userSchema.pre('save', function (next) {
    if (this.isNew) {
        this.createDate = Date.now();
    }
    this.updateDate = Date.now();
    next();
});

userSchema.statics.findByUserId = function (userId, callback) {
    return this.findOne({ "userId": userId }, callback);
};

userSchema.statics.findByUserName = function (userName, callback) {
    return this.findOne({ "userName": userName }, callback);
};

userSchema.statics.findByEmailId = function (emailId, callback) {
    return this.findOne({ "emailId": emailId }, callback);
};

userSchema.statics.findByPhoneNo = function (phoneNo, callback) {
    return this.findOne({ "phoneNo": phoneNo }, callback);
};

userSchema.statics.getDefaultUser = function (callback) {
    return this.findOne({"default": true}, callback);
};

//virtuals
userSchema.virtual('fullName').get(function () {
    return this.firstName + ' ' + this.lastName;
});


userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
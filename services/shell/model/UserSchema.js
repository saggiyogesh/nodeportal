/**
 * User Schema
 */


var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var userSchema = new Schema({
    userId: { type: Number, unique: true},
    userName: { type: String, unique: true},
    firstName: String,
    middleName: String,
    lastName: String,
    passwordEnc: String,
    emailId: { type: String, unique: true },
    phoneNo: { type: String},
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
     *      url {URL} Profile picture url of OAuth login account
     */
    profilePic: {type: Object, default: {}},
    address: {},
    telNos: {},
    notifications: {type: Object, default: {}},
    /**
     * This will save the unique id provided by oauth login.
     * properties:
     *      accountName {String}: oauth account name (like google, facebook etc)
     *      data {Object}: oauth user data fetched after login
     * @see AppProperties.ENABLED_LOGIN_ACCOUNTS
     */
    oauthInfo: {}
});

userSchema.pre('save', function (next) {
    if (this.isNew) {
        this.createDate = Date.now();
        //auto creating username from emailId
        this.userName = this.userName || this.emailId;
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
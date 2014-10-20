module.exports = {
    name: "User",
    base: "PersistedModel",
    properties: {
        userId: { type: Number, id: true},
        userName: { type: String, required: true, index: {unique: true}},
        firstName: { type: String, required: true},
        middleName: String,
        lastName: { type: String, required: true},
        passwordEnc: { type: String, required: true},
        emailId: { type: String, required: true, index: {unique: true}},
        phoneNo: { type: String},
        dob: { type: Date, required: true},
        gender: {type: String, default: ""},
        roles: Array,
        active: Boolean,
        createDate: {type: Date, default: Date.now()},
        updateDate: {type: Date, default: Date.now()},
        "default": { type: Boolean, default: false },
        /**
         * properties of profilePic:
         *      gravatar {String} gravatar hash
         *      uploaded {Boolean} if image is uploaded by user
         *      url {URL} Profile picture url of OAuth login account
         */
        profilePic: {type: Object, default: {}},
        address: Object,
        telNos: Object,
        notifications: {type: Object, default: {}},
        /**
         * This will save the unique id provided by oauth login.
         * properties:
         *      accountName {String}: oauth account name (like google, facebook etc)
         *      data {Object}: oauth user data fetched after login
         * @see AppProperties.ENABLED_LOGIN_ACCOUNTS
         */
        oauthInfo: Object
    },
    finders: {
        getByUserName: {
            arguments: ["userName"],
            query: {where: {"userName": "_userName"} },
            method: "findOne"
        },
        getByEmailId: {
            arguments: ["emailId"],
            query: {where: {"emailId": "_emailId"} },
            method: "findOne"
        },
        getByPhoneNo: {
            arguments: ["phoneNo"],
            query: {where: {"phoneNo": "_phoneNo"} },
            method: "findOne"
        },
        getDefaultUser: {
            query: {where: {"default": true} },
            method: "findOne"
        }
    }
};
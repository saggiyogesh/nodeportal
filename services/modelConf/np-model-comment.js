module.exports = {
    name: "Article",
    base: "PersistedModel",
    properties: {
        articleId: { type: Number, id: true},
        id: Number, //this id is used as for many versions of same article, this id will be same
        localizedTitle: String,
        localizedContent: String,
        displayDate: Date, default: Date.now(),
        expiryDate: Date, default: Date.now(),
        version: Number,
        createDate: Date,
        updateDate: Date,
        isExpired: { type: Boolean, "default": false },

//    compulsory fields for permissions
        userId: Number,
        userName: String,
        rolePermissions: {}
    },
    finders: {
        getById: {
            arguments: ["id"],
            query: {where: {id: "_id"} },
            method: "find",
            pagination: true
        },
        getByIdAndVersion: {
            arguments: ["id","version"],
            query: {where: {id: "_id", version: "_version"} },
            method: "find",
            pagination: true
        }
    }
};
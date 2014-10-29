module.exports = {
    name: "Article",
    base: "PersistedModel",
    properties: {
        articleId: { type: Number, id: true},
        id: Number, //this id is used as for many versions of same article, this id will be same
        localizedTitle: Object,
        localizedContent: Object,
        version: Number,
        displayDate: {type: Date, default: Date.now()},
        expiryDate: Date,
        createDate: {type: Date, default: Date.now()},
        updateDate: {type: Date, default: Date.now()},
        isExpired: { type: Boolean, "default": false },

//    compulsory fields for permissions
        userId: { type: Number, required: true },
        userName: { type: String, required: true },
        rolePermissions: Object
    },
    finders: {
        getById: {
            arguments: ["id"],
            query: {where: {id: "_id"} },
            method: "findOne"
        },
        getByIdAndVersion: {
            arguments: ["id", "version"],
            query: {where: {id: "_id", version: "_version"} },
            method: "findOne"
        }
    },
    auth: true
};
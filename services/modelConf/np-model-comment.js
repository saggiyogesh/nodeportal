module.exports = {
    name: "Comment",
    base: "PersistedModel",
    properties: {
        commentId: { type: Number, unique: true},
        threadId: Number,
        parentCommentId: { type: Number, "default": 0 },
        authorId: Number,
        content: String,
        createDate: {type: Date, default: Date.now()},
        updateDate: {type: Date, default: Date.now()},

//    compulsory fields for permissions
        userId: Number,
        userName: String,
        rolePermissions: {}
    },
    finders: {
        getById: {
            arguments: ["id"],
            query: {where: {id: "_id"} },
            method: "find"
        },
        getByIdAndVersion: {
            arguments: ["id", "version"],
            query: {where: {id: "_id", version: "_version"} },
            method: "find"
        }
    }
};
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
        getByParentCommentId: {
            arguments: ["parentCommentId"],
            query: {where: {parentCommentId: "_parentCommentId"} }
        },
        getByThreadId: {
            arguments: ["threadId"],
            query: {where: {threadId: "_threadId"}, sort: "createDate ASC" }
        }
    }
};
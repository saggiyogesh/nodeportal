module.exports = {
    name: "Resource",
    base: "PersistedModel",
    properties: {
        resourceId: { type: Number, id: true},
        name: {type: String, required: true},
        type: {type: String, required: true},
        size: { type: Number, "default": 0 },
        createDate: {type: Date, default: Date.now()},
        updateDate: {type: Date, default: Date.now()},
        folderId: { type: Number, "default": 0 },
        description: String,
        dimensions: String,
        extras: String,

        //compulsory fields for permissions
        userId: Number,
        userName: String,
        rolePermissions: {}
    },
    finders: {
        getByNameAndFolderId: {
            arguments: ["name", "folderId"],
            query: {where: { name: "_name", folderId: "_folderId"} },
            method: "find"
        },
        getByFolderId: {
            arguments: ["folderId"],
            query: {where: {folderId: "folderId"} },
            method: "find"
        }
    }
};
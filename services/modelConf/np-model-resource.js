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
        extras: Object,

        //compulsory fields for permissions
        userId: { type: Number, required: true },
        userName: { type: String, required: true },
        rolePermissions: Object
    },
    finders: {
        getByNameAndFolderId: {
            arguments: ["name", "folderId"],
            query: {where: { name: "_name", folderId: "_folderId"} }
        },
        getByFolderId: {
            arguments: ["folderId"],
            query: {where: {folderId: "folderId"} }
        }
    },
    auth: true
};
module.exports = {
    name: "Role",
    base: "PersistedModel",
    properties: {
        roleId: { type: Number, id: true},
        name: { type: String, required: true, index: {unique: true} },
        description: String
    },
    finders: {
        getByName: {
            arguments: ["name"],
            query: {where: {name: "_name"} },
            method: "findOne"
        },
        getByIdAndVersion: {
            arguments: ["id", "version"],
            query: {where: {id: "_id", version: "_version"} },
            method: "find"
        }
    }
};
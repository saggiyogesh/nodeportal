module.exports = {
    name: "Role",
    base: "PersistedModel",
    properties: {
        roleId: { type: Number, id: true},
        name: { type: String, required: true, index: {unique: true} },
        description: String
    },
    finders: {
        getGuestRole: {
            query: {where: {name: "Guest"} },
            method: "findOne"
        },
        getAdministratorRole: {
            query: {where: {name: "Administrator"} },
            method: "findOne"
        },
        getAll: {
        },
        getByName: {
            arguments: ["name"],
            query: { where: {name: "_name"}},
            method: "findOne"
        }
    }
};
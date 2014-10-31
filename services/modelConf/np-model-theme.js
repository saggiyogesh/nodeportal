module.exports = {
    name: "Theme",
    base: "PersistedModel",
    properties: {
        themeId: { type: Number, id: true},
        name: { type: String, required: true, index: {unique: true} },
        type: {type: String, default: "page"}, //settings or page
        path: String
    },
    finders: {
        getDefault: {
            query: {where: {name: "Default", type: "page"} },
            method: "findOne"
        },
        getByName: {
            arguments: ["name"],
            query: {where: {name: "_name", type: "page"} },
            method: "findOne"
        },
        getAllExceptDefault: {
            query: {where: { name: { neq: "Default" }, type: "page"}}
        },
        getAll: {
        },
        getDefaultSettingsTheme: {
            query: {where: { name: "Settings", type: "settings"}},
            method: "findOne"
        },
        getAllPageType: {
            query: {where: { type: "page"}}
        }
    }
};
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
            arguments: [],
            query: {where: {name: "Default", type: "page"} },
            method: "findOne"
        },
        getByName: {
            arguments: ["name"],
            query: {where: {name: "_name", type: "page"} },
            method: "findOne"
        },
        getAllExceptDefault: {
            arguments: [],
            query: {where: { name: { neq: "2-col-70-30" }, type: "page"}},
            method: "find"
        },
        getAll: {
            arguments: [],
            query: {},
            method: "find"
        },
        getDefaultSettingsTheme: {
            arguments: [],
            query: {where: { name: "Settings", type: "page"}},
            method: "find"
        },
        getAllPageType: {
            arguments: [],
            query: {where: { type: "page"}},
            method: "find"
        }
    }
};
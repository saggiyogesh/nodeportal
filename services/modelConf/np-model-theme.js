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
            query: {where: { name: { neq: "2-col-70-30" }, type: "page"}}
        },
        getAll: {
        },
        getDefaultSettingsTheme: {
            query: {where: { name: "Settings", type: "page"}},
        },
        getAllPageType: {
            query: {where: { type: "page"}}
        }
    }
};
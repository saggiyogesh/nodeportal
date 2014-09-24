module.exports = {
    name: "Page",
    base: "PersistedModel",
    properties: {
        pageId: { type: Number, id: true },
        layoutId: {type: Number, required: true},
        themeId: {type: Number, required: true},
        friendlyURL: { type: String, index: {unique: true}, required: true },
        localizedName: { type: String, required: true },
        data: { type: String, required: true },
        parentPageId: { type: Number, "default": 0 },
        order: { type: Number, "default": 0 },
        isIndex: { type: Boolean, "default": false },
        isHidden: { type: Boolean, "default": false },
        description: String,
        keywords: String,
        createDate: {type: Date, default: Date.now()},
        updateDate: {type: Date, default: Date.now()},

        //compulsory fields for permissions
        userId: { type: Number, required: true },
        userName: { type: String, required: true },
        rolePermissions: {}
    },
    finders: {
        getByFriendlyURL: {
            arguments: ["friendlyURL"],
            query: {where: {friendlyURL: "_friendlyURL"} },
            method: "findOne"
        },
        getByLayoutId: {
            arguments: ["layoutId"],
            query: {where: {layoutId: "_layoutId"} },
            method: "find"
        },
        getByThemeId: {
            arguments: ["themeId"],
            query: {where: {themeId: "_themeId"} },
            method: "find"
        }
    }
};
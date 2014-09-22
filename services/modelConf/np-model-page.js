//"np-model-" should be appended before model conf to recognize &
// build services per modelconf in services folder
// watches for this file & update service accordingly
module.exports = {
    "name": "Page",
    "base": "PersistedModel",
    "properties": {
        pageId: { type: Number, id: true },
        layoutId: {type: Number, required: true},
        themeId: {type: Number, required: true},
        friendlyURL: { type: String, index: true, required: true },
        localizedName: { type: String, required: true },
        data: { type: String, required: true },
        parentPageId: { type: Number, "default": 0 },
        order: { type: Number, "default": 0 },
        isIndex: { type: Boolean, "default": false },
        isHidden: { type: Boolean, "default": false },
        description: String,
        keywords: String,
        createDate: { type: Date, required: true },
        updateDate: { type: Date, required: true },

        //compulsory fields for permissions
        userId: { type: Number, required: true },
        userName: { type: String, required: true },
        rolePermissions: {}
    },
    finders: {
        getPagesByThemeId: {
            arguments: ["themeId"], // default []
            query: {where: {model: "$themeId"}, order: "themeId ASC" }, // $model is placeholder to replace the model in code text
            method: "find",  // options : findOne || find ,  default find
            pagination: true // generates methods useful for paging having start & next method, default false
        }
    }
};
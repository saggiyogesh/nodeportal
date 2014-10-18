module.exports = {
    name: "Page",
    base: "PersistedModel",
    properties: {
        pageId: { type: Number, id: true },
        layoutId: {type: Number, required: true},
        themeId: {type: Number, required: true},
        friendlyURL: { type: String, index: {unique: true}, required: true },
        localizedName: { type: Object, required: true },
        data: { type: Object, required: true },
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
        rolePermissions: Object
    },
    finders: {
        getByFriendlyURL: {
            arguments: ["friendlyURL"],
            query: {where: {friendlyURL: "_friendlyURL"} },
            method: "findOne"
        },
        getByLayoutId: {
            arguments: ["layoutId"],
            query: {where: {layoutId: "_layoutId"} }
        },
        getByThemeId: {
            arguments: ["themeId"],
            query: {where: {themeId: "_themeId"} }
        },
        getChildren: {
            arguments: ["parentPageId"],
            query: {where: {parentPageId: "_parentPageId"} }
        },
        getAboveSiblings: {
            arguments: ["parentPageId", "order"],
            query: {
                where: {
                    parentPageId: "_parentPageId",
                    order: {
                        gt:"_order"
                    }
                },
                order: "order ASC"
            }
        },
        getAllPages: {
        }
    },
    auth: true,
    //before hooks
    hooks: {
        create : function (next) {
            var url = this.friendlyURL;
            if (url.charAt(0) != '/') {
                this.friendlyURL = "/" + url;
            }

            if (!this.data) {
                this.data = {};
            }
            next();
        },
        update: function (next) {
            var url = this.friendlyURL;
            if (url.charAt(0) != '/') {
                this.friendlyURL = "/" + url;
            }

            next();
        }
    }
};
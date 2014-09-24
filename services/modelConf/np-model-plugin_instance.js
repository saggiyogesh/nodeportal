module.exports = {
    name: "PluginInstance",
    base: "PersistedModel",
    properties: {
        pluginInstanceId: { type: Number, id: true},
        pluginNamespace: { type: String, required: true},
        pageId: { type: Number, required: true},
        title: String,
        settings: String,

        //    compulsory fields for permissions
        userId: Number,
        userName: String,
        rolePermissions: {}
    },
    finders: {
        getByPluginNamespaceAndPageId: {
            arguments: ["pluginNamespace", "pageId"],
            query: {where: {pluginNamespace: "_pluginNamespace", pageId: "_pageId"} },
            method: "find"
        }
    }
};
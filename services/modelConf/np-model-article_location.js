module.exports = {
    name: "ArticleLocation",
    base: "PersistedModel",
    properties: {
        articleLocationId: { type: Number, id: true},
        namespace: {type: String, required: true },
        pageId: {type: Number, required: true },
        id: {type: Number, required: true } //id of article
    },
    finders: {
        getById: {
            arguments: ["id"], // default []
            query: {where: {id: "_id"} }
        },
        getByPageIdAndNamespace: {
            arguments: ["pageId", "namespace"],
            query: {where: {pageId: "_pageId", namespace: "_namespace"} }
        },
        getByPageIdAndNamespaceAndId: {
            arguments: ["pageId", "namespace", "id"],
            query: {where: {pageId: "_pageId", namespace: "_namespace", id: "_id"} }
        }
    }
};
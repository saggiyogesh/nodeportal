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
            query: {where: {id: "_id"} }, // _model is placeholder to replace the model in code text
            method: "find" // options : findOne || find ,  default find
        },
        getByPageIdAndNamespace: {
            arguments: ["pageId", "namespace"],
            query: {where: {pageId: "_pageId", namespace: "_namespace"} },
            method: "find"
        },
        getByPageIdAndNamespaceAndId: {
            arguments: ["pageId", "namespace", "id"],
            query: {where: {pageId: "_pageId", namespace: "_namespace", id: "_id"} },
            method: "find"
        }
    }
};
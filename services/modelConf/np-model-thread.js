module.exports = {
    name: "Thread",
    base: "PersistedModel",
    properties: {
        threadId: { type: Number, id: true},
        linkedModelId: { type: Number, required: true},
        linkedModelName: { type: String, required: true},
        linkedModelFinderField: { type: String, required: true},
        linkedPermissionSchemaKey: { type: String, required: true},
        linkedModelPK: { type: Number, required: true}
    },
    finders: {
        getByLinkedModelIdAndLinkedModelName: {
            arguments: ["linkedModelId", "linkedModelName"],
            query: {where: { linkedModelId: "_linkedModelId", linkedModelName: "_linkedModelName"} },
            method: "findOne"
        }
    }
};
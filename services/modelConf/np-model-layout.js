module.exports = {
    name: "Layout",
    base: "PersistedModel",
    properties: {
        layoutId: { type: Number, id: true, required: true},
        name: { type: String, required: true, index: {unique: true}},
        path: { type: String, required: true},
        placeHolderNames: { type: String, required: true}
    },
    finders: {
        getDefault: {
            arguments: [],
            query: {where: {name: "2-col-70-30"} },
            method: "findOne"
        },
        getOneCol: {
            arguments: [],
            query: {where: {name: "1-col"} },
            method: "findOne"
        },
        getByName: {
            arguments: ["name"],
            query: {where: {name: "_name"} },
            method: "findOne"
        },
        getAllExceptDefaults: {
            arguments: [],
            query: {where: { and: [
                { name: { neq: "2-col-70-30" } },
                { name: { neq: "1-col" } }
            ]}},
            method: "find"
        }
    }
};
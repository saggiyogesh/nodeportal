module.exports = {
    name: "ArticleVersion",
    base: "Article",
    finders: {
        getById: {
            arguments: ["id"],
            query: {where: {id: "_id"} }
        },
        getByIdAndVersion: {
            arguments: ["id", "version"],
            query: {where: {id: "_id", version: "_version"} },
            method: "findOne"
        }
    }
};
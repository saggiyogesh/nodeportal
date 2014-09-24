module.exports = {
    mysql: require("./MySqlQueryHook"),
    mongodb: require("./MongoDbQueryHook"),
    memory: require("./NoSqlQueryHook")
};
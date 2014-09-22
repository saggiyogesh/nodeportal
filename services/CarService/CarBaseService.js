//generated file
// not modified directly
// modelConf location: TODO real location of car.js
var loopback = require("loopback"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-page.js");


var Car = loopback.createModel(config);


Car.updateById = function updateById(id, data, next) {
    var where = {};
    where[this.getIdName()] = id;
    this.update(where, data, next);
};

//create finders form finders property
Car.getPagesByThemeId = function getPagesByThemeId(themeId, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    // in query $model will be replaced by argument
    this.find({where: {themeId: themeId}, order: "themeId ASC" }, next)
};


//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = Car;
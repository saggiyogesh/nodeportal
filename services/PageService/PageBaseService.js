//generated file
// not modified directly
var loopback = require("loopback"),
DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
config = require(utils.getRootPath() + "/services/modelConf/np-model-page.js");

var Page = loopback.createModel(config);

DAOExtras(Page);

//create finders form finders property
Page.getByFriendlyURL = function getByFriendlyURL(friendlyURL, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"friendlyURL":friendlyURL}}, next);
};


Page.getByLayoutId = function getByLayoutId(layoutId, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"layoutId":layoutId}}, next);
};


Page.getByThemeId = function getByThemeId(themeId, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"themeId":themeId}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = Page;
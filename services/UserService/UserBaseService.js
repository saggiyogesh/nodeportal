//generated file
// not modified directly
var loopback = require("loopback"),
    DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-user.js");

var User = loopback.createModel(config);

DAOExtras(User);

//create finders form finders property
User.getByUserName = function getByUserName(userName, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"userName":userName}}, next);
};


User.getByEmailId = function getByEmailId(emailId, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"emailId":emailId}}, next);
};


User.getByPhoneNo = function getByPhoneNo(phoneNo, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"phoneNo":phoneNo}}, next);
};


User.getDefaultUser = function getDefaultUser( next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.findOne({"where":{"default":true}}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = User;
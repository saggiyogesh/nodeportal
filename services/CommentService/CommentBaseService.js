//generated file
// not modified directly
var loopback = require("loopback"),
    DAOExtras = require(utils.getLibPath() + "/ServicesHelper/DAOExtras"),
    config = require(utils.getRootPath() + "/services/modelConf/np-model-comment.js");

var Comment = loopback.createModel(config);

DAOExtras(Comment);

//create finders form finders property
Comment.getByParentCommentId = function getByParentCommentId(parentCommentId, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"parentCommentId":parentCommentId}}, next);
};


Comment.getByThreadId = function getByThreadId(threadId, next) {   // arguments are defined in arguments property
    //find or findOne will have argument from query
    this.find({"where":{"threadId":threadId},"sort":"createDate ASC"}, next);
};





//TODO build finders with paging, different ways for nosql & sql dbs


module.exports = Comment;
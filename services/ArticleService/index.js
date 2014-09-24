//main service file to be called & used
//custom methods should be written here
// this file is created initially and extending the BaseService Class
// on updating model conf file this file will not generate again

var ArticleBaseService = require("./ArticleBaseService"),
    ArticleServiceAuth = require("./ArticleServiceAuth");

ArticleBaseService.Auth = ArticleServiceAuth;







module.exports = ArticleBaseService;



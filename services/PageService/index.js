//main service file to be called & used
//custom methods should be written here
// this file is created initially and extending the BaseService Class
// on updating model conf file this file will not generate again

var PageBaseService = require("./PageBaseService"),
    PageServiceAuth = require("./PageServiceAuth");

PageBaseService.Auth = PageServiceAuth;







module.exports = PageBaseService;



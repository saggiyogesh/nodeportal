//main service file to be called & used
//custom methods should be written here
// this file is created initially and extending the BaseService Class
// on updating model conf file this file will not generate again

var UserBaseService = require("./UserBaseService"),
    UserServiceAuth = require("./UserServiceAuth");

UserBaseService.Auth = UserServiceAuth;







module.exports = UserBaseService;



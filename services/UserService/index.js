//main service file to be called & used
//custom methods should be written here
// this file is created initially and extending the BaseService Class
// on updating model conf file this file will not generate again

var UserBaseService = require("./UserBaseService");


/**
 * Property to get user's full name
 * @returns {string}
 */
Object.defineProperty(UserBaseService.prototype, "fullName", {
    get: function () {
        return this.firstName + ' ' + this.lastName;
    }
});


module.exports = UserBaseService;



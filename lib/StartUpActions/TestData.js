var DBActions = require("../DBActions"),
    async = require("async"),
    Roles = require('../permissions/Roles'),
    PasswordUtil = require('../PasswordUtil'),
    USER_SCHEMA = "User";

module.exports = function (app, done) {
    return function (next) {
        Debug._l(app.set("db"))
        var userDBAction = DBActions.getInstanceFromApp(app, USER_SCHEMA);
        userDBAction.save({
            userName: "testUser",
            firstName: "testUser",
            lastName: "testUser",
            emailId: "test@nodeportal.com",
            passwordEnc: PasswordUtil.encryptSync("test"),
            roles: [Roles.getUserRole().roleId]

        }, function(){

        });

        userDBAction.save({
            userName: "testUserAdmin",
            firstName: "testUserAdmin",
            lastName: "testUserAdmin",
            emailId: "testadmin@nodeportal.com",
            passwordEnc: PasswordUtil.encryptSync("admin"),
            roles: [Roles.getAdministratorRole().roleId]

        }, function(){

        });

        next(null, done);


    };
};


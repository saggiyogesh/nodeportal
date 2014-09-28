var async = require("async"),
    Roles = require('../permissions/Roles'),
    PasswordUtil = require('../PasswordUtil'),
    USER_SCHEMA = "User";

module.exports = function (app, done) {
    return function (next) {
        Debug._l(app.set("db"))
        var UserService = app.getService(USER_SCHEMA);

        var data = [
            {
                userName: "testUser",
                firstName: "testUser",
                lastName: "testUser",
                emailId: "test@nodeportal.com",
                passwordEnc: PasswordUtil.encryptSync("test"),
                roles: [Roles.getUserRole().roleId]
            },
            {
                userName: "testUserAdmin",
                firstName: "testUserAdmin",
                lastName: "testUserAdmin",
                emailId: "testadmin@nodeportal.com",
                passwordEnc: PasswordUtil.encryptSync("admin"),
                roles: [Roles.getAdministratorRole().roleId]
            }
        ];
        UserService.multipleSave(data, function () {
        });
        next(null, done);
    };
};


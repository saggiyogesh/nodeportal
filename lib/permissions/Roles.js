var roles = {},
    adminRole, guestRole, userRole;

exports.init = function (roles) {
    adminRole = roles.Administrator,
        guestRole = roles.Guest,
        userRole = roles.User
};

exports.getAdministratorRole = function () {
    return adminRole;
};

exports.getUserRole = function () {
    return userRole;
};

exports.getGuestRole = function () {
    return guestRole;
};
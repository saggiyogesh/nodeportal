var guestRole = {
    roleId: "c",
    name: "Guest",
    description: "Unauthenticated users are having this role"
};

var adminRole = {
    roleId: "c",
    name: "Administrator",
    description: "Administrator users are having this role"
};

var userRole = {
    roleId: "c",
    name: "User",
    description: "Authenticated users should have this role"
};

module.exports = {Role: [
    guestRole, adminRole, userRole
]};
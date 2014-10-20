var guest = {
    userId: "c",
    userName: "guest",
    firstName: "Guest",
    middleName: "",
    lastName: "User",
    passwordEnc: "guest",
    emailId: "guest@nodeportal.com",
    dob: Date.now(),
    roles: [],
    phoneNo: "",
    active: true,
    "default": true
};

var admin = {
    userId: "c",
    userName: "admin",
    firstName: "Admin",
    middleName: "",
    lastName: "User",
    passwordEnc: "admin",
    emailId: "admin@nodeportal.com",
    dob: Date.now(),
    roles: [],
    phoneNo: "",
    active: true,
    dob: new Date()
};

module.exports = {User: {admin: admin, guest: guest}, deps: ['Role']};
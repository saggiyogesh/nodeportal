var guest = {
    userId: "c",
    userName: "guest",
    firstName: "guest",
    middleName: "",
    lastName: "guest",
    passwordEnc: "",
    emailId: "guest@nodeportal.com",
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
    lastName: "",
    passwordEnc: "admin",
    emailId: "admin@nodeportal.com",
    roles: [],
    phoneNo: "",
    active: true,
    dob: new Date()
};

module.exports = {User: {admin: admin, guest: guest}, deps: ['Role']};
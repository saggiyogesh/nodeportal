var newPassword = {
    label: "New password",
    type: "password",
    name: "newPassword",
    rules: [ "required", 'notEqualTo:oldPassword'  ]
};
var confirmNewPassword = {
    label: "Confirm new password",
    type: "password",
    name: "confirmNewPassword",
    rules: [ "required" , 'equalTo:newPassword']
};

var oldPassword = {
    label: "Current Password",
    type: "password",
    name: "oldPassword",
    rules: [ "required", 'checkOldPassword']
};
var update = {
    type: "submit",
    value: "Update"
};

var userId = {
    type: "hidden",
    name: "userId"
};


module.exports = {
    form: {
        id: "securityFM",
        method: "post",
        action: "updateUserSecurityDetails",
        legendText: "Edit user address & contact"
    },
    fields: [ userId, oldPassword, newPassword, confirmNewPassword,
        update ]
};
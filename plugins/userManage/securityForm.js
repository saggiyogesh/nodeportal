var newPassword = {
    label: "New password",
    type: "password",
    name: "newPassword",
    rules: [ "required", 'notEqualTo:oldPassword'  ]
};

/**
 * New field when user logged in by oauth & updates password, in this case oldPassword doesn't exists
 */
var newPassword2 = {
    label: "New password",
    type: "password",
    name: "newPassword",
    rules: [ "required"  ]
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


module.exports = function (hasOldPassword) {
    var fields = [ userId, oldPassword, newPassword, confirmNewPassword,
        update ];

    if(!hasOldPassword) {
        fields = [ userId, newPassword2, confirmNewPassword, update ];
    }

    return {
        form: {
            id: "securityFM",
            method: "post",
            action: "updateUserSecurityDetails",
            legendText: "Update password"
        },
        fields: fields
    };
}
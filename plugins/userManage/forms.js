var update = {
    type: "submit",
    value: "Update"
};
var userName = {
    label: "User Name",
    type: "text",
    name: "userName"
};

var firstName = {
    label: "First Name",
    type: "text",
    name: "firstName",
    rules: [ "required" ]
};
var middleName = {
    label: "Middle Name",
    type: "text",
    name: "middleName"
};
var lastName = {
    label: "Last Name",
    type: "text",
    name: "lastName"
};

var dob = {
    label: "Date of birth",
    type: "date",
    name: "dob",
    rules: [ "required" ]
};


var redirect = {
    type: "hidden",
    name: "redirect"
};
var userId = {
    type: "hidden",
    name: "userId"
};

var gender = {
    label: "Gender",
    type: "select",
    name: "gender",
    options: [
        [ 'Please select..', ''],
        [ 'Male', 'male' ]   ,
        [ 'Female', 'female' ]
    ]
};


exports.ProfileForm = {
    form: {
        id: "fm",
        method: "post",
        action: "updateProfile",
        legendText: "Edit user info"
    },
    fields: [ userId, redirect, firstName, middleName, lastName, dob, gender,
        update ]
};
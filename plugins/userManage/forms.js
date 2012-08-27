//var email = {
//    label:"Email",
//    type:"text",
//    name:"email",
//    rules:[ "required", "email" ]
//};
var password = {
    label:"Password",
    type:"password",
    name:"password",
    rules:[ "required" ]
};
var confirm = {
    label:"Confirm Password",
    type:"password",
    name:"confirmPassword",
    rules:[ "required" , 'equalTo:password']
};
var login = {
    type:"submit",
    value:"Login"
};

var update = {
    type:"submit",
    value:"Update"
};
var userName = {
    label:"User Name",
    type:"text",
    name:"userName"
};

var firstName = {
    label:"First Name",
    type:"text",
    name:"firstName",
    rules:[ "required" ]
};
var middleName = {
    label:"Middle Name",
    type:"text",
    name:"middleName"
};
var lastName = {
    label:"Last Name",
    type:"text",
    name:"lastName"
};
var telNo = {
    label:"Tel No",
    type:"text",
    name:"telNo"
};
var address = {
    label:"Tel No",
    type:"text",
    name:"telNo"
};

var dob = {
    label:"Date of birth",
    type:"date",
    name:"dob",
    rules:[ "required" ]
};


var redirect = {
    type:"hidden",
    name:"redirect"
};
var userId = {
    type:"hidden",
    name:"userId"
};

exports.ProfileForm = {
    form:{
        id:"fm",
        method:"post",
        action:"updateProfile"
    },
    fields:[ userId,redirect, firstName, middleName, lastName, dob,
        update ]
};
var USER_SCHEMA = "User";

function checkUserName(req, model, val, next) {
    req.app.getService(USER_SCHEMA).getByUserName(val, function (err, user) {
        if (!err) {
            if (user) {
                next(err, false); //i.e validations fails as user with same user name already exists
            }
            else {
                next(err, true);// validation test pass
            }
            return;
        }
        next(err);
    });
}

function checkEmail(req, model, val, next) {
    req.app.getService(USER_SCHEMA).getByEmailId(val, function (err, user) {
        if (!err) {
            if (user) {
                next(err, false); //i.e validations fails as user with same email id already exists
            }
            else {
                next(err, true);// validation test pass
            }
            return;
        }
        next(err);
    });
}

function validateCaptcha(req, model, val, next) {
    var captchaText = req.session.captchaText,
        captchaInput = model["captchaText"],
        isValidCaptchaInput = captchaText === captchaInput;

    Debug._l(captchaText + " : " + captchaInput + " : " + isValidCaptchaInput);
    next(null, isValidCaptchaInput);
}

var emailRegister = {
    label: "Email",
    type: "text",
    name: "email",
    rules: [ "required", "email", "checkEmail" ]
};

var emailLogin = {
    label: "Email",
    type: "text",
    name: "email",
    rules: [ "required", "email"]
};

var password = {
    label: "Password",
    type: "password",
    name: "password",
    rules: [ "required" ]
};
var confirm = {
    label: "Confirm Password",
    type: "password",
    name: "confirmPassword",
    rules: [ "required" , 'equalTo:password']
};
var login = {
    type: "submit",
    value: "Login"
};

var register = {
    type: "submit",
    value: "Register"
};
var userName = {
    label: "User Name",
    type: "text",
    name: "userName",
    rules: [ "required", "checkUserName" ]
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

var cancel = {
    type: "cancel",
    value: "Cancel"
};

var captcha = {
    label: " ",
    type: "image",
    name: "captchaImage",
    src: "/app/captcha",
    style: "width:150px;height:40px"
};

var captchaText = {
    label: "Captcha verification",
    type: "text",
    name: "captchaText",
    rules: [ "required", "validateCaptcha" ]
};
/*
 var redirect = {
 type:"hidden",
 name:"redirect"
 };*/

exports.LoginForm = {
    form: {
        id: "fm",
        method: "post",
        action: "doLogin"
    },
    fields: [ emailLogin, password, login ]
};

exports.RegisterForm = {
    form: {
        id: "fm",
        method: "post",
        action: "doRegister"
    },
    fields: [ emailRegister, password, confirm, userName, firstName, middleName, lastName, dob,
        captcha, captchaText, register , cancel]
};

var emailOAuth = {
    label: "Email",
    type: "text",
    name: "email",
    rules: [ "required", "email" ]
};

var userNameOAuth = {
    label: "User Name",
    type: "text",
    name: "userName"
};


exports.OAuthRegisterForm = {
    form: {
        id: "fm",
        method: "post",
        action: "oauthRegister"
    },
    fields: [ emailOAuth, firstName, middleName, lastName, register ]
};

exports.customValidations = {
    checkUserName: {ruleFunction: checkUserName, msgs: {en_US: "User name already exists."}},
    checkEmail: {ruleFunction: checkEmail, msgs: {en_US: "Email already exists."}},
    validateCaptcha: {ruleFunction: validateCaptcha, msgs: {en_US: "Captcha validation fails."}}
};
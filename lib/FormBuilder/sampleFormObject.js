vals = {
    "email" : "sfdsff@gf.vo",
    "password" : "fff",
    "desc" : "My name isAgrawla",
    "sex" : "0",
    "radioName" : "male"
};
formObj = {
    namespace : "login",
    form : {
	id : "fm1",
	method : "post",
	action : "/login"
    },
    fields : [
	    {
		label : "Email",
		type : "text",
		name : "email",
		rules : [ "required", "email" ]
	    },
	    {
		label : "Password",
		type : "password",
		name : "password",
		rules : [ "required" ]
	    },
	    {
		label : "Sex",
		type : "select",
		name : "sex",
		options : [ [ "Select any option", "" ], [ "male", "1" ],
			[ "female", "0" ] ],
		rules : [ "required" ]
	    }, {
		label : "Description",
		type : "textarea",
		name : "desc",
		"class" : "sample",
		rules : [ "required" ]
	    }, {
		label : "Please check",
		type : "checkbox",
		name : "agreement",
		rules : [ "required" ]
	    }, {
		label : "select any radio",
		type : "radio",
		name : "radioName",
		options : [ [ "Male", "male" ], [ "Female", "female" ] ],
		rules : [ "required" ]

	    }, {
		type : "submit",
		value : "Save"
	    }, {
		type : "button",
		value : "Cancel"
	    } ]
};
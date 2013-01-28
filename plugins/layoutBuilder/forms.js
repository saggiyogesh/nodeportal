var LAYOUT_SCHEMA = "Layout";

function checkValidPlaceHolderName(req, model, val, next) {
    var tmpl = model.template;
    var arr = val.split(",");
    for (var i = 0; i < arr.length; i++) {
        var holder = arr[i];
        if (!utils.contains(tmpl, "{" +holder + "}")) {
            //holder name is not in tmpl string, validation error
            return next(null, false);
        }
    }

    //validation success, each holder name is in tmpl string
    next(null, true);
}


var layoutId = {
    type:"hidden",
    name:"layoutId"
},
    layoutName = {
        type:"hidden",
        name:"layoutName"
    },
    redirect = {
        type:"hidden",
        name:"redirect"
    },
    html = {
        label:"Template",
        type:"textarea",
        name:"template",
        rules:[ "required" ]
    },

    placeHolders = {
        label:"Placeholders",
        type:"text",
        name:"placeholders",
        rules:[ "required" , "checkValidPlaceHolderName"]
    },
    save = {
        type:"submit",
        value:"Save"
    },
    cancel = {
        type:"cancel",
        value:"Cancel"
    };

exports.EditForm = {
    form:{
        id:"fm",
        method:"post",
        action:"updateLayout"
    },
    fields:[layoutId, layoutName, redirect, html, placeHolders, save, cancel]
};

exports.customValidations = {
    checkValidPlaceHolderName:{ruleFunction:checkValidPlaceHolderName,
        msgs:{en_US:"Place holders names are not valid."}}
};

/**
 *
 */
var _l = Debug._l;
var _i = Debug._i;
var getMsg = require("../i18n").get,
    getProp = require("../AppProperties").get, PluginHelper = require('../PluginHelper');

//var v = require('../Validator').getInstance();
var Constants = require("./Constants"), ValidationMsgs = Constants.ValidationMsgs;
var viewLib = require("../viewLibs/lib"), DateFormatter = require("../Utils/DateUtil").format,
    DATE_FORMAT = getProp("DATE_FORMAT"), JQUERY_UI_DATE_FORMAT = getProp("JQUERY_UI_DATE_FORMAT"),
    sanitize = require('validator').sanitize;

var DEFAULTS = {
        FIELD_WRAPPER_CLASS: "form-field",
        FIELD_WRAPPER_START: '<div class="control-group{$$}">',
        FIELD_WRAPPER_END: "</div>",
        BUTTON_GROUP_START: '<div class="form-actions">',
        BUTTON_GROUP_END: '</div>',
        ELEMENT_ERROR_CLASSNAME: " error",
        SUBMIT_BUTTON_CLASS: "btn btn-primary",
        CANCEL_BUTTON_CLASS: "btn"
    }, _ = require("underscore"), INPUT_START_TAG = "<input ", INPUT_END_TAG = "/>",
    SELECT_START_TAG = "<select {$$}>", SELECT_END_TAG = "</select>",
    TEXTAREA_START_TAG = "<textarea {$$}>", TEXTAREA_END_TAG = "</textarea>",
    OPTION_START_TAG = "<option {$$}", OPTION_END_TAG = "</option>", OPTION_START_TAG_CLOSE = ">",
    LABEL_START_TAG = '<label {$$} class="control-label">', LABEL_END_TAG = "</label>",
    FORM_TAG_START = '<form {$$} class="form-horizontal"><fieldset>', FORM_TAG_END = "</fieldset></form>",
    ERR_ElEMENT_START_TAG = "<span {$$}>", ERR_ElEMENT_END_TAG = "</span>",
    FORM_ELEMENT_WRAPPER = '<div class="controls">{$$}</div>',
    LEGEND_START_TAG = '<legend>', LEGEND_END_TAG = '</legend>',
    ADD_MODE = "add", TOKEN = "{$$}";


function addAttr(key, value) {
    var buf = [];
    buf.push("");
    buf.push(key);
    buf.push("=\"");
    buf.push(value);
    buf.push("\"");
    buf.push(" ");
    return buf.join("");
}

function addAttrs(field) {
    var buf = [];
    Object.keys(field).forEach(function (key) {
        buf.push(addAttr(key, field[key]));
    });
    return buf.join("");
}

function value(vals, name) {
    if (!vals) {
        return "";
    }
    var val = vals[name];
    return (val || val === 0 || val === "0") ? val : "";
}


function createInput(field, vals, PageScript) {
    var name = field.originalName;
    delete field.originalName;
    var val = value(vals, name);
    //condition to pass 0 value of input
    if (val || val === 0 || val === "0") {
        switch (field.type) {
            case "text":
                val = addAttr("value", sanitize(val).trim());
                break;

            case "date":
                try {
                    val = DateFormatter(val);
                } catch (e) {
                }
                val = addAttr("value", val);
                break;

            case "hidden":
                val = addAttr("value", sanitize(val.toString()).trim());
                break;

            case "checkbox":
                val = addAttr("checked", "checked");
                break;

            case "radio":
                val = addAttr("checked", "checked");
                break;

            default:
                val = "";
                break;
        }

    }
    switch (field.type) {
        case "date":
            field.type = "text";
            var jqueryDatePickerInit = '$("#' + field.id + '" ).datepicker' +
                '({dateFormat:\'' + JQUERY_UI_DATE_FORMAT + '\',changeMonth: true,   changeYear: true, yearRange:"1930:2030" });';
            PageScript.add("jqueryui", jqueryDatePickerInit);
            break;
        case "submit":
            field["class"] = DEFAULTS.SUBMIT_BUTTON_CLASS;
            break;

        case "cancel":
            field["class"] = DEFAULTS.CANCEL_BUTTON_CLASS;
            field.type = "button";
            PageScript.add("util", "Rocket.Util.onFormCancel('" + field.id.split("_")[0] + "','" +
                field.id + "');");
            break;

    }
    return [INPUT_START_TAG + addAttrs(field), val , INPUT_END_TAG].join("");
}

function createLabel(field) {
    if (field.type === "submit" || field.type === "button" || field.type === "hidden") {
        return;
    }

    if (!field.label) {
        field.label = field.name;
    }
    var label = LABEL_START_TAG.replace(TOKEN, addAttr("for", field.id).trim())
        + field.label + LABEL_END_TAG;
    delete field.label;
    return label;

}

function createOptions(field, val) {
    // options is an array
    /*
     * options:[["Select any option",""],["male", "1"],["female", "0"]], html
     * differs for type like for select it is rendered by option tag and for
     * radio it is
     */
    var options = field.options, type = field.type, buf = [];

    if (type === "select") {
        options.forEach(function (opt) {

            var option = [], value = opt[1], text = opt[0];
            option.push(OPTION_START_TAG.replace(TOKEN, addAttr("value", value)));
            //mongoose Number object doesn't evaluate value == val correctly,
            // therefore toString() method is used for equality check.
            option.push(value.toString() === val.toString() ? addAttr("selected", "selected") : "");
            option.push(OPTION_START_TAG_CLOSE + text + OPTION_END_TAG);
            buf.push(option.join(""));
        });
    }
    else if (type === "radio") {
        options.forEach(function (opt) {
            var option, value = opt[1], text = opt[0], id = field.id + "_" + value;
            var obj = {name: field.name, value: value, id: id, type: "radio"}, checked = "checked";
            if (value === val) {
                obj[checked] = checked;
            }
            if (field["class"]) {
                obj["class"] = field["class"];
            }
            option = createInput(obj);
            var label = createLabel({id: id, type: type, label: text});
            option = label + option;
            buf.push(option);
        });
    }

    return buf;
}


function createTextarea(field, vals) {
    delete field.type;
    var buf = [], name = field.originalName;
    delete field.originalName;
    buf.push(TEXTAREA_START_TAG.replace(TOKEN, addAttrs(field)));
    buf.push(sanitize(value(vals, name)).xss());
    buf.push(TEXTAREA_END_TAG);

    return buf.join("");
}


function createSelect(field, vals) {
    var name = field.originalName, val = value(vals, name);
    var options = createOptions(field, val);
    delete field.originalName;
    delete field.type;
    delete field.options;
    var selectString = SELECT_START_TAG.replace(TOKEN, addAttrs(field));
    return [selectString, options.join(""), SELECT_END_TAG].join("");
}

function createRadio(field, vals) {
    var name = field.originalName, val = value(vals, name);
    var options = createOptions(field, val);
    delete field.originalName;
    delete field.type;
    delete field.options;
    return options.join("");
}
function parseAttrs(field, namespace) {
    return {
        name: namespace + "[" + field.name + "]",
        id: namespace + "_" + field.name
    };
}

function createErrElement(rule, field, locale) {
    var string = ERR_ElEMENT_START_TAG.replace(TOKEN, addAttrs({"class": "help-inline"}));
    string += getMsg({key: ValidationMsgs[rule], locale: locale});
    string += ERR_ElEMENT_END_TAG;
    return string;
}

var getNamespace = PluginHelper.getNamespace
function getValsFromReq(req, namespace) {
    var vals;
    if (req.body && req.body[namespace]) {
        vals = req.body[namespace];
    } else if (req.query && req.query[namespace]) {
        vals = req.query[namespace];
    }
    return vals;
}

function processRules(field, formValidation, locale) {
    var fieldResultObj = formValidation.validationResult[field.originalName];

    //validations fails for particular field
    if (!fieldResultObj.result) {
        var rule = fieldResultObj.lastRule;
        if (rule.indexOf(":") > -1) {
            var arr = rule.split(":");
            rule = arr[0];
        }
        return createErrElement(rule, field, locale);
    }
    return "";
}
function getUniqueId(field, namespace) {
    var s = namespace + "_" + field.type;
    if (field.value) {
        s += "_" + field.value.toLowerCase();
    }
    return s;
}

function bindLabelAndFields(field, labelObj, fieldsObj, rulesObj) {
    if (field.type === "submit" || field.type === "button" || field.type === "cancel") {
        return [];
    }
    var id = field.name;
    var html = [], fieldsHTML = fieldsObj[id];


    if (field.type === "hidden") { // no style form fields for hidden inputs
        html.push(fieldsHTML);
        return html.join("");
    }

    if (rulesObj[id]) {
        html.push(DEFAULTS.FIELD_WRAPPER_START.replace(TOKEN, DEFAULTS.ELEMENT_ERROR_CLASSNAME));
    }
    else {
        html.push(DEFAULTS.FIELD_WRAPPER_START.replace(TOKEN, ""));
    }

    html.push(labelObj[id]);
    html.push(fieldsHTML);
// html.push(fieldsArr[1]);// point to add value in tags using addAttr so,
    // html[1]
// html.push(fieldsArr[2]); // point to tag end
//    html.push(rulesObj[id]); // point to add validation html, so html[3] {Removed for bootstrap}
    html.push(DEFAULTS.FIELD_WRAPPER_END);
    return html.join("");
}

function bindButtons(labelObj, fieldsObj, buttonIds) {
    if (buttonIds.length > 0) {

        var buttons = [];
        buttonIds.forEach(function (id) {
            buttons.push(fieldsObj[id]);
        });
        //add default cancel button
        //buttons.push(" <button class='btn'>Cancel</button>"); //space should be given between the buttons to render correct html
        return DEFAULTS.BUTTON_GROUP_START + buttons.join(" ") + DEFAULTS.BUTTON_GROUP_END;
    }
}

function createForm(form, namespace, html) {
    var attrs = [], legendText = form.legendText;
    delete form.legendText;

    if (!form.id) {
        form.id = "fm";
    }
    form.id = namespace + "_" + form.id;
    form.name = form.id;

    Object.keys(form).forEach(function (key) {
        attrs.push(addAttr(key, form[key]));
    });

    if (legendText) {
        var a = [];
        a.push(LEGEND_START_TAG);
        a.push(legendText);
        a.push(LEGEND_END_TAG);
        html = a.join("") + html;
    }

    return FORM_TAG_START.replace(TOKEN, attrs.join("").trim()) + html + FORM_TAG_END;
}


// function getOriginalName(name) {
// return name.substring(name.indexOf("[")+1, name.indexOf("]"));
// }

// function getTextTypeValue(value, type) {
// var string ="";
// switch (type) {
// case "text":
// string = addAttr("value", value );
// break;
//
// case "textarea":
// string = value;
// break;
//
// case "checkbox":
// string = addAttr("checked", "checked");
// break;
//
// default:
// break;
// }
//
// return string;
// }

// function getArrayTypeValue(options, value, type) {
// // TODO for multiple option in select
// var buf = [];
// if(type === "select"){
// for ( var i = 0; i < options.length; i++) {
// var opt = options[i];
// if(opt[0].indexOf('value="'+value+'"') > -1){
// opt[1] = addAttr("selected", "selected");
// }
// buf.push(opt.join(""));
// }
// }
// return buf.join("");
// }

// function getFormFieldsHTML(html, vals, fieldsTypeObj) {
// var string = [];
// Object.keys(html).forEach(function(key) {
// if(vals){
// var value = html[key][1];
// var name = getOriginalName(key);
// if(_.isArray(value)){
// // TODO do for options
// html[key][1] = getArrayTypeValue(html[key][1], vals[name],
// fieldsTypeObj[key]);
// }else {
// if(vals[name]){
// html[key][1] = getTextTypeValue(vals[name], fieldsTypeObj[key]) ;
// }
//		
//		
// }
// }
// });
// }


// field type, name is compulsory

exports.SettingsDynamicForm = function (app, namespace, formObj, locale, vals, mode, PageScript) {
    var dummyReq = {
        attrs: {},
        app: app,
        params: PluginHelper.getPluginIdAndIId(namespace)
    };

    return process(app, locale, formObj, namespace, vals, mode, null, PageScript);
};
function process(app, locale, formObj, namespace, vals, mode, formValidation, PageScript) {
    var form = formObj.form
// vals = {
// "email":"sfdsff@gf.vo",
// "password":"fff",
// "desc":"My name isAgrawla",
// "sex" : "0",
// "radioName": "male"
// };
// formObj = {
// namespace:"login",
// form :{
// id:"fm1",
// method : "post",
// action : "/login"
// },
// fields : [{
// label:"Email",
// type:"text",
// name:"email",
// rules:["required", "email"]
// },{
// label:"Password",
// type:"password",
// name:"password",
// rules:["required"]
// },{
// label:"Sex",
// type:"select",
// name:"sex",
// options:[["Select any option",""],["male", "1"],["female", "0"]],
// rules:["required"]
// },{
// label:"Description",
// type:"textarea",
// name:"desc",
// "class":"sample",
// rules:["required"]
// },{
// label:"Please check",
// type:"checkbox",
// name:"agreement",
// rules:["required"]
// },{
// label:"select any radio",
// type:"radio",
// name:"radioName",
// options:[["Male","male"],["Female", "female"]],
// rules:["required"]
//
// },{
// type:"submit",
// value:"Save"
// },{
// type:"button",
// value:"Cancel"
// }]
// };

    var fieldsObj = {}, labelObj = {}, buttonIds = [], html = [],
        rulesObj = {};
    formObj.fields.forEach(function (field) {
        field = _.clone(field);
        var key;
        if (field.type !== "submit" && field.type !== "button" && field.type !== "cancel") {
            if (!field.name) {
                throw new Error("Field name empty");
            }

            var basicAttr = parseAttrs(field, namespace);
            field.originalName = field.name;
            field.name = basicAttr.name;
            field.id = basicAttr.id;
            key = field.name;
        }
        else {
            field.id = getUniqueId(field, namespace);
            key = field.id;
            buttonIds.push(key);
        }

        if (!field.type) {
            throw new Error("Field type empty");
        }

        if (field.rules) {
            if (vals && mode != ADD_MODE) {
                var rules = rulesObj[key] = processRules(field, formValidation, locale);
                if (rules) {
                    var className = field["class"];
                    field["class"] = className ? className + " " + DEFAULTS.ELEMENT_ERROR_CLASSNAME : DEFAULTS.ELEMENT_ERROR_CLASSNAME;
                }
            }
            delete field.rules;
        }

        labelObj[key] = createLabel(field);

        var fieldHTML;
        switch (field.type) {
            case "custom":
                fieldHTML = field.html;
                break;
            case "textarea":
                fieldHTML = createTextarea(field, vals);
                break;
            case "select":
                fieldHTML = createSelect(field, vals);
                break;
            case "radio":
                fieldHTML = createRadio(field, vals);
                break;
            default:
                fieldHTML = createInput(field, vals, PageScript);
        }

        /*if (field.type === "textarea") {

         }

         else if (field.type === "textarea") {
         fieldHTML = createTextarea(field, vals);
         }
         else if (field.type === "select") {
         fieldHTML = createSelect(field, vals);
         }
         else if (field.type === "radio") {
         fieldHTML = createRadio(field, vals);
         }
         else {
         fieldHTML = createInput(field, vals);
         }*/

        if (buttonIds.join("").indexOf(key) == -1) {
            var ruleHTML = rulesObj[key] || "";

            if (field.type === "hidden") {
                fieldsObj[key] = fieldHTML;
            }
            else {
                fieldsObj[key] = FORM_ELEMENT_WRAPPER.replace(TOKEN, fieldHTML + ruleHTML); //included for bootstrap
            }
            html.push(bindLabelAndFields(field, labelObj, fieldsObj, rulesObj));
        }
        else {
            fieldsObj[key] = fieldHTML;
        }
    });

// getFormFieldsHTML(html, vals, fieldsTypeObj);
    html.push(bindButtons(labelObj, fieldsObj, buttonIds));
    return createForm(form, namespace, html.join(""));
}
/**
 * formObj is the required form, vals are the value passed should be in a obj if
 * present otherwise not, locale is the current locale of which error msgs are
 * retrieved
 * @param mode either add or edit. In add, Form Builder not checks for formValidation object. Also not process rules
 */
var DynamicForm = exports.DynamicForm = function (req, formObj, locale, mode, includeQueryParams) {
    var namespace = getNamespace(req);
    var vals = getValsFromReq(req, namespace);
    var form = _.clone(formObj.form);
    formObj.form = form;
    var action = form.action;
    form.action = viewLib.getURL(req, action, includeQueryParams);

    var formValidation = req.attrs.formValidation;
    return process(req.app, locale, formObj, namespace, vals, mode, formValidation, req.attrs.PageScript);
};


/**
 * Validator for handling server side validation.
 */
var validator = require("validator").Validator;
var _ = require('underscore');
validator.prototype.error = function (msg) {
    return true;
};


//rules aliases
validator.prototype.required = validator.prototype.notNull;

validator.prototype.email = validator.prototype.isEmail;

validator.prototype.date = validator.prototype.isDate;


/**
 * rules added to confirm_password field to match with password field
 */
validator.prototype.equalTo = validator.prototype.equals;

validator.prototype.notEqualTo = function (equals) {
    if (this.str == equals) {
        return this.error(this.msg || 'Equal');
    }
    return this;
};


/**
 *
 * @param req
 * @param modelObj
 * @param fieldsRules
 * @param next
 * @constructor
 */
function Validator(req, modelObj, fieldsRules, next) {
    var that = this, app = req.app, db = app.set("db");
    that._v = new validator();
    that._db = db;
    that._model = modelObj;
    that._fieldsRules = fieldsRules;
    that._req = req;
    that._app = app;
    that._final = {};
    that._hasErrors = false;
    that.process(0, 0, function (err, final) {
        if (err) {
            console.log("catch::: ");
            console.log(err.message);
            next(err);
            return;
        }

        //this should be the executed after validation is over

        next(err, final);

    });
}

exports.getInstance = function (req, model, fieldsRules, next) {
    return new Validator(req, model, fieldsRules, next);
};


Validator.prototype.getRuleFn = function (ruleName, key, next) {
    var that = this, _v = that._v, model = that._model, val = model[key], otherRuleVal;
    if (ruleName.indexOf(":") > -1) {
        var arr = ruleName.split(":");
        ruleName = arr[0];
        otherRuleVal = arr[1];
        otherRuleVal = model[otherRuleVal];
    }
    if (_v[ruleName]) {
        return function () {
            var isValid = !val && ruleName != "required" ? true : that.validate(ruleName, val, otherRuleVal);
            next(undefined, isValid);
        }
    } else {
        return function () {
            getCustomValidations(ruleName).call({db: that._db, dbAction: that._dbAction}, that._req, model, val, next);
        }
    }
};

Validator.prototype.process = function (i, j, next) {
    var that = this;
    var model = that._model, fieldsRules = that._fieldsRules;
    var keys = Object.keys(model);
    if (i < keys.length) {
        var key = keys[i];
        var val = model[key];
        var rules = fieldsRules[key];
        if (!rules) {
            that.process(i + 1, j, next);
            return;
        }
//        console.log("key: " + key + " :: val: " + val + " :: rules: " + rules);

        var rulesLen = rules.length;

        (that.getRuleFn(rules[j], key, function (err, isValid) {
            if (err) {
                next(err);
                return;
            }

            var final = that._final;

            final[key] = final[key] || {};

            final[key].result = isValid;
            final[key].lastRule = rules[j];

            //check for more than one rule
            var isValidated = final[key].result;
            if (isValidated != undefined) {
                if (rulesLen > 1 && j + 1 < rulesLen) {

//                    console.log("isValidated: " + isValidated);
                    if (isValidated == true) { // validation success, call next validation of same field
                        j = j + 1;
                    }
                    else { // validation failed, call next field's validation
                        i = i + 1;
                        j = 0;
                    }
                }
                else {
                    i = i + 1;
                    j = 0;
                }
            }
            that._hasErrors = that._hasErrors || !isValid;


            that.process(i, j, next);
        }))();
    }
    else {
        that._req.attrs.formValidation = {hasErrors: that._hasErrors, validationResult: that._final};

        next(undefined, that._req.attrs.formValidation);
    }
};

Validator.prototype.toString = function () {
    return "validator to string";
};

/*
 * return true if validation fails otherwise return false
 */
Validator.prototype.validate = function (rule, val, otherRuleVal) {
    var result = this._v.check(val)[rule](otherRuleVal);
    if (_.isBoolean(result)) {
        return false;
    }
    else {
        return true;
    }

};

var customValidations = {};

exports.addCustomValidations = function (name, fn) {
    if (!customValidations[name]) {
        customValidations[name] = fn;
//        Debug._l("custom validations : > " + name + Debug._i(fn, true));
    }
    else {
        return false;
    }

};

var getCustomValidations = function (ruleName) {
    return customValidations[ruleName];
};
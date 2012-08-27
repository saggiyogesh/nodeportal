/**
 * Base file to get values as per locale
 */
var _ = require('underscore'), utils = require("../utils"),
    getProp = require("../AppProperties").get;

/**
 * locale is locale name,
 * key is key of localized string,
 * arrVals is array type contains replacement values of the localized string
 */
exports.get = function (obj) {
    var locale = obj.locale, key = obj.key, arrVals = obj.arrVals;
    if (arrVals && !_isArray(arrVals)) {
        throw new Error("values are not array type");
    }

    locale = locale || getProp("DEFAULT_LOCALE");
    locale = require("./locales/" + locale);

    var val = locale[key];
    if (!arrVals) {
        return val ? val : key;
    }
    else {
        return val ? utils.substitute(val, arrVals) : key;
    }
};

var addMsg = exports.addMsg = function (key, msgsObj){
    Object.keys(msgsObj).forEach(function(locale){
        var localeMsgObj = require("./locales/" + locale);
        if(localeMsgObj){
            localeMsgObj[key] = msgsObj[locale];
        }
        else{
            Debug._l("No such locale exists: " + locale);
        }
    });
}
/**
 * Date handling manipulating and formatting library.
 */

var getProp = require("../AppProperties").get , dateFormat = getProp("DATE_FORMAT"),
    moment = require('moment');

/**
 * Getter for moment
 */
exports.__defineGetter__('Date', function () {
    return moment;
});


/**
 * Format date to the specified format.
 * @param date {Date|String} String date is instantiated to Date
 * @param format {String} If not provided then default format is used. Must be as supported by moment.js
 * @returns {String}
 */
exports.format = function (date, format) {
    date = _.isString(date) ? new Date(date) : date;
    format = format || dateFormat;
    return moment(date).format(format);
};

/**
 * Formats date as per "ARTICLE_DATE_FORMAT"
 * @see AppProperties
 * @param date {Date|String}
 * @param [format] {String}
 * @returns {String}
 */
exports.formatArticleDate = function (date, format) {
    format = format || getProp("ARTICLE_DATE_FORMAT");
    return exports.format(date, format);
};

/**
 * Compares on date part in given dates.
 * Ignoring time part in comparison.
 * @param date1
 * @param date2
 */
exports.equals = function (date1, date2) {
    if (!date1 && !date2) {
        return false;
    }
    return date1.toDateString() === date2.toDateString();
};

exports.equalToToday = function (date) {
    if (!date) {
        return false;
    }
    return exports.equals(new Date(), date);
};

exports.datePassed = function (date) {
    if (!date) {
        return false;
    }
    var d = new Date(),
        today = new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return date.getTime() < today.getTime() ? true : false;
};

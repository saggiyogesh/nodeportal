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

/**
 * App global properties. Default properties. Custom properties is saved in DB.
 * First DB is checked for that property key, if not present then return default
 * values.
 *
 */

//TODO this lib should be modified with a check that if a particular key's value is present in DB 
//then its value to be fetched from DB
// there should be key check for this, only key from list of keys should be entered in DB.
var props = {
    DB_NAME: null,
    DB_URL: null,
    DB_USER: null,
    DB_PASSWORD: null,
    DB_HOST: null,
    DB_PORT: null,
    APP_URL: "/app",
    DEFAULT_INDEX_PAGE: "/home",
    DEFAULT_INDEX_PAGE_ID: 9, //changes both properties, if index page is changed.
    DEFAULT_LOCALE: "en_US",
    REDIRECT_AFTER_LOGIN: null,
    REDIRECT_AFTER_LOGOUT: null,
    SESSION_MAX_AGE: null,
    DATE_FORMAT: "DD.MMM.YYYY",
    //jqueryui datepicker has different date formatting from the dateformat.js
    //http://docs.jquery.com/UI/Datepicker/formatDate
    JQUERY_UI_DATE_FORMAT: 'dd.M.yy',
    ARTICLE_DATE_FORMAT: 'DD.MMM.YY hh:mm',

    DATA_FOLDER_PATH: "data",
    SETTINGS_PAGE_URL: "/settings",
    PASSWORD_ENC_ALGO: null,
    IMAGE_HANDLER: null,
    THUMB_DIMENSION: null,
    DEFAULT_THUMB_NAME: null,
    THUMB_BACKGROUND: null,
    DEFAULT_DETAIL_NAME: null,
    IMAGE_DETAIL_DIMENSION: null,
    PROD_STATIC_MAX_AGE: null,
    DEV_STATIC_MAX_AGE: null,
    AVAILABLE_LOCALES: null,
    SCHEMA_LIST_MODEL_EVENTS: null,
    SERVER_PORT: null,
    MAIL_KNOWN_SMTP: null,
    MAIL_HOST: null,
    MAIL_PORT: null,
    MAIL_AUTH_USER: null,
    MAIL_AUTH_PASSWORD: null,
    STARTUP_MAIL_TEST: null,
    APP_STARTUP_ACTIONS_FILE: null,
    REQ_MIDDLEWARES: null
};

function chkDB(key, value) {
    if (value) {
        // persist the key in DB
        return value;
    }

    // TODO create DB services for this
    // look in DB using services
    // getFromDB(key);
    return value;

}

var get = exports.get = function (key) {
    var val = props[key];
    return val || "";
};

exports.set = function (key, val) {
    if (val) {
        props[key] = val;
    }

    var value = props[key];
    if (value) {
        return value;
    }
};
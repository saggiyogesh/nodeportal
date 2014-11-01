/**
 * App global properties. Default properties. Custom properties is saved in DB.
 * First DB is checked for that property key, if not present then return default
 * values.
 *
 */
var _ = require("underscore");

var props = {
    DB_NAME: null,
    DB_URL: null,
    DB_USER: null,
    DB_PASSWORD: null,
    DB_HOST: null,
    DB_PORT: null,
    APP_URL: "/app",
    DEFAULT_INDEX_PAGE: "/home",
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
    SETTINGS_URL: "/settings",
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
    HTTP_SERVER_PORT: null,
    HTTPS_SERVER_PORT: null,
    HTTPS_CERTIFICATE_FILE_PATH: null,
    HTTPS_KEY_FILE_PATH: null,
    MAIL_KNOWN_SMTP: null,
    MAIL_HOST: null,
    MAIL_PORT: null,
    MAIL_AUTH_USER: null,
    MAIL_AUTH_PASSWORD: null,
    STARTUP_MAIL_TEST: null,
    APP_STARTUP_ACTIONS_FILE: null,
    REQ_MIDDLEWARES: null,
    ENABLED_LOGIN_ACCOUNTS: null,
    LOGIN_ACCOUNTS_CONFIG: [],
    GLOBAL_CACHE_STORE: null,
    DEFAULT_CACHE_EXPIRE: null,
    DB_CACHE_STORE: null,
    TMPL_CACHE_STORE: null,
    CACHE_REDIS_HOST: null,
    CACHE_REDIS_PORT: null,
    BOTTOM_SCRIPTS_CACHE_STORE: null,
    SHOW_PLUGIN_VIEW_PERMISSION_ERR: false,
    APP_404_ERROR_TMPL: null,
    APP_500_ERROR_TMPL: null,
    APP_401_ERROR_TMPL: null,
    PLUGIN_ERROR_TMPL: null
};

var get = exports.get = function (key) {
    var val = props[key];
    _.isUndefined(val) && (val = "");
    return val;
};

exports.set = function (key, val) {
    !_.isUndefined(val) && (props[key] = val);
};
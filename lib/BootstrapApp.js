/**
 * Populates app properties and run startup actions
 */

var Properties = require("properties-parser"),
    AppProperties = require("./AppProperties"),
    util = require("util"),
    _ = require("underscore"),
    async = require("async");

var propsFile = "np.properties",
    overridePropsFile = "np-override.properties",
    cwd = process.cwd(),
    done = 1;

/**
 * Populating AppProperties from properties file
 * @param props {Object} Properties loaded from .properties file
 */
function populateAppProperties(props) {
    AppProperties.set("DB_NAME", props["db.name"]);
    AppProperties.set("DB_USER", props["db.user"]);
    AppProperties.set("DB_PASSWORD", props["db.password"]);
    AppProperties.set("DB_HOST", props["db.host"]);
    AppProperties.set("DB_PORT", props["db.port"]);

//    AppProperties.set("DB_URL", "mongodb://" + props['db.user'] + ":"
//        + props['db.password'] + "@" + props['db.host'] + ":" +
//        props['db.port'] + "/" + props['db.name']);

    AppProperties.set("SESSION_MAX_AGE", parseInt(props["session.max.age"]) * 60000);
    AppProperties.set("PASSWORD_ENC_ALGO", props["password.encryption.algorithm"]);
    AppProperties.set("IMAGE_HANDLER", props["image.handler"]);
    AppProperties.set("THUMB_DIMENSION", props["thumb.dimension"]);
    AppProperties.set("DEFAULT_THUMB_NAME", props["default.thumb.name"]);
    AppProperties.set("THUMB_BACKGROUND", props["thumb.background"]);
    AppProperties.set("IMAGE_DETAIL_DIMENSION", props["image.detail.dimension"]);
    AppProperties.set("PROD_STATIC_MAX_AGE", props["prod.static.max.age"]);
    AppProperties.set("DEV_STATIC_MAX_AGE", props["dev.static.max.age"]);
    AppProperties.set("AVAILABLE_LOCALES", props["available.locales"]);
    AppProperties.set("SCHEMA_LIST_MODEL_EVENTS", props["schema.list.model.events"]);
    AppProperties.set("SERVER_PORT", props["server.port"]);
    AppProperties.set("MAIL_KNOWN_SMTP", props["mail.known.smtp"]);
    AppProperties.set("MAIL_HOST", props["mail.host"]);
    AppProperties.set("MAIL_PORT", props["mail.port"]);
    AppProperties.set("MAIL_AUTH_USER", props["mail.auth.user"]);
    AppProperties.set("MAIL_AUTH_PASSWORD", props["mail.auth.password"]);
    AppProperties.set("STARTUP_MAIL_TEST", props["startup.mail.test"]);

    AppProperties.set("APP_STARTUP_ACTIONS_FILE", props["app.startup.actions.file"]);
    AppProperties.set("REQ_MIDDLEWARES", props["req.middlewares"]);

    //OAuth accounts login config
    var accounts = props["enabled.login.accounts"];
    accounts = accounts || AppProperties.get("ENABLED_LOGIN_ACCOUNTS");
    if (accounts) {
        AppProperties.set("ENABLED_LOGIN_ACCOUNTS", accounts);
        accounts = accounts.split(",");
        var accConfig = {};
        _.each(props, function (value, key) {
            var split = key.split(".");
            var acc = split[0];
            if (acc && _.contains(accounts, acc)) {
                accConfig[acc] = accConfig[acc] || {};
                //trying to convert string array into array
                try {
                    value = eval(value);
                }
                catch (e) {
                }
                accConfig[acc][split[1]] = value;
            }
        });

        AppProperties.set("LOGIN_ACCOUNTS_CONFIG", accConfig);
    }

    //cache configs
    AppProperties.set("GLOBAL_CACHE_STORE", props["global.cache.store"]);
    AppProperties.set("DEFAULT_CACHE_EXPIRE", eval(props["default.cache.expire"])); //evals the string to int
    AppProperties.set("DB_CACHE_STORE", props["db.cache.store"]);
    AppProperties.set("BOTTOM_SCRIPTS_CACHE_STORE", props["bottom.scripts.cache.store"]);
    AppProperties.set("TMPL_CACHE_STORE", props["tmpl.cache.store"]);
    AppProperties.set("CACHE_REDIS_HOST", props["cache.redis.host"]);
    AppProperties.set("CACHE_REDIS_PORT", props["cache.redis.port"]);

    props["show.plugin.view.permission.error"] &&
    AppProperties.set("SHOW_PLUGIN_VIEW_PERMISSION_ERR", JSON.parse(props["show.plugin.view.permission.error"]));

    //error templates
    AppProperties.set("APP_404_ERROR_TMPL", props["app.404.error.tmpl"]);
    AppProperties.set("APP_500_ERROR_TMPL", props["app.500.error.tmpl"]);
    AppProperties.set("APP_401_ERROR_TMPL", props["app.401.error.tmpl"]);
    AppProperties.set("PLUGIN_ERROR_TMPL", props["plugin.error.tmpl"]);

}

function readParseProperties(filePath) {
    populateAppProperties(Properties.read(filePath));
}

function setGlobals() {
    global.util = util;
    global._ = require("underscore");
    global.async = require("async");

    global.utils = require("./utils");

    //add Debug object to global
    global.Debug = global.utils.Debug;
}

/**
 * Executing functions serially.
 * @param app {Object}
 */
module.exports = function (app) {
    var npFilePath = cwd + "/lib/" + propsFile,
        overrideFilePath = cwd + "/" + overridePropsFile;

    //Reading np.properties file in lib folder and populating AppProperties
    readParseProperties(npFilePath);

    //Reading np-override.properties file at root folder and updating AppProperties
    readParseProperties(overrideFilePath);

    setGlobals();

    async.series([
            function (n) {
                require("./StartUpActions")(app, n);
            }
        ],
        function (err, results) {
            if (err)
                throw  err;
        });
};




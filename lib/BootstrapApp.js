/**
 * Populates app properties and run startup actions
 */

var Properties = require("properties-parser"),
    AppProperties = require("./AppProperties"),
    async = require("async"),
    StartupActions = require("./StartupActions");

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
}

/**
 * Reading np.properties file in lib folder and populating AppProperties
 * @param next {Function} callback function for async.series
 */
function readPropertiesFile(next) {
    Properties.read(cwd + "/lib/" + propsFile, function (err, props) {
        if (!err)
            populateAppProperties(props);
        next(err, done);
    });
}

/**
 * Reading np-override.properties file at root folder and updating AppProperties
 * @param next {Function} callback function for async.series
 */
function readPropertiesOverrideFile(next) {
    Properties.read(cwd + "/" + overridePropsFile, function (err, props) {
        populateAppProperties(props);
        next(null, done);
    });
}

function executeStartupActions(app) {
    return function (next) {
        StartupActions(app, next);

    };
}

/**
 * Executing functions serially.
 * @param app {Object}
 */
module.exports = function (app) {
    async.series([
        readPropertiesFile,
        readPropertiesOverrideFile,
        executeStartupActions(app)
    ],
        function (err, results) {
            if (err)
                throw  err;
        });
};




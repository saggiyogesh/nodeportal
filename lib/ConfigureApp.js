/**
 *
 */
var mongoose = require('mongoose'), DefaultDataHandler = require("./DefaultDataHandler"),
    DBActions = require("./DBActions").DBActions,
    Properties = require("properties-parser"),
    AppProperties = require("./AppProperties"),
    path = require("path"),
    ModelEvents = require("./ModelEvents"),
    FileUtil = require("./file/FileUtil");

function populateAppProps(app, next) {
    var propsFile = "np.properties";
    Properties.read(process.cwd() + "/lib/" + propsFile, function (err, props) {
        if (err) throw err;

        AppProperties.set("DATABASE_NAME", props["db.name"]);
        AppProperties.set("DB_URL", "mongodb://" + props['db.user'] + ":"
            + props['db.password'] + "@" + props['db.host'] + ":" +
            props['db.port'] + "/" + props['db.name']);
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
        //call initDB at last
        initDB(app, next);


        //test mail
        testEmail(app);

    });
}

function testEmail(app) {
    var Mailer = require("./Mailer");
    var from = 'Sender Name <sender@example.com>',

        to = '"Receiver Name" <admin@nodeportal.com>',

        subject = 'Test email',
        body = 'test email';

    var m = new Mailer.MailMessage(from, to, subject, body);
    /*m.addAttachment({
     fileName: 'test.txt',
     filePath: process.cwd() + "/package.json"
     }).addAttachment({
     contentType: "text/plain",
     fileName: 'image.png',
     contents: new Buffer('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD/' +
     '//+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4U' +
     'g9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC', 'base64'),

     cid: 'note@node' // should be as unique as possible
     });*/
    Mailer.sendMail(m, function (err, success) {
        if (err) {
            Debug._l('Mail err: ' + err)
        }
        else {
            Debug._l("Mail is configured...")
        }

    });

}

function bindPort(app) {
    //if port is given in terminal
    app.listen(process.argv[2] || AppProperties.get("SERVER_PORT"));
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}

function createResourceDir() {
    var rootPath = process.cwd(), dataDirPath = FileUtil.realPath(rootPath, AppProperties.get("DATA_FOLDER_PATH")) ,
        resourcesPath = FileUtil.realPath(dataDirPath, "resources"),
        themesDirPath = rootPath + "/" + "views/themes", layoutsDirPath = rootPath + "/" + "views/layouts";
//    if (!FileUtil.exists(dataDirPath)) {
//        FileUtil.createDir(dataDirPath);
//        FileUtil.createDir(resourcesPath);
//    }
    FileUtil.existsThenCreateDir(dataDirPath);
    FileUtil.existsThenCreateDir(resourcesPath);
    FileUtil.existsThenCreateDir(themesDirPath);
    FileUtil.existsThenCreateDir(layoutsDirPath);


}


function initModelEvents(app) {
    app.set("modelEvents", {});
    var schemas = AppProperties.get("SCHEMA_LIST_MODEL_EVENTS");
    Debug._l("schemas: " + schemas);
    if (schemas) {
        schemas = schemas.split(",");
        for (var i = 0; i < schemas.length; i++) {
            var schema = schemas[i];
            ModelEvents.registerModel(app, schema);
        }
    }
}

function initDB(app, next) {
    var dbName = AppProperties.get("DATABASE_NAME"),
        dbURL = AppProperties.get("DB_URL");

    Debug._l("Initiating DB service: " + dbName);

    var db = mongoose.createConnection(dbURL);
    db.on('open', function (e) {
        Debug._l("connected to db: " + dbName);
        if (e) {
            throw e;
        }
        DefaultDataHandler.insertDefaultData(db, app.set("permissions"), function () {
            app.set('db', db);

            var dbActions = new DBActions(db, {modelName: "User"});
            dbActions.get("find", {"default": true}, function (err, users) {
                app.set("Guest", users[0]);
            });
            createResourceDir();
            initModelEvents(app);
            next(app);
            bindPort(app);

        });
    });
}
module.exports = function (app, next) {
    populateAppProps(app, next);

};
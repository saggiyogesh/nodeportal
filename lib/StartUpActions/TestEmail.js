/**
 * Startup action to test email settings id enabled in app properties.
 */


var AppProperties = require("../AppProperties");
module.exports = function (app, done) {
    return function (next) {
        if (AppProperties.get("STARTUP_MAIL_TEST")) {
            var Mailer = require("../Mailer");
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
                if (!err) {
                    Debug._l("Mail is configured...")
                }
                next(err, done);
            });
        }
        else {
            next(null, done);
        }
    };
};
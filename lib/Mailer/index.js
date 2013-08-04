/**
 * Utility to send emails.
 */

var nodemailer = require('nodemailer'), getProp = require("./../AppProperties").get,
    MailMessage = require("./MailMessage");

// Create a SMTP transport object

var smtp = getProp("MAIL_KNOWN_SMTP") || "SMTP";

var transport = nodemailer.createTransport(smtp, {
    host: getProp("MAIL_HOST"),
    port: getProp("MAIL_PORT"),
    auth: {
        user: getProp("MAIL_AUTH_USER"),
        pass: getProp("MAIL_AUTH_PASSWORD")
    }
});

exports.MailMessage = MailMessage;
exports.Transport = transport;

/**
 *  Sends mail as per MailMessage.
 * @param MailMessage {MailMessage}
 * @param next     {Function}
 */
exports.sendMail = function (MailMessage, next) {
    transport.sendMail(MailMessage.getMessage(), function (error) {
//        transport.close(); // close the connection pool
        next(error, "success");
    });
};


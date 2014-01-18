/**
 * Class for mail message
 */

var FileUtil = require("../file/FileUtil");

module.exports = MailMessage;

/**
 * Attachment constructor.
 * Options of nodemailer attachment are available
 * @constructor
 */
function Attachment(options) {
    this.fileName = options.fileName;
    this.contents = options.contents;
    this.filePath = options.filePath;
    this.streamSource = options.streamSource;
    this.contentType = options.contentType;
    this.cid = options.cid;
}

/**
 *
 * @param from {String} from email address
 * @param to {String} to email address
 * @param subject {String} Subject of email
 * @param body {String} Body of email
 * @constructor
 */
function MailMessage(from, to, subject, body) {
    var attachments = [];

    var opts = {};

//    this.__defineGetter__('from', function () {
//        return from;
//    });
//    this.__defineGetter__('to', function () {
//        return to;
//    });
//    this.__defineGetter__('subject', function () {
//        return subject;
//    });
//    this.__defineGetter__('body', function () {
//        return body;
//    });

    /**
     * Chainable method to attach attachment to this mail bean
     * @param options
     * @returns {MailMessage}
     */
    this.addAttachment = function (options) {
//        var attachment = new Attachment(options);
//        attachments.push(attachment);
        attachments.push(options);
        return this;
    };

    /*this.getAttachments = function () {
     return attachments;
     };*/

    /**
     * Returns message object
     * See nodemailer message object
     * @param [generateTextFromHTML] {Boolean}
     * @returns {Object}
     */
    this.getMessage = function (generateTextFromHTML) {
        var message = {
            from: from,
            to: to,
            subject: subject,
            html: body,
            generateTextFromHTML: generateTextFromHTML,
            attachments: attachments
        };
        return _.extend(message, opts);
    };

    /**
     * Chainable method, compiles jade template & sets the html to body of MailMessage.
     * @param app {Object} Express app object
     * @param jadeTmplPath {String} jade template path to be rendered as email html
     * @param options {Object} options to be passed to jade compile html
     * @returns {MailMessage}
     */
    this.renderBodyFromJadeTemplate = function (app, jadeTmplPath, options) {
        body = FileUtil.parseJadeTemplate(app, jadeTmplPath, options);
        return this;
    };

    /**
     * Chainable method used to set other Node mailer options
     * @param options {Object} other Node Mailer options
     * @returns {MailMessage}
     */
    this.setMailOptions = function (options) {
        opts = options;
        return this;
    };

    /**
     * Chainable method sets bcc address to email message
     * @param bcc {Array | String} Array or String of email address
     * @returns {MailMessage}
     */
    this.setBcc = function (bcc) {
        if (_.isArray(bcc)) {
            bcc = bcc.join();
        }
        opts.bcc = bcc;
        return this;
    };

    /**
     * Chainable method sets cc address to email message
     * @param cc  {Array | String} Array or String of email address
     * @returns {MailMessage}
     */
    this.setCc = function (cc) {
        if (_.isArray(cc)) {
            cc = cc.join();
        }
        opts.cc = cc;
        return this;
    };

}
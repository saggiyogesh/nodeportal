/**
 * Class for mail message
 */

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

function MailMessage(from, to, subject, body) {
    var attachments = [];

    this.__defineGetter__('from', function () {
        return from;
    });
    this.__defineGetter__('to', function () {
        return to;
    });
    this.__defineGetter__('subject', function () {
        return subject;
    });
    this.__defineGetter__('body', function () {
        return body;
    });

    /**
     * Chainable method to attach attachment to this mail bean
     * @param options
     * @returns {this}
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
     * @param generateTextFromHTML {Boolean}
     * @returns {Object}
     */
    this.getMessage = function (generateTextFromHTML) {
        var message = {
            from: this.from,
            to: this.to,
            subject: this.subject,
            html: this.body,
            generateTextFromHTML: generateTextFromHTML,
            attachments: attachments
        };
        return message;
    };
}
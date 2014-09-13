/**
 * Flash Messages, displaying for each plugin.
 * Inspired from Alex Young Notepad app
 */

var PluginHelper = require("../PluginHelper"), util = require('util'), i18n = require("../i18n"), getMsg = i18n.get;
function FlashMessage(type, messages) {
    this.type = type;
    this.messages = typeof messages === 'string' ? [messages] : messages;
}

FlashMessage.prototype = {
    /* get icon() {
     switch (this.type) {
     case 'info':
     return 'ui-icon-info';
     case 'error':
     return 'ui-icon-alert';
     }
     },*/

    get stateClass() {
        switch (this.type) {
            case Types.INFO:
                return 'alert-info';
            case Types.ERROR:
                return 'alert-error';
            case Types.SUCCESS:
                return 'alert-success';
        }
    },

    toHTML: function () {
        return '<div class="alert ' + this.stateClass + ' ">' +
            ' <button class="close" data-dismiss="alert">×</button>' + this.messages.join('<br/>') +
            '</div>';
    }
};

/**
 * Method returns html of flash message.
 * @param req
 * @param pluginNamespace
 * @returns {String }
 */
exports.Messages = function (req, pluginNamespace) {
    var messages = req.session.flash;
    if (messages && util.inspect(messages).indexOf(pluginNamespace + ":") > -1) {
        var html = '';
        Object.keys(Types).forEach(function (type) {
//            type = pluginNamespace + ":" + Types[type];
            var nsType = pluginNamespace + ":" + Types[type],
                message = messages[nsType];

            if (message && message.length > 0) {
                html += new FlashMessage(Types[type], message).toHTML();
                req.flash(nsType);
            }
        });
        return html;
    }
};

exports.setMessage = function (obj) {
    var req = obj.req, type = PluginHelper.getNamespace(req) + ":" + obj.type, msg = obj.msg;
    req.flash(type, msg);
};

exports.setErrorMessage = function (req, msg) {
    this.setMessage({req: req, type: Types.ERROR, msg: msg});
};

exports.setInfoMessage = function (req, msg) {
    this.setMessage({req: req, type: Types.INFO, msg: msg});
};

exports.setSuccessMessage = function (req, msg) {
    this.setMessage({req: req, type: Types.SUCCESS, msg: msg});
};

exports.setErrorMessageByKey = function (req, key) {
    this.setMessage({req: req, type: Types.ERROR, msg: getLocalizedMsg(key)});
};

exports.setInfoMessageByKey = function (req, key) {
    this.setMessage({req: req, type: Types.INFO, msg: getLocalizedMsg(key)});
};

exports.setSuccessMessageByKey = function (req, key) {
    this.setMessage({req: req, type: Types.SUCCESS, msg: getLocalizedMsg(key)});
};

function getLocalizedMsg(key) {
    return getMsg({key: key});
}
var Types = exports.Types = {
    ERROR: "error", INFO: "info", SUCCESS: "success"
};


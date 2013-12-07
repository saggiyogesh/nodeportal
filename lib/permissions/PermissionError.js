/**
 * This error is thrown when user role is not having permission to perform any action
 */

function PermissionError(message, userName, actionKey) {
    this.name = "PermissionError";
    this.message = message || (userName && actionKey) ? "Permission Error. User " + userName + " is not authorized to " + actionKey : "Permission Error";
    this.localizedMessageKey = "permission-error";
}


util.inherits(PermissionError, Error);

module.exports = PermissionError;
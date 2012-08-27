/**
 * This error is thrown when user role is not having permission to perform any action
 */

function PermissionError(message){
    this.name = "PermissionError";
    this.message = message || "Permission Error";
    this.localizedMessageKey = "permission-error";
}


util.inherits(PermissionError, Error);

module.exports = PermissionError;
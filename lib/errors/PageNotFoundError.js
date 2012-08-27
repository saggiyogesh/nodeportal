/**
 * This error is thrown when requested page is not found
 */

function PageNotFoundError(message){
    this.name = "PageNotFoundError";
    this.message = message || "Page Not Found Error";
    this.localizedMessageKey = "page-not-found";
}


util.inherits(PageNotFoundError, Error);

module.exports = PageNotFoundError;
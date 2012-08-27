/**
 * This error is thrown modelId value is not correct, this checked when model not retrieved by this modelId value
 */

function InvalidModelIdValue(message){
    this.name = "InvalidModelIdValue";
    this.message = message;
   // this.localizedMessageKey = "invalid-model-id-error";
}


util.inherits(InvalidModelIdValue, Error);

module.exports = InvalidModelIdValue;
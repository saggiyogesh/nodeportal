/**
 * This will renders errors for app settings. Inherit SettingsRenderer.
 * ErrorRenderer methods are also included.
 */
var SettingsRenderer = require("./SettingsRenderer"),
    ErrorRenderer = require("./ErrorRenderer");

/**
 * Constructor to create SettingsErrorRenderer
 * @param err
 * @param req
 * @param res
 * @constructor
 */
function SettingsErrorRenderer(err, req, res) {
    SettingsRenderer.call(this, req, res);
    Object.defineProperties(this, {
        err: {
            value: err || new Error()
        }
    });
    req.attrs.isErrorPage = true;
}

util.inherits(SettingsErrorRenderer, SettingsRenderer);

_.each(ErrorRenderer.prototype, function(func, key){
    //inheriting prototype methods from ErrorRenderer
    if(key !== "constructor" && key !== "__proto__"){ //rejecting constructor & __proto__
        SettingsErrorRenderer.prototype[key] = func;
    }
});

module.exports = SettingsErrorRenderer;


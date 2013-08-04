/**
 * Lib use to append the script to be executed for each request at the page bottom
 * should be available in all plugins jade views
 */
var FileUtil = require("../file/FileUtil");
var SCRIPT_START_TAG = "<script>", SCRIPT_END_TAG = "</script>";
var scripts = [SCRIPT_START_TAG];


var bottomScriptsTemplate = ['<script type="text/javascript" src="', '', '"></script>'], pagePluginIds = [],
    urls = [];

function functionString(code) {
    return ["(function(){", code, "})();"].join("");
}

exports.addBottomScript = function (pluginId, url) {
    if (!url) return;

    if (pagePluginIds.join("").indexOf(pluginId) == -1) {
        urls.push(url);
        pagePluginIds.push(pluginId);
    }
};

exports.push = function (code) {
    if (!code) {
        return;
    }
    scripts.push(code);
};

exports.add = function (app, code, modules) {
    if (!code) {
        return;
    }
//    scripts.push(functionString(code));
    if (!modules) {
        scripts.push(exports.addPluginInlineScript(app, code));
    } else {
        scripts.push(exports.addInlineScript(app, modules, code));
    }


//    Debug._l("script add")
//        Debug._l(scripts)
};

/**
 * Note that this fn should be called only on page bottom
 */
exports.render = function () {
    scripts.push(SCRIPT_END_TAG);
    while (urls.length > 0) {
        bottomScriptsTemplate[1] = urls.pop();
        scripts.push(bottomScriptsTemplate.join(""));
    }

    var script = scripts.join("");

    //reinitialize for next request
    scripts = [SCRIPT_START_TAG];
    pagePluginIds = [];
    bottomScriptsTemplate[1] = "";
    return script;
};

/**
 *
 * @param app
 * @param modules {String comma separated}
 * @param jsCode
 */
exports.addInlineScript = function (app, modules, jsCode) {
    if (!modules || !jsCode) {
        return;
    }
    var path = FileUtil.realPath(app.set("appPath"), "lib", "PageScript", "script.jade");
    var code = FileUtil.parseJadeTemplate(app, path, {modules:modules, code:jsCode}).replace(SCRIPT_START_TAG, "").replace(SCRIPT_END_TAG, "");
    return code;
};

exports.addPluginInlineScript = function (app, jsCode) {
    return exports.addInlineScript(app, "plugin", jsCode);
};

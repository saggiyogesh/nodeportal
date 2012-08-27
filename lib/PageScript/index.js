/**
 * Lib use to append the script to be executed for each request at the page bottom
 * should be available in all plugins jade views
 */
var scripts = ["<script>"];


var bottomScriptsTemplate = ['<script type="text/javascript" src="', '', '"></script>'], pagePluginIds = [],
    urls = [];

function functionString(code) {
    return ["(function(){", code, "})();"].join("");
}

exports.addBottomScript = function (pluginId, url) {
    if(!url) return;

    if(pagePluginIds.join("").indexOf(pluginId) == -1){
        urls.push(url);
        pagePluginIds.push(pluginId);
    }
};

exports.add = function (code, req) {
    if (!code) {
        return;
    }
    scripts.push(functionString(code));
//    Debug._l("script add")
//        Debug._l(scripts)
};

/**
 * Note that this fn should be called only on page bottom
 */
exports.render = function () {
    scripts.push("</script>");
    while(urls.length > 0 ){
        bottomScriptsTemplate[1] = urls.pop();
        scripts.push(bottomScriptsTemplate.join(""));
    }

    var script = scripts.join("");

    //reinitialize for next request
    scripts = ["<script>"];
    pagePluginIds = [];
    return script;
};

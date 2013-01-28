var FileUtil = require("../file/FileUtil")
var themeFilesCache = {};


function renderScriptTag(url) {
    var scriptTemplate = ['<script type="text/javascript" src="', '', '"></script>'];
    scriptTemplate[1] = url;
    return scriptTemplate.join("");
}

function renderLinkTag(url) {
    var linkTemplate = ['<link rel="stylesheet" href="', '', '" type="text/css"/>'];
    linkTemplate[1] = url;
    return linkTemplate.join("");
}

/**
 * Gets css file path as array by theme normalized name
 * @param name
 */
var getThemeCssNames = exports.getThemeCssNames = function (name) {
    return themeFilesCache[name]["css"] || [];
};

/**
 * Gets js file path as array by theme normalized name
 * @param name
 */
var getThemeJsNames = exports.getThemeJsNames = function (name) {
    return themeFilesCache[name]["js"] || [];
};

/**
 * Inits the cache object for theme files
 * @param {String} themeName
 */
exports.initCache = function (themeName) {
    themeFilesCache[themeName] = {css:[], js:[]};
};

/**
 * Set a css file path by theme normalized name
 * If for eg. value of filePath for style.css in default theme will be default/css/style.css
 * @param name
 * @param filePath
 */
exports.setThemeCssNames = function (name, filePath) {
    themeFilesCache[name]["css"].push(filePath);
};

/**
 * Same as css file path
 * @param name
 * @param filePath
 */
exports.setThemeJsNames = function (name, filePath) {
    themeFilesCache[name]["js"].push(filePath);
};

/**
 * Returns the html of theme css link tags
 * @param name
 */
exports.themeCSS = function (name) {
    var ret = [];
    getThemeCssNames(name).forEach(function (filePath) {
        ret.push(renderLinkTag("/static/?type=theme&path=" + filePath));
    });
    return ret.join("");
};

/**
 * Returns the html of theme js script tags
 * @param name
 */
exports.themeJS = function (name) {
    var ret = [];
    getThemeJsNames(name).forEach(function (filePath) {
        ret.push(renderScriptTag("/static/?type=theme&path=" + filePath));
    });
    return ret.join("");
};

/**
 * Sets file info to theme files object
 * @param {String} folderType
 * @param {String} themeName
 * @param {String} fileName
 */
exports.setThemeFile = function (folderType, themeName, fileName) {
    var fileId = themeName + "/" + folderType + "/" + fileName;
    switch (folderType) {
        case "css":
            exports.setThemeCssNames(themeName, fileId);
            break;
        case "js":
            exports.setThemeJsNames(themeName, fileId);
            break;
    }
};

/**
 * Removes file name from theme files cache
 * @param {String} folderType
 * @param {String} themeName
 * @param {String} fileName
 */
exports.removeThemeFile = function (folderType, themeName, fileName) {
    var fileId = themeName + "/" + folderType + "/" + fileName, arr, index;
    switch (folderType) {
        case "css":
            arr = themeFilesCache[themeName]["css"];
            break;
        case "js":
            arr = themeFilesCache[themeName]["js"];
            break;
    }

    index = _.indexOf(arr, fileId);
    delete arr[index];
};

/**
 * Returns the dockbar html per request
 * @param {Object} req
 * @return {String} dockbar html
 */
exports.dockbar = function (req) {
    var app = req.app, path = app.set("views") + "/shell/app/themeHelper/dockbar.jade";
    return FileUtil.parseJadeTemplate(app, path, {req:req})
};

/**
 * Returns plugin tool html per options
 * @param {Object} req
 * @param {Object} options
 * @return {String} plugin tool html
 */
exports.pluginTools = function (req, options) {
    var app = req.app, path = app.set("views") + "/shell/app/themeHelper/plugin_tools.jade";
    return FileUtil.parseJadeTemplate(app, path, options);
};
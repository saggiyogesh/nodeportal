var FileUtil = require("../file/FileUtil"),
    staticUtil = require("../static/Util");
var themeFilesCache = {};

exports.CSS_FOLDER_NAME = "css";
exports.JS_FOLDER_NAME = "js";

function renderScriptTag(url) {
    var scriptTemplate = ['<script type="text/javascript" src="', '/', '', '"></script>'];
    scriptTemplate[2] = url;
    return scriptTemplate.join("");
}

function renderLinkTag(url) {
    var linkTemplate = ['<link rel="stylesheet" href="', '/', '', '" type="text/css"/>'];
    linkTemplate[2] = url;
    return linkTemplate.join("");
}

/**
 * Gets css file path as array by theme normalized name
 * @param name
 */
var getThemeCssNames = exports.getThemeCssNames = function (name) {
    return themeFilesCache[name][exports.CSS_FOLDER_NAME] || [];
};

/**
 * Gets js file path as array by theme normalized name
 * @param name
 */
var getThemeJsNames = exports.getThemeJsNames = function (name) {
    return themeFilesCache[name][exports.JS_FOLDER_NAME] || [];
};

/**
 * Inits the cache object for theme files
 * @param {String} themeName
 */
exports.initCache = function (themeName) {
    themeFilesCache[themeName] = {css: [], js: []};
};

/**
 * Set a css file path by theme normalized name
 * If for eg. value of filePath for style.css in default theme will be default/css/style.css
 * @param name
 * @param filePath
 */
exports.setThemeCssNames = function (name, filePath) {
    themeFilesCache[name][exports.CSS_FOLDER_NAME].push(filePath);
};

/**
 * Same as css file path
 * @param name
 * @param filePath
 */
exports.setThemeJsNames = function (name, filePath) {
    themeFilesCache[name][exports.JS_FOLDER_NAME].push(filePath);
};

/**
 * Returns the html of theme css link tags
 * @param name
 */
exports.themeCSS = function (name) {
    var ret = [];
    getThemeCssNames(name).forEach(function (filePath) {
        ret.push(renderLinkTag(filePath));
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
        ret.push(renderScriptTag(filePath));
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
        case exports.CSS_FOLDER_NAME:
            exports.setThemeCssNames(themeName, fileId);
            break;
        case exports.JS_FOLDER_NAME:
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
        case exports.CSS_FOLDER_NAME:
            arr = themeFilesCache[themeName][exports.CSS_FOLDER_NAME];
            break;
        case exports.JS_FOLDER_NAME:
            arr = themeFilesCache[themeName][exports.JS_FOLDER_NAME];
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
    return FileUtil.parseJadeTemplate(app, path, {req: req})
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

/**
 * Include themes folder to static public folder
 * @param app
 */
exports.setThemesStaticFolder = function (app) {
    //for default theme
    staticUtil.setStaticFolder(app, app.set('views') + '/shell/theme/');

    //for custom themes
    staticUtil.setStaticFolder(app, app.set('views') + '/themes/');
};
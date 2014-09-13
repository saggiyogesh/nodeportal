var _ = require('underscore'),
    path = require('path'),
    util = require("util"), getProp = require("./AppProperties").get,
    os = require('os'), clone = require("clone"), FileUtil = require("./file/FileUtil");
var Utils = {
    //Utility function to convert function into string.
    //Generalized implementation of toString()
    toString: function (obj) {
        var str = ['{'];
        for (var key in obj) {
            if (!_.isUndefined(key)) {
                if (!_.isFunction(obj[key])) {
                    str.push(key + ':');
                    str.push(_.isUndefined(obj[key]) ? '""' : '"' + obj[key] + '"');
                    str.push(', ');
                }
            }
        }
        str.pop();
        str.push('}');
        return str.join('');
    }
};
exports.Utils = Utils;

function showInConsole(str) {
    var fileStr = new Error().stack.split('\n')[3];
    //fileStr = fileStr.substring(fileStr.lastIndexOf("/") + 1, fileStr.lastIndexOf(":"));
    var sep = path.sep;
    fileStr = fileStr.substring(fileStr.indexOf(sep), fileStr.lastIndexOf(":")).split(sep);
    var len = fileStr.length - 2;
    var msg = new Date().toUTCString() + " : " + fileStr.splice(len, 2).join("/");
//    var msg = new Date().toUTCString() + " : " + fileStr;
    process.nextTick(function () {
        console.log(msg + " :: " + str);
    });
}

exports.Debug = {
    _l: function (str) {
        showInConsole(str);

    },
    _i: util.inspect,
    _li: function (string, obj, isInspect) {
        var inspect;
        if (obj) {
            inspect = isInspect ? util.inspect(obj) : obj;
        }
        showInConsole(string + " " + (inspect ? inspect : ""));
    }

};


exports.union = function (a, b) {
    if (a && b) {
        var keys = Object.keys(b)
            , len = keys.length
            , key;
        for (var i = 0; i < len; ++i) {
            key = keys[i];
            if (!a.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
    }
    return a;
};

exports.substituteFromArray = function (arr, vals, token) {
    if (!_.isArray(vals)) {
        vals = [vals];
    }
    token = token || "{$$}";
    var i = 0;
    arr.forEach(function (element) {
        if (element === token) {
            arr[i] = vals[i];
        }
        var buf = [];
        i++;
    });
    return arr;
};

exports.substitute = function (string, vals, token) {
    token = token || "{$$}";
    var i = 0;
    while (string.indexOf(token) !== -1) {
        string = string.replace(token, vals[i]);
        i++;
    }
    return string;
};

exports.merge = function (obj1, obj2) {
    return _.extend(obj1, obj2);
};

exports.cloneExtend = function (dest, src) {
    return _.extend(_.clone(dest), src);
};

/**
 * Returns random path in dir directory
 * @param dir
 */
exports.generateRandomPath = function (dir) {
    var name = '';
    for (var i = 0; i < 32; i++) {
        name += Math.floor(Math.random() * 16).toString(16);
    }

    return path.join(dir, name);
};

/**
 * Return random path in /tmp folder
 */
exports.generateTmpRandomPath = function () {
    return exports.generateRandomPath(exports.tmpDir());
};

/**
 * Check whether searchString is in string or not
 * @return boolean
 * @param string
 * @param searchString
 */
exports.contains = function (string, searchString) {
    return string.indexOf(searchString) > -1;
};

/**
 * Checks whether item is in array or not
 * @return boolean
 * @param array
 * @param item
 */
exports.containsArray = function (array, item) {
    return _.contains(array, item);
};

/**
 * Shortcut call to nextTick
 */
exports.tick = process.nextTick;

/**
 * Returns the string in lowercase with spaces replaced by underscore.
 * @param str
 */
exports.normalize = function (str) {
    return str.toLowerCase().replace(/\s+/g, "_");
};

/**
 * Replaces all search string in string by replace
 * @param string {String}
 * @param search {String}
 * @param replace {String}
 * @returns {String}
 */
exports.replaceAll = function (string, search, replace) {
    if (!replace)
        return string;

    return string.replace(new RegExp('[' + search + ']', 'g'), replace);
};

/**
 * Returns tmpDir specific to os.
 * Fixed for node version 6 and above
 */
exports.tmpDir = function () {
    var tmpDir = os.tmpDir && os.tmpDir();
    return tmpDir || process.env.TMPDIR ||
        process.env.TMP ||
        process.env.TEMP ||
        (process.platform === 'win32' ? 'c:\\windows\\temp' : '/tmp');
};

/**
 * Returns true if process is running is windows
 */
exports.isWin = function () {
    return process.platform === 'win32';
};

/**
 * Returns current working directory
 */
exports.cwd = function () {
    return process.cwd();
};

var MIDDLEWARE_MODULES;
exports.getRequestMiddlewares = function () {
    if (MIDDLEWARE_MODULES) {
        //prevent to re request same middlewares
        return MIDDLEWARE_MODULES;
    }

    var m = getProp("REQ_MIDDLEWARES");
    var appPath = exports.getRootPath();
    MIDDLEWARE_MODULES = [];
    m.split(",").forEach(function (path) {
        MIDDLEWARE_MODULES.push(require(appPath + "/" + path));
    });
    return MIDDLEWARE_MODULES;
};

var SETTINGS_MIDDLEWARE_MODULES;
exports.getSettingsMiddlewares = function () {
    if (SETTINGS_MIDDLEWARE_MODULES) {
        //prevent to re request same middlewares
        return SETTINGS_MIDDLEWARE_MODULES;
    }
    SETTINGS_MIDDLEWARE_MODULES = [];
    SETTINGS_MIDDLEWARE_MODULES.push(require("./permissions/Impersonate"));
    SETTINGS_MIDDLEWARE_MODULES.push(require("./permissions/SettingsPagePermission"));
    return SETTINGS_MIDDLEWARE_MODULES;
};

var LOCALE_ROUTE;
exports.getLocaleRoute = function () {
    if (LOCALE_ROUTE) {
        return LOCALE_ROUTE;
    }
    var availableLocales = getProp("AVAILABLE_LOCALES").split(",");
    LOCALE_ROUTE = "/:locale(" + availableLocales.join("|") + ")?";
    return LOCALE_ROUTE;
};

var APP_SETTINGS_ROUTE;
exports.getAppSettingsRoute = function () {
    var appURL = getProp("APP_URL"), settingsURL = getProp("SETTINGS_URL"),
        localeRoute = exports.getLocaleRoute();
    if (APP_SETTINGS_ROUTE) {
        return APP_SETTINGS_ROUTE;
    }
    APP_SETTINGS_ROUTE = appURL + localeRoute + settingsURL;
    return APP_SETTINGS_ROUTE;
};

/**
 * Returns relative url of app settings. Include locale parameter if present
 * @param req {Object} Request object
 * @returns {String} relative url of app settings
 */
exports.getAppSettingsURL = function (req) {
    var appURL = getProp("APP_URL"), settingsURL = getProp("SETTINGS_URL"),
        locale = req.params.locale;
    return appURL + (locale ? ("/" + locale) : "" ) + settingsURL;
};

/**
 * @param pluginId {String} setting's plugin id
 * @returns {string} Permission schema key for settings plugin
 */
exports.getSettingsPluginPermissionSchemaKey = function (pluginId) {
    return "settings.plugin." + pluginId;
};

/**
 * https://github.com/pvorb/node-clone
 */
exports.clone = clone;

var realPath = FileUtil.realPath;

Object.defineProperty(exports, "realPath", {
    get: function () {
        return realPath;
    }
});

var appPath = process.cwd();
var viewsPath = realPath(appPath, 'views');
var libPath = realPath(appPath, "lib");


/**
 * Returns application real path
 * @returns {String}
 */
exports.getRootPath = function () {
    return appPath;
};

/**
 * Returns views real path
 * @returns {String}
 */
exports.getViewsPath = function () {
    return viewsPath;
};

/**
 * Returns libs real path
 * @returns {String}
 */
exports.getLibPath = function () {
    return libPath;
};

/**
 * Returns plugins directory real path
 * @returns {String}
 */
exports.getPluginsPath = function () {
    return realPath(exports.getRootPath(), "plugins");
};

/**
 * Returns data directory real path
 * @returns {String}
 */
exports.getDataDirPath = function () {
    return realPath(exports.getRootPath(), getProp("DATA_FOLDER_PATH"));
};

/**
 * Returns resources directory real path
 * @returns {String}
 */
exports.getResourcesDirPath = function () {
    return realPath(exports.getDataDirPath(), "resources");
};

/**
 * Returns custom themes directory real path
 * @returns {String}
 */
exports.getThemesDirPath = function () {
    return realPath(exports.getViewsPath(), "themes");
};

/**
 * Returns custom layouts directory real path
 * @returns {String}
 */
exports.getLayoutsDirPath = function () {
    return realPath(exports.getViewsPath(), "layouts");
};

/**
 * Returns users profile pics directory real path
 * @returns {String}
 */
exports.getUserProfilePicDirPath = function () {
    return realPath(exports.getResourcesDirPath(), "users");
};

/**
 * Returns default profile pic url from gravatar
 * @returns {string}
 */
exports.getDefaultProfilePicURL = function () {
    return "//www.gravatar.com/avatar/00000000000000000000000000000000?d=mm&s=300";
};

/**
 * Returns user's profile pic, if not uploaded then gravatar is return
 * @param {Object} user User model.
 * @returns {String}
 */
exports.getUserProfilePicURL = function (user) {
    if (!user) {
        return exports.getDefaultProfilePicURL();
    }


    var profilePic = user.profilePic || {};
    var picURL;
    if (profilePic) {
        if (profilePic.uploaded == true) {
            picURL = getProp("APP_URL") + "/userManage/profilePic/" + user.userId;
        }

        if (!picURL) {
            if (profilePic.gravatar) {
                picURL = "//www.gravatar.com/avatar/" + profilePic.gravatar + "?d=mm&s=300";
            }
            else {
                picURL = exports.getDefaultProfilePicURL();
            }
        }
    }
    return picURL;
};

/**
 *
 * @param boolString
 * @returns {Boolean}
 */
exports.parseStringToBoolean = function (boolString) {
    return boolString ? JSON.parse(boolString) : false;
};

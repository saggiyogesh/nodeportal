var _ = require('underscore'),
    path = require('path'),
    util = require("util"), getProp = require("./AppProperties").get;
var Utils = {
    //Utility function to convert function into string.
    //Generalized implementation of toString()
    toString:function (obj) {
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
    fileStr = fileStr.substring(fileStr.lastIndexOf("/") + 1, fileStr.lastIndexOf(":"));

    var msg = new Date().toUTCString() + " : " + fileStr;

    console.log(msg + " :: " + str);
}

exports.Debug = {
    _l:function (str) {
        showInConsole(str);

    },
    _i:util.inspect,
    _li:function (string, obj, isInspect) {
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

exports.cloneExtend = function (dest, src) {
    return _.extend(_.clone(dest), src);
};

exports.generateRandomPath = function (dir) {
    var name = '';
    for (var i = 0; i < 32; i++) {
        name += Math.floor(Math.random() * 16).toString(16);
    }

    return path.join(dir, name);
};

exports.generateTmpRandomPath = function () {
    return exports.generateRandomPath("/tmp")
};

exports.contains = function (string, searchString) {
    return string.indexOf(searchString) > -1 ? true : false;
};
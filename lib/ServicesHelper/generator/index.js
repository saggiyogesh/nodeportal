var assert = require("assert"), path = require("path"), util = require("util"),
    async = require("async"), _ = require("underscore"),
    FileUtil = require("../../file/FileUtil"),
    utils = require("../../utils"),
    CodeGenerator = require("./CodeGenerator");

function getFolderAndFileNames(name) {
    return {
        folderName: name + "Service",
        jsFileNames: {
            index: "index.js",
            BaseService: name + "BaseService.js",
            ServiceAuth: name + "ServiceAuth.js"
        }
    }
}

//console.log(util.inspect(CodeGenerator, true))

/**
 * Replaces the _themeId like argument in filter to actual (themeId) argument
 * @param tmpl
 * @param args
 * @returns {*}
 */
function argumentReplacer(tmpl, args) {
    args.forEach(function (arg) {
        tmpl = tmpl.replace(new RegExp('"_' + arg + '"', 'g'), arg)
    });
    return tmpl;
}

function generateFinders(config, options) {
    var finders = [], authFinders = [];
    _.each(config.finders, function (finderConf, finderName) {
        console.log(finderName + " : " + finderConf);
        var args = finderConf.arguments
        if (!_.isArray(args)) {
            args = [args];
        }
        var filter = JSON.stringify(finderConf.query);

        console.log("filter stringify: " + filter);

        var tmpl = CodeGenerator.Compiled.finder({
            name: options.name,
            finderName: finderName,
            finderArgs: args.join() + ( (args.length > 0 ) ? "," : ""),
            finderMethod: finderConf.method,
            finderFilter: filter
        });

        finders.push(argumentReplacer(tmpl, args));

        //generate auth finder

        var tmpl = CodeGenerator.Compiled.finderAuth({
            name: options.name,
            finderName: finderName,
            finderArgs: args.join() + ( (args.length > 0 ) ? "," : ""),
            finderMethod: finderConf.method,
            finderFilter: filter
        });

        authFinders.push(argumentReplacer(tmpl, args));
    });


    options.finders = finders.join("");
    options.authFinders = authFinders.join("");
};

function process(confFilePath, dest, next) {
    var confFile = require(confFilePath);

    var options = {
        name: confFile.name,
        finders: "",
        authFinders: ""
    };
    assert(options.name, "Model name not found");
    options.path = path.resolve(confFilePath);
    options.path = path.relative(utils.getRootPath(), options.path).replace(/\\/g, "/")
//    utils.isWin() && options.path.replace(/\\/g, "/");
    console.log("> " + options.path);
    assert(options.path, "Model path not found");

    generateFinders(confFile, options);

    //TODO generate finders for pagination.
    //if method is find then generate pagination

    //creating dir & files
    var dir = getFolderAndFileNames(options.name);
    var serviceDirPath = dest + "/" + dir.folderName;
    console.log(serviceDirPath)
    async.series([
        function (n) {
            FileUtil.existsThenCreateDir(serviceDirPath, n)
        },
        function (n) {
            console.log(options.finders)
            var err;
            try {
                _.each(dir.jsFileNames, function (name, key) {
                    var path = serviceDirPath + "/" + name;
                    if (FileUtil.exists(path)) {
                        if (key !== "index") {    //index will not be written again if exists
                            CodeGenerator.writeJSFile(path, key, options);
                        }
                    } else {
                        CodeGenerator.writeJSFile(path, key, options);
                    }
                });
            } catch (e) {
                err = e;
            }
            n(err);
        }
    ], next);

}

module.exports = process;

//process("./np-model-page", __dirname);

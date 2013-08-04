var im = require("../../../ImageMagick"),
    exec = require('child_process').exec,
    FileUtil = require("../../FileUtil");

module.exports = function (options, next) {
    options.resize = options.resize || 50;
    if (!options.outFile) {
        return next(new Error("Missing options outFile"));
    }
    var cwd = __dirname, cmd = "bash ./captcha -r " + options.resize + " " + options.outFile;
    if (utils.isWin()) {
        var cwd = utils.cwd(), shPath = FileUtil.realPath(cwd, "win_bash", "sh.exe");
        cmd = 'cmd.exe /c ""' + shPath + '" --login -i" ' + FileUtil.realPath(__dirname, 'captcha') + ' ' + options.outFile;
        cwd = utils.tmpDir();
    }
    im(cmd, {cwd:cwd}, function (error, stdout, stderr) {
//        Debug._l(stderr);
        next(error, {text:stdout.trim(), outFile:options.outFile});
    });
};

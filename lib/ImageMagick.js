var exec = require('child_process').exec;

module.exports = function (cmd, options, next) {
    if (!cmd) {
        return next(new Error("Missing imagemagick command"));
    }
    exec(cmd, options, function (error, stdout, stderr) {
        next(error, stdout, stderr);
    });
};

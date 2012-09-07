var exec = require('child_process').exec,
    path = require("path");
exports.createPortal = function (location) {
    var cmd = "cp -r " + path.join(__dirname, "../..") + "/. " + location;
    var ex = exec(cmd, function (error, stdout, stderr) {
        if (error) throw error
        console.log("");
        console.log("New portal is ready at: " + location);
        console.log(stderr);
    });
};

var exec = require('child_process').exec,
    path = require("path")
exports.start = function () {
    var cmd = "node /home/yogesh/Node_portal/nodefirstapp/index.js ";
    console.log(__dirname);
    console.log("cwd:" + process.cwd());
    console.log("cwd:" + path.join(process.cwd(), ".."));
    var ex = exec("nohup node index.js 3000 >  output.log", {cwd:path.join(process.cwd(), "..") }, function (error, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        if (error) throw error
    });

//    console.log(ex);

    ex.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
    });

    ex.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });

    ex.on('exit', function (code) {
        console.log('child process exited with code ' + code);
    });


};

//exports.start();
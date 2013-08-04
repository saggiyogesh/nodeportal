var FileUtil = require('./file/FileUtil'),
    AppProperties = require("./AppProperties"),
    getProp = AppProperties.get,
    imCaptcha = require("./file/captcha/imageMagick"),
    IM = "imagemagick";

exports.render = function(req, res){
    var outFile = utils.generateTmpRandomPath()+".jpg";
    var ImageHandler = getProp("IMAGE_HANDLER");
    if (ImageHandler === IM) {
        //Debug._l(outFile);
        imCaptcha({outFile:outFile}, function(err, obj){
            if(err){
                Debug._l(err);
                return;
            }
            if(obj.hasOwnProperty("text")){
                FileUtil.readImage(outFile, function (err, data) {
                    Debug._l(err);
                    if (!err) {
                        res.contentType(outFile);
                        res.send(data);
                        req.session.captchaText = obj.text;
                    }
                });
            }
        });
    }
};

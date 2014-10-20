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
                err && Debug._l(err);
                return;
            }
            if(obj.hasOwnProperty("text")){
                FileUtil.readImage(outFile, function (err, data) {
                    err && Debug._l(err);
                    if (!err) {
                        req.session.captchaText = obj.text;
                        res.contentType(outFile);
                        res.send(data);
//                        Debug._l(obj.text )
//                        Debug._l(req.session.captchaText )
                    }
                });
            }
        });
    }
};

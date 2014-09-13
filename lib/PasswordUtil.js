var AppProperties = require("./AppProperties"),
    crypto = require('crypto');

var BCRYPT = "bcrypt";

function getSHA1Hash(str) {
    return crypto.createHash('sha1').update(str).digest('hex');
}
exports.encrypt = function (password, next) {
    var algo = AppProperties.get("PASSWORD_ENC_ALGO");
    if (algo == BCRYPT) {
        utils.tick(function(){
            var bcrypt = require('bcrypt-nodejs');
            var salt = bcrypt.genSaltSync(10);
            next(null, bcrypt.hashSync(password, salt));
        });
    }
    else {
        try {
            next(null, getSHA1Hash(password));
        } catch (e) {
            next(e);
        }
    }

};

exports.encryptSync = function(password){
    var algo = AppProperties.get("PASSWORD_ENC_ALGO");
    if (algo == BCRYPT) {
        var bcrypt = require('bcrypt-nodejs');
        var salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }
    else {
        return getSHA1Hash(password);
    }
};

exports.check = function (password, hash, next) {
    var algo = AppProperties.get("PASSWORD_ENC_ALGO");
    if (algo == BCRYPT) {
        var bcrypt = require('bcrypt-nodejs');
        bcrypt.compare(password, hash, function (err, result) {
            next(err, result);
        });
    } else {
        try {
            var result = getSHA1Hash(password) === hash ? true : false;
            next(null, result);
        } catch (e) {
            next(e);
        }
    }
};
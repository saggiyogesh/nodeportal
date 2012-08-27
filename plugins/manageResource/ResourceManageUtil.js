var imageExtensions = ["png", "jpg", "jpeg", "gif", "bmp"];

var documentExtensions = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "rtf", "pdf", "csv", "txt"];

var availableIcons = {file:["aac", "avi", "bmp", "chm", "css", "default", "dll", "doc", "fla", "gif", "htm" , "html",
    "ini", "jar", "jpeg", "jpg", "js", "lasso", "mdb", "mov", "mp3", ",mpg", "other_image", "other_movie", "other_music",
    "other_music2", "pdf", "php", "ppt", "py", "rb", "real", "reg", "rtf", "sql", "swf", "txt", "vbs", "wav", "wma",
    "xls", "xml", "xsl", "zip", "jar", "war", "png"
], folder:["_Close", "_Documents", "_Favourites", "_Image", "_Movie", "_Music", "_Net", "_Open"]};

exports.getIconImage = function (req, model) {
    var type = model.type.toLowerCase(), name = model.name;
    if (type != "folder") {
        if (imageExtensions.join("").indexOf(type) > -1) {
            return "image";
        } else if (availableIcons.file.join("").indexOf(type) > -1) {
            return type;
        }
        else {
            return "default";
        }
    }

    return "_Close";

};

exports.isTypeImage = function (ext) {
    return _.indexOf(imageExtensions, ext.toLowerCase()) > -1 ? true : false;
};
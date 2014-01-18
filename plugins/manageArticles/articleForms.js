var articleId = {
    type: "hidden",
    name: "articleId"
};
var id = {
    type: "hidden",
    name: "id"
};
var redirect = {
    type: "hidden",
    name: "redirect"
};
var version = {
    type: "hidden",
    name: "version"
};
var title = {
    label: "Title",
    type: "text",
    name: "title",
    rules: [ "required"]
};
var content = {
    label: "Content",
    type: "textarea",
    name: "content",
    rules: [ "required"]
};
var displayDate = {
    label: "Display Date",
    type: "date",
    name: "displayDate"
};
var expiryDate = {
    label: "Expiry Date",
    type: "date",
    name: "expiryDate"
};

var update = {
    type: "submit",
    value: "Update"
};
var cancel = {
    type: "cancel",
    value: "Cancel"
};

exports.getArticleEditForm = function () {
    return utils.clone({
            form: {
                id: "fm",
                method: "post",
                action: "updateArticle"
            },
            fields: [articleId, id, redirect, version, title, content, displayDate, expiryDate, update, cancel ]
        }
    );
};
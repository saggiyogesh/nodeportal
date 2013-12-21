var name = {
    label: "Enter Id of an Article",
    type: "text",
    name: "id"
};

var enableComments = {
    label: "Enable Comments",
    type: "checkbox",
    name: "enableComments"
};

var submit = {
    type: "submit",
    value: "Submit"
};

var formObj = {
    form: {
        id: "fm",
        method: "post",
        autocomplete: "off"
    },
    fields: [ name, enableComments, submit]
};

exports.settingsForm = function () {
    return utils.clone(formObj);
};

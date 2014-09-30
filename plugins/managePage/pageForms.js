function checkFriendlyURL(req, model, val, next) {
    if (val.indexOf("/") == -1) {
        val = "/" + val;
    }
    var PageService = req.app.getService("Page");
    PageService.getByFriendlyURL(val, function (err, page) {
        if (err) {
            next(err);
            return;
        }
        else if (page && (model.pageId != page.pageId)) { // this condition will check for update
            next(err, false); //i.e validations fails as page with same friendly url already exists
        }
        else {
            next(err, true);// validation test pass
        }
    });
}

function checkAppUrl(req, model, val, next) {
    var appURL = require(utils.getLibPath() + "/AppProperties").get("APP_URL");
    if (val.indexOf("/") == -1) {
        val = "/" + val;
    }

    if (val === appURL) {
        next(null, false);
    }
    else
        next(null, true);
}

var name = {
    label: "Name",
    type: "text",
    name: "name",
    rules: [ "required"]
};

var friendlyURL = {
    label: "Friendly URL",
    type: "text",
    name: "friendlyURL",
    rules: [ "required", "checkFriendlyURL", "checkAppUrl"]
};

var isHidden = {
    label: "Hidden",
    type: "checkbox",
    name: "isHidden"
};

var isIndex = {
    label: "Index",
    type: "checkbox",
    name: "isIndex"
};
var theme = {
    label: "Theme",
    type: "select",
    name: "theme",
    options: [],
    rules: [ "required"]
};
var layout = {
    label: "Layout",
    type: "select",
    name: "layout",
    options: [],
    rules: [ "required"]
};
var update = {
    type: "submit",
    value: "Update"
};

var cancel = {
    type: "cancel",
    value: "Cancel"
};

var redirect = {
    type: "hidden",
    name: "redirect"
};
var pageId = {
    type: "hidden",
    name: "pageId"
};
var parentPageId = {
    type: "hidden",
    name: "parentPageId"
};
var description = {
    label: "Description",
    type: "textarea",
    name: "description"
};
var keywords = {
    label: "Keywords",
    type: "text",
    name: "keywords"
};
var formObj = {
    form: {
        id: "fm",
        method: "post",
        action: "updatePage",
        autocomplete: "off"
    },
    fields: [ pageId, parentPageId, redirect, name, friendlyURL, theme, layout, isHidden ,
        description, keywords, update, cancel ]
};
exports.PageForm = function (req, next) {
    var ThemeService = req.app.getService("Theme");
    var LayoutService = req.app.getService("Layout");

    var cloneFormObj = utils.clone(formObj), fields = cloneFormObj.fields;

    ThemeService.find({}, function (err, themes) {
        if (err) return next(err);

        var theme = fields[5];
        themes.forEach(function (t) {
            t = t.toObject();
            theme.options.push([t.name, t.themeId]);
        });

        LayoutService.find({}, function (err, layouts) {
            if (err) return next(err);

            var layout = fields[6];
            layouts.forEach(function (l) {
                l = l.toObject();
                layout.options.push([l.name, l.layoutId]);
            });

            cloneFormObj.fields.forEach(function (el) {
                if (el.type != "hidden") {
                    delete  el.disabled;
                }
            });
            next(err, cloneFormObj);
        });

    });
};

var pageOrder = {
    type: "hidden",
    name: "pageOrder"
};
var updatePO = {
    type: "submit",
    value: "Update"
};

var cancelPO = {
    type: "cancel",
    value: "Cancel"
};
var pageOrderFormObj = {
    form: {
        id: "update_order_fm",
        method: "post",
        action: "updatePageOrder"
    },
    fields: [ parentPageId, redirect, pageOrder, updatePO, cancelPO ]
};

exports.updatePageOrderForm = function () {
    return utils.clone(pageOrderFormObj);
};


exports.customValidations = {
    checkFriendlyURL: {ruleFunction: checkFriendlyURL, msgs: {en_US: "Friendly url already exists."}},
    checkAppUrl: {ruleFunction: checkAppUrl, msgs: {en_US: "Friendly url can't be same as app url."}}

};
function checkFriendlyURL(req, model, val, next) {
    if (val.indexOf("/") == -1) {
        val = "/" + val;
    }
    var db = this.db, dbAction = require(req.app.set('appPath') + "/lib/DBActions").getInstanceFromDB(db, "Page");
    dbAction.get("findByFriendlyURL", val, function (err, page) {
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
    var appURL = require(req.app.set("appPath") + "/lib/AppProperties").get("APP_URL");
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
exports.PageForm = function (req, DBActions, next) {
    var dbActionTheme = DBActions.getInstance(req, "Theme"),
        dbActionLayout = DBActions.getInstance(req, "Layout");

    dbActionTheme.get("find", {}, function (err, themes) {
        if (err) return next(err);

        if (themes.length != theme.options.length) { //prevent appending of same theme on each request
            for (var i = 0; i < themes.length; i++) {
                var t = themes[i];
                theme.options.push([t.name, t.themeId]);
            }
        }

        dbActionLayout.get("find", {}, function (err, layouts) {
            if (err) return next(err);

            if (layouts.length != layout.options.length) {
                for (var i = 0; i < layouts.length; i++) {
                    var l = layouts[i];
                    layout.options.push([l.name, l.layoutId]);
                }
            }

            var cloneFormObj = _.clone(formObj);
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
exports.updatePageOrderForm = {
    form: {
        id: "update_order_fm",
        method: "post",
        action: "updatePageOrder"
    },
    fields: [ parentPageId, redirect, pageOrder, updatePO, cancelPO ]
}

exports.customValidations = {
    checkFriendlyURL: {ruleFunction: checkFriendlyURL, msgs: {en_US: "Friendly url already exists."}},
    checkAppUrl: {ruleFunction: checkAppUrl, msgs: {en_US: "Friendly url can't be same as app url."}}

};
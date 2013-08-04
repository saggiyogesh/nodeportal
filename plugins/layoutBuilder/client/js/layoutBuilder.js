define(["pluginURL"], function () {
    var ns = Rocket.Plugin.currentPlugin.namespace, util = Rocket.Util, urls = [],
        io = Rocket.io, createButton, closeButton, openButton, editForm,
        currentLayoutId;

    function getNodeId(id) {
        return  ns + "_" + id;
    }

    function getURL(action, isAppRoute) {
        if (!urls[action]) {
            urls[action] = Rocket.PluginURL({action: action, isAppRoute: isAppRoute});
        }
        return urls[action];
    }

    function showSuccessMsg(msg) {
        util.showSuccessFlash(msg);
    }

    function showErrorMsg(msg) {
        util.showErrorFlash(msg);
    }

    function resetFormArea() {
        editForm.html("");
    }

    function openLayout(layoutId) {
        var options = {
            url: getURL("openLayout") + "/" + layoutId,
            data: {mode: "exclusive"},
            success: function (data) {
                editForm.html(data);
                var forms = editForm.find('form');
                currentLayoutId = layoutId;
                util.toggleButtonDisable(openButton);
                util.toggleButtonDisable(createButton);
                util.toggleButtonDisable(closeButton);
                if (forms) {
                    forms.each(function (i) {
                        var form = this, action = form.action;
                        form.action = action.replace("mode=exclusive&", "");
                    });
                }
            }
        };
        Rocket.ajax(options);
    }

    //Init
    createButton = $("#" + getNodeId("create"));
    closeButton = $("#" + getNodeId("close"));
    openButton = $("#" + getNodeId("open"));
    editForm = $("#" + getNodeId("editForm"));


    //Attach events to nodes
    //handle create event
    createButton.click(function (e) {
        var name = $.trim(prompt("Enter new layout name"));
        if (name) {
            io({
                url: getURL("newLayout") + "/" + name,
                callback: function (isSuccess, message, response) {
                    if (isSuccess) {
                        showSuccessMsg(message);
                    }
                    else {
                        showErrorMsg(message);
                    }
                }
            });
        }
    });

    //handle layout select
    $("." + ns + "-layoutItem").click(function (e) {
        var curTgt = $(e.currentTarget);
        var id = curTgt.data("id");
        if (id) {
            openLayout(id);
        }
    });

    //handle close button event
    closeButton.click(function (e) {
        currentLayoutId = null;
        util.toggleButtonDisable(openButton);
        util.toggleButtonDisable(createButton);
        util.toggleButtonDisable(closeButton);
        resetFormArea();
    });

});
define(["_", "util", "bootstrap"], function () {
    var getPluginsURL = "/app/getPagePlugins",
        addPluginURL = "/app/addPlugin",
        removePluginURL = "/app/removePlugin",
        ADD_TMPL = _.template('<div class="control-group"><label class="control-label" for="<%=pluginId%>"><%=name%></label><div class="controls">' +
            '<input type="checkbox" id="<%=pluginId%>" value="<%=pluginId%>"></div></div>'),
        addPluginsModal = $("#addPluginsModal"),
        addPluginsModalBody = addPluginsModal.find(".modal-body"),
        editPluginModal = $("#editPluginModal"),
        editPluginModalBody = editPluginModal.find(".modal-body"),
        settingsTab = editPluginModalBody.find("#managePluginSettings"),
        permissionsTab = editPluginModalBody.find("#managePluginPermissions");
    (function init() {
        function handleCBClick(e) {
            var tgt = $(e.currentTarget), val = tgt.val(),
                options = {
                    url: addPluginURL,
                    method: "POST",
                    data: {id: val, pageId: Rocket.PageValues.getPageId()},
                    success: function (responseData) {
                        if (responseData) {
                            if (responseData.success == true) {
                                location.reload();
                            }
                            else {

                            }
                        }
                    }
                };
            Rocket.ajax(options);
        }

        $('#addPluginsModal').on('show', function () {
            var options = {
                url: getPluginsURL,
                data: {pageId: Rocket.PageValues.getPageId()},
                success: function (data) {
                    if (data) {
                        var form = addPluginsModalBody.find("form");
                        form.empty();
                        _.each(JSON.parse(data), function (value, key) {
                            form.append(ADD_TMPL({pluginId: key, name: value}));
                        });

                        addPluginsModal.find("form input").click(handleCBClick);
                    }
                }
            };
            Rocket.ajax(options);

        });

    })();

    $(".plugin .tools a.edit").click(function (e) {
        var tgt = $(e.currentTarget), id = tgt.data("id");
        e.preventDefault();
        var options = {
            url: Rocket.Util.getOrigin() + Rocket.PageValues.getPageFriendlyURL() + "/managePlugin/show/" + id + "/" + Rocket.PageValues.getPageId(),
            data: {redirect: location.href,
                mode: "exclusive"},
            success: function (responseData) {
                if (responseData) {
                    editPluginModalBody.html(responseData);

                }
            }
        };
        Rocket.ajax(options);

    });

    $(".plugin .tools a.remove").click(function (e) {
        var tgt = $(e.currentTarget), id = tgt.data("id"),
            options = {
                url: removePluginURL,
                method: "POST",
                data: {id: id, pageId: Rocket.PageValues.getPageId()},
                success: function (responseData) {
                    if (responseData) {
                        if (responseData.success == true) {
                            $("#" + id).remove();
                        }
                    }
                }
            };
        Rocket.ajax(options);
    });
});
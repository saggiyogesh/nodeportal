define(["_", "util", "modal"], function () {
    var getPluginsURL = "/app/getPagePlugins",
        addPluginURL = "/app/addPlugin",
        removePluginURL = "/app/removePlugin",
        ADD_TMPL = _.template('<div class="control-group"><label class="control-label" for="<%=pluginId%>"><%=name%></label><div class="controls">' +
            '<input type="checkbox" id="<%=pluginId%>" value="<%=pluginId%>"></div></div>'),
        addPluginsModal = new Rocket.Modal({
            id: "addPlugins",
            title: "Add Plugins",
            body: '<form class="form-horizontal"></form>',
            onShow: function () {
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

                            addPluginsModalBody.find("form input").click(function (e) {
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
                            });
                        }
                    }
                };
                Rocket.ajax(options);

            }
        }),
        addPluginsModalBody = addPluginsModal.getBody(),
        editPluginModal = new Rocket.Modal({
            id: "editPlugin",
            title: "Edit Plugin",
            width: 0.7
        }),
        editPluginModalBody = editPluginModal.getBody();

    //open add plugin model on click
    $('#add_plugins').on('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        addPluginsModal.show();
    });


    $(".plugin .tools a.edit").click(function (e) {
        var tgt = $(e.currentTarget), id = tgt.data("id");
        e.preventDefault();
        var options = {
            url: Rocket.Util.getOrigin() + Rocket.PageValues.getPageFriendlyURL() + "/managePlugin/show/" + id + "/" + Rocket.PageValues.getPageId(),
            data: {redirect: location.href,
                mode: "exclusive"},
            success: function (responseData) {
                if (responseData) {
                    editPluginModal.show();
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
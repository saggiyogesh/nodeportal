define(["pluginURL"], function () {
    Rocket.bind("managePlugin:load", function (e) {
        var managePlugin = $("#editPlugin_Modal .managePlugin"),
            editTitleForm = managePlugin.find("form#managePluginEditTitle"),
            ns = managePlugin.data("ns"),
            pageId = managePlugin.data("pageid"),
            instanceId = managePlugin.data("instanceid") || ns,
            settingsArea = managePlugin.find("#settingsArea"),
            permissionArea = managePlugin.find("#managePluginPermissions"),
            isSettingsPlugin = managePlugin.data("settingsplugin"),
            hasSettingsTab = managePlugin.find("a[data-id='settings']").length > 0 ;

        function appendFormFields(form) {
            form = $(form);
            if (form.find('#managePlugin_ns').length > 0) {
                form.find('#managePlugin_ns').val(ns);
                form.find('#managePlugin_pageId').val(pageId);
                return;
            }

            var inputNS = $('<input type="hidden" />').attr('name', 'ns').val(ns).attr('id', 'managePlugin_ns'),
                inputPage = $('<input type="hidden" />').attr('name', 'pageId').val(pageId).attr('id', 'managePlugin_pageId');
            form.append(inputNS);
            form.append(inputPage);
        }

        editTitleForm.submit(function (e) {
            e.preventDefault();
            var form = e.currentTarget;
            appendFormFields(form);
            Rocket.Util.submitFormAsync(form, function (responseData) {
                //console.log(responseData)
                $("#" + ns + " .plugin-head .header").html(responseData.title.en_US);
            });
        });

        settingsArea.find("form").submit(function (e) {
            e.preventDefault();
            //console.log(e);
            var form = e.currentTarget;
            appendFormFields(form);
            Rocket.Util.submitFormAsync(form, function (responseData) {
                if (responseData && responseData.status) {
                    location.reload();
                }
            });
        });

        //open permissions on tab click

        function handlePermissionUpdate() {
            permissionArea.find("form").submit(function (e) {
                e.preventDefault();
                //console.log(e);
                var form = e.currentTarget;
                appendFormFields(form);
                Rocket.Util.submitFormAsync(form, function (responseData) {
                    //console.log(responseData);
                    if (responseData && responseData.status && responseData.status == "success") {
                        location.reload();
                    }
                });
            });
        }

        managePlugin.find('a[data-toggle="tab"]').on('shown', function (e) {
            if ($(e.currentTarget).data("id") == "permissions") {
                //console.log(Rocket.Util.getOrigin() + Rocket.PageValues.getPageFriendlyURL() + "/managePermissions/plugin/"+ instanceId + "/" + ns)
                var type = "plugin";
                if (isSettingsPlugin) {
                    type = "settings";
                }
                var options = {
                    url: Rocket.Util.getOrigin() + Rocket.PageValues.getPageFriendlyURL() + "/managePermissions/" + type + "/"
                        + instanceId + "/" + ns,
                    data: {mode: "exclusive"},
                    success: function (response) {
                        //console.log(response);
                        permissionArea.html(response);
                        handlePermissionUpdate();
                    }
                };
                Rocket.ajax(options);
            }
        });

        if (!hasSettingsTab) {
            managePlugin.find('a[data-toggle="tab"]').trigger('shown');
        }
    });
});
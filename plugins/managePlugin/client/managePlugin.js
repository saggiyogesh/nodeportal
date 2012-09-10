$(function () {
    var managePlugin = $("#editPluginModal .managePlugin"),
        editTitleForm = managePlugin.find("form#managePluginEditTitle"),
        ns = managePlugin.data("ns"),
        pageId = managePlugin.data("pageid"),
        instanceId = managePlugin.data("instanceid"),
        settingsArea = managePlugin.find("#settingsArea"),
        permissionArea = managePlugin.find("#managePluginPermissions");

    function appendFormFields(form) {
        var inputNS = $('<input type="hidden" />').attr('name', 'ns').val(ns),
            inputPage = $('<input type="hidden" />').attr('name', 'pageId').val(pageId);
        $(form).append(inputNS);
        $(form).append(inputPage);
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
            if(responseData && responseData.status){
                location.reload();
            }
        });
    });

    //open permissions on tab click

    function handlePermissionUpdate(){
        permissionArea.find("form").submit(function (e) {
            e.preventDefault();
            //console.log(e);
            var form = e.currentTarget;
            appendFormFields(form);
            Rocket.Util.submitFormAsync(form, function (responseData) {
                //console.log(responseData);
                if(responseData && responseData.status && responseData.status == "success"){
                    location.reload();
                }
            });
        });
    }

    managePlugin.find('a[data-toggle="tab"]').on('shown', function (e) {
        if ($(e.currentTarget).data("id") == "permissions") {
            //console.log(Rocket.Util.getOrigin() + Rocket.PageValues.getPageFriendlyURL() + "/managePermissions/plugin/"+ instanceId + "/" + ns)
            var options = {
                url:Rocket.Util.getOrigin() + Rocket.PageValues.getPageFriendlyURL() + "/managePermissions/plugin/"
                    + instanceId + "/" + ns,
                data:{mode:"exclusive"},
                success:function (response) {
                    //console.log(response);
                    permissionArea.html(response);
                    handlePermissionUpdate();
                }
            };
            Rocket.ajax(options);
        }
    });


    //console.log(managePlugin)
});
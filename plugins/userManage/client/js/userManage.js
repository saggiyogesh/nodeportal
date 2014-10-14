define(["uploader", "pluginURL", "events"], function () {
    var ns = "userManage";

    Rocket.bind("userManage:profileForm:load", function (e) {
        var img = $("#" + ns + "_img");

        function setImage(url) {
            img.attr("src", url);
        }

        setImage(Rocket.User.getProfilePicURL());

        var uploader = new Rocket.Uploader({
            acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
            uploaderId: ns + "_uploader",
            url: Rocket.PluginURL.createByNamespace(ns, "uploadProfilePic", null),
            onSuccess: function (response) {
                if (response.files[0].name) {
                    setImage(Rocket.PluginURL.createByNamespace(ns, ["profilePic", Rocket.User.getUserId()], null, null, "app"))
                }
            }
        });

        //handle upload button click
        $("#" + ns + "_uploadButton").click(function () {
            uploader.open();
        });

        //handle close button click
        $("#" + ns + "_closeButton").click(function () {
            Rocket.ajax({
                url: Rocket.PluginURL.createByNamespace(ns, ["removeUploadedPic", Rocket.User.userId]),
                success: function (res) {
                    if (res.status == "success") {
                        setImage(Rocket.User.getDefaultProfilePicURL());
                    }
                }
            });
        });
    });
});
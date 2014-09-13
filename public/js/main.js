/**
 *
 */

(function () {
    var modules = {
        bootstrap: "bootstrap.min",
        jqueryui: "jquery-ui.min",
        cookie: "jquery.cookie",
        dataTable: "jquery.dataTables",
        dynaTree: "jquery.dynatree.min",
        fileUpload: "jquery.fileupload",
        "fileUpload-ui": "jquery.fileupload-ui",
        "typing": "jquery.typing",
        json: "json2",
        _: "underscore.min",
        autosize: "jquery.autosize.min",
        editable: "bootstrap-editable.min",
        bootbox: "bootbox.min"

    };

    window.Rocket = function () {
    };

    require.config({
        baseUrl: "/js/",
        waitSeconds: 15,
        paths: modules
    });
})();
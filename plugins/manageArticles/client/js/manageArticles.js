define(["tables", "pluginURL"], function () {
    var EDIT_ARTICLE_COMMAND = "edit-article", PREVIEW_ARTICLE_COMMAND = "preview-article",
        DELETE_ARTICLE_COMMAND = "delete-article", PERMISSION_COMMAND = "permission",
        ARTICLES_TABLE_ID = "articlesTable",
        LIST_TABLE_CB = "listTableContentBox";

    var toolbar = $('.article-toolbar'), addButton = toolbar.find("button#add"),
        deleteButton = toolbar.find("button#delete"), checkVals;

    var modelName = "Article", permissionSchemaKey = "model.articleSchema.Article";

    function goTo(url) {
        location.href = url;
    }

    function getURL(action) {
        return Rocket.PluginURL({action: action});
    }

    function removeArticles(ids) {
        var c = confirm('Are you sure to delete this ?');
        if (c == true) {
            goTo(getURL("remove") + "/" + ids);
        }
    }

    //handle article edit page load
    Rocket.bind("manageArticle:edit:load", function (e) {

        var data = e.data, id = data.id || "";

        var editor = CKEDITOR.replace('manageArticles_content', {
            width: 800
        });

        $(".manage-articles form").submit(function (e) {
            $(e.currentTarget).find("#manageArticles_content").html(editor.getData());
        });

        //bind to version tab click
        $('.manage-articles a[data-toggle="tab"]').on('shown', function (e) {
            if ($(e.currentTarget).data("id") == "version" && $("#versionTableContentBox").children().length == 0) {
                //console.log(e);
                var options = {
                    url: Rocket.PluginURL({action: "getArticleVersions"}) + "/" + id,
                    success: function (response) {
                        var data = {
                            columns: [
                                {"sTitle": "Version" },
                                {"sTitle": "Create Date" }
                            ],
                            values: response.values
                        };
                        new Rocket.Table({
                            contentBox: "versionTableContentBox",
                            id: "versionTable"
                        }, data);
                    }
                };
                Rocket.ajax(options);
            }
        });
    });

    //index page load event handler
    Rocket.bind("manageArticle:index:load", function (e) {
        function getId(tgt){
            return $(tgt).closest(".btn-group").find("button").data("id");
        }

        function getArticleId(tgt){
            return $(tgt).closest("tr").find("td:eq(1)").text();
        }

        var data = {
            columns: [
                {"sTitle": "Id" },
                {"sTitle": "Title" },
                {"sTitle": "Create Date" },
                {"sTitle": "Display Date" }
            ]
        };

        new Rocket.Table({
            contentBox: LIST_TABLE_CB,
            id:ARTICLES_TABLE_ID,
            checkBoxAll: true,
            actionButton: {
                modelName: modelName,
                permissionSchemaKey: permissionSchemaKey,
                pullRight: true,
                dropUp: true,
                actions: [
                    {
                        text: "Edit",
                        permissionAction: "UPDATE",
                        onClick: function (e) {
                            console.log(e);
                            var id = getArticleId(e.target);
                            goTo(getURL("edit") + "/" + id);
                        }
                    },
                    {
                        text: "Preview",
                        permissionAction: "VIEW",
                        onClick: function (e) {
                            var id = getArticleId(e.target);
                            window.open(getURL("preview") + "/" + id, '_blank');
                        }
                    },
                    {
                        text: "Permission",
                        permissionAction: "PERMISSION",
                        onClick: function (e) {
                            var id = getId(e.target);
                            var redirect = Rocket.PluginURL({action: ""}),
                                params = [
                                    "managePermissions",
                                    "model"
                                ];
                            var permissionURL = Rocket.Plugin.permissionURL(id, modelName, permissionSchemaKey, redirect);
                            location.href = permissionURL;

                        }
                    },
                    {
                        text: "Delete",
                        permissionAction: "DELETE",
                        onClick: function (e) {
                            var id = getArticleId(e.target);
                            removeArticles(id);
                        }
                    }
                ]
            },
            ajax: Rocket.PluginURL({action: "getArticles"})
        }, data);
    });

    //Bind table checkbox click event
    Rocket.bind(ARTICLES_TABLE_ID + ":checkBox:click", function (e) {
        var data = e.data;
        if (data.length > 0) {
            deleteButton.removeClass("disabled");
            deleteButton.attr("disabled", false);
        }
        else {
            deleteButton.addClass("disabled");
            deleteButton.attr("disabled", true)
        }
        checkVals = data;
    });

    //handle toolbar button click
    addButton.click(function (e) {
        goTo(getURL("add"));
    });
    deleteButton.click(function (e) {
        var listTable = $("#" + ARTICLES_TABLE_ID), checkedIdTDs = listTable.find(":checked.cb-data").parent().next(),
            ids = [];
        checkedIdTDs.each(function (index) {
            ids.push($(this).text());
        });
        removeArticles(ids.join("~"));
    });

    Rocket.bind("manageArticle:listTableMenu:" + EDIT_ARTICLE_COMMAND, function (e) {
        //console.log(e);
        var id = $('td:eq(1)', e.data.el).text();
        goTo(getURL("edit") + "/" + id);

    });

    Rocket.bind("manageArticle:listTableMenu:" + DELETE_ARTICLE_COMMAND, function (e) {
        //console.log(e);
        var id = $('td:eq(1)', e.data.el).text();
        removeArticles(id);
    });

    Rocket.bind("manageArticle:listTableMenu:" + PREVIEW_ARTICLE_COMMAND, function (e) {
        //console.log(e);
        var id = $('td:eq(1)', e.data.el).text();
        window.open(getURL("preview") + "/" + id, '_blank');
    });

    Rocket.bind("manageArticle:listTableMenu:" + PERMISSION_COMMAND, function (e) {
        //console.log(e);
        var articleId = $('td:eq(0)', e.data.el).find("input").val(),
            origin = Rocket.Util.getOrigin(),
            redirect = encodeURIComponent(getURL("")),
            permissionURL = origin + Rocket.PageValues.getPageFriendlyURL() + "/managePermissions/model/"
                + articleId + "/" + "Article?redirect=" + redirect;
        goTo(permissionURL);
    });
});
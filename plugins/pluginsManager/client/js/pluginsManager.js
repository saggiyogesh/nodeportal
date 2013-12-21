define(["tables", "pluginURL"], function () {
    var LIST_TABLE_CB = "pluginsTable";

    function goTo(url) {
        location.href = url;
    }

    function getURL(action) {
        return Rocket.PluginURL({action: action});
    }

    function removePlugin(id, type) {
        var c = confirm('Are you sure to delete this ?');
        if (c == true) {
            goTo(getURL("remove") + "/" + id + "/" + type);
        }
    }

    //index page load event handler
    Rocket.bind("pluginsManager:index:load", function (e) {

        var data = {
            columns: [
                {"sTitle": "Id", "bSortable": false },
                {"sTitle": "Name", "bSortable": false},
                {"sTitle": "Type", "bSortable": false}
            ]
        };

        new Rocket.Table({
            hideSearch: true,
            contentBox: LIST_TABLE_CB,
            actionButton: {
                pullRight: true,
                dropUp: true,
                actions: [
                    {
                        text: "Uninstall",
                        onClick: function (e) {
                            console.log(e)
                            var tr = $(e.target).closest("tr");
                            var id = tr.find("td:eq(0)").text();
                            var type = tr.find("td:eq(2)").text();
                            console.log(id)
                            console.log(type)
                            removePlugin(id, type);
                            // var id = getArticleId(e.target);
                            // removeArticles(id);
                        }
                    }
                ]
            },
            ajax: Rocket.PluginURL({action: "getPlugins"})
        }, data);
    });

});
/**
 *
 */

(function ($, Rocket) {
    function isCorrectHref(anchor) {
        var flag;
        if (anchor.attr("hash")) {
            flag = false;
        }

        else if (anchor.attr("protocol") && anchor.attr("hostname") === window.location.hostname) {
            // For maximized urls, not rendered as async urls
            // bcoz we can't change the page layout
            if (anchor.attr("search").indexOf("mode=maximized") > -1) {
                flag = false;
            }
            else {
//                console.log("anch: : " + anchor.attr("pathname"));
                flag = true;
            }
        }
        else if (anchor.attr("target")) {
            flag = false;
        }
        return flag;
    }

    function AsyncPlugin(pluginId, contentBox) {
        this.pluginId = pluginId;
        this.contentBox = contentBox;
    }

    var _instances = {};

    Rocket.AsyncCaller = {
        attach:function (pluginId) {
            var plugin = $('#' + pluginId),
                contentBox = plugin.parent(), that = this;
            contentBox.addClass(pluginId);

            _instances[pluginId] = new AsyncPlugin(pluginId, contentBox);
            that.callPlugin(pluginId);
        },
        processAnchors:function (contentBox) {
            var anchors = contentBox.find('a');
            if (anchors) {
                anchors.each(function (i) {
                    var anchor = $(this);
                    var href = anchor.attr("href");
                    if (href && isCorrectHref(anchor)) {
                        anchor.click(function (e) {
                            e.preventDefault();
                            console.log("anc");
                            console.log(e);
                            History.pushState({state:href, rand:Math.random()}, Rocket.PageValues.getPageFriendlyURL(),
                                href);
                        });
                    }
                });
            }

        },
        processForms:function (contentBox) {
            //save forms async & use history.js to show the url in browser
            var forms = contentBox.find('form');
            if (forms) {
                forms.each(function (i) {
                    var form = $(this);
                    form.submit(function (e) {
                        console.log(e);
                        e.preventDefault();
                        Rocket.Util.submitFormAsync(form, function (data) {
                            contentBox.html(data);
                        });
                    });
                });
            }

        },
        getAsyncPlugin:function (pluginId) {
            return _instances[pluginId];
        },
        callPlugin:function (pluginId) {
            var pathName = location.pathname, url, that = this;
            if (pathName.indexOf(pluginId) != -1) { //means that same plugin route is called
                if (pathName.split("/").length >= 3) { //contains pluginId and route
                    url = pathName;
                }
            }
            if (!url) {
                url = Rocket.PageValues.getPageFriendlyURL() + '/' + pluginId;
            }

            var contentBox = that.getAsyncPlugin(pluginId).contentBox
            contentBox.load(url + '?mode=exclusive', function (response, status, xhr) {
//                console.log(response);
                if(response.indexOf("Permission Error") > -1){
                    location.reload();
                }
            });
            Rocket.bind("plugin:" + pluginId + ":ready", function (e) {
                console.log("plugin ready: " + pluginId);
                that.processAnchors(contentBox);
                that.processForms(contentBox);
            });
        }
    };

})
    (jQuery, Rocket);

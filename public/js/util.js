define(["events", "_", "bootstrap"], function () {
    var onLoadFns = [];
    Rocket.Util = {
        linkAsync: function (params, fn) {
            var that = this;
            params.success = fn;
            that.ajax(params);
        },
        submitFormAsync: function (form, fn) {
            var that = this,
                options = {};
            form = $(form);
            options.url = form.attr('action');
            options.method = form.attr('method') || "POST";
            options.data = form.serialize();
            options.success = fn;
            that.ajax(options);


        },
        ajax: function (options) {
            if (!options) {
                throw Error("Ajax options missing");
            }
            $.ajax({
                url: options.url,
                global: false,
                cache: false,
                async: options.async || true,
                type: options.method || 'GET',
                data: options.data,
                success: options.success || function () {
                }

            });
        },
        /**
         * Handles ajax responses for flash notifications.
         * callback fn is passed with 3 params,
         *  1. {Boolean} true if success
         *  2. {String} message either success or error
         *  3. {Object} json given by server
         * @param {Function} fn
         */
        ajaxResponse: function (fn) {
            return function (response) {
                fn(response.status === "success" ? true : false, response.message, response.data);
            };
        },
        /**
         * Ajax io transport utility method
         * @param options
         */
        io: function (options) {
            if (!options) {
                throw Error("Ajax options missing");
            }
            var that = this, util = Rocket.Util;
            options.success = util.ajaxResponse(options.callback);
            util.ajax(options);
        },
        handleResponseError: function (obj) {
            if (obj.error) {
                window.location.reload();
            }
        },
        showDeleteConfirmation: function (url, redirect) {
            var that = this;
            var $dialog = $('<div></div>')
                .html('Are you sure to delete this ?')
                .dialog({
                    autoOpen: true,
                    title: 'Delete',
                    resizable: false,
                    height: 200,
                    width: 300,
                    modal: true,
                    buttons: {
                        "Ok": function () {
                            $(this).dialog("close");
                            var options = {
                                method: "POST",
                                url: url,
                                success: function (data) {
                                    that.handleResponseError(data);
                                    if (redirect) {
                                        window.location.href = redirect;
                                    }

                                }
                            };
                            that.ajax(options);
                        },
                        Cancel: function () {
                            $(this).dialog("close");
                        }
                    }
                });

        },
        showInfoDialog: function (msg) {
            var that = this;
            msg = msg || "Sample info message"
            var $dialog = $('<div></div>')
                .html(msg)
                .dialog({
                    autoOpen: true,
                    title: 'Information',
                    resizable: false,
                    height: 200,
                    width: 300,
                    modal: true,
                    buttons: {
                        Ok: function () {
                            $(this).dialog("close");
                        }
                    }
                });

        },
        invokePost: function (url, postParams) {
            var form = $('<form></form>');

            form.attr("method", "post");
            form.attr("action", url);

            postParams && $.each(postParams, function (key, value) {
                var field = $('<input></input>');

                field.attr("type", "hidden");
                field.attr("name", key);
                field.attr("value", value);

                form.append(field);
            });

            $(document.body).append(form);
            form.submit();

        },

        onLoad: function (fn) {
            if (fn) {
                onLoadFns.push(fn)
            }
            else {
                _.each(onLoadFns, function (fn) {
                    fn();
                });
            }
        },
        getOrigin: function () {
            return window.location.origin || window.location.href.split(window.location.pathname)[0];
        },
        onFormCancel: function (ns, cancelButtonId) {
            var that = this;
            $("#" + cancelButtonId).click(function (e) {
                var parent = $(e.currentTarget).parent(),
                    tag = parent[0].tagName;
                while (tag) {
                    if (tag === "BODY") {
//                        throw new Error("No form element found.")
                        break;
                    }
                    else if (tag === "FORM") {
                        break;
                    }
                    parent = $(parent[0]).parent();
                    tag = parent[0].tagName;
                }
                e.preventDefault();

                var redirectEl = $(parent[0]).find('input[name="' + ns + '[redirect]"]');
                if (redirectEl.length) {
                    location.href = that.getOrigin() + (redirectEl.val() ? redirectEl.val() : "");
                }
                else {
                    window.history.back();
                }
            });
        },
        /**
         * Method to toggle show of a flash messages
         *
         * Jade template should be as
         * for error flash
         *
         * #<nodeId>.ui-helper-hidden.alert.alert-error
         *      button(class="close", data-dismiss="alert") x
         *          span.message
         *
         * for success flash
         *
         * #<nodeId>.ui-helper-hidden.alert.alert-success
         *      button(class="close", data-dismiss="alert") x
         *          span.message
         *
         *
         *
         * @param msg - Message to be displayed
         * @param nodeId - Id for flash message container
         * @param ns -  Namespace of current plugin
         * @param isShow - flag to show or hide
         */
        flashMessage: function (msg, nodeId, ns, isShow) {
            ns = ns || Rocket.Plugin.currentPlugin.namespace;
            var node = $("#" + ns + "_" + nodeId),
                msgSpan = node.find("span.message");
            isShow ? node.removeClass("ui-helper-hidden") : node.addClass("ui-helper-hidden");
            if (node.data("autohide") == true && !node.hasClass("ui-helper-hidden")) {
                node.delay(4000).fadeOut(1000, function () {
                    $(this).addClass("ui-helper-hidden")
                });
            }
            if (msg) msgSpan.html(msg);
        },
        /**
         * Id for error flash is default "errorFlash", without namespace
         * @param msg
         * @param nodeId
         * @param ns
         */
        showErrorFlash: function (msg, nodeId, ns) {
            nodeId = nodeId || "errorFlash";
            this.flashMessage(msg, nodeId, ns, true);
        },

        hideErrorFlash: function (nodeId, ns) {
            nodeId = nodeId || "errorFlash";
            this.flashMessage(null, nodeId, ns, false);
        },
        /**
         * Id for success flash is default "successFlash"
         *
         * @param msg
         * @param nodeId
         * @param ns
         */
        showSuccessFlash: function (msg, nodeId, ns) {
            nodeId = nodeId || "successFlash";
            this.flashMessage(msg, nodeId, ns, true);
        },
        hideSuccessFlash: function (nodeId, ns) {
            nodeId = nodeId || "successFlash";
            this.flashMessage(null, nodeId, ns, false);
        },
        enableButton: function (buttonObj) {
            buttonObj.removeClass("disabled");
            buttonObj.attr("disabled", false);
        },
        disableButton: function (buttonObj) {
            buttonObj.addClass("disabled");
            buttonObj.attr("disabled", true);
        },
        /**
         * Utility for toggling button disable
         * @param {Jquery Object} buttonObj
         */
        toggleButtonDisable: function (buttonObj) {
            if (buttonObj.hasClass("disabled")) {
                this.enableButton(buttonObj)
            }
            else {
                this.disableButton(buttonObj)
            }

        }
    };

    Rocket.ajax = Rocket.Util.ajax;
    Rocket.io = Rocket.Util.io;
});
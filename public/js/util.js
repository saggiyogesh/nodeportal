define(["events", "_", "bootstrap", "autosize", "bootbox"], function () {
    var onLoadFns = [];
    Rocket.Util = {
        linkAsync: function (params, fn) {
            var that = this;
            params.success = fn;
            that.ajax(params);
        },
        submitFormAsync: function (form, fn, queryParams) {
            var that = this,
                options = {};
            form = $(form);
            options.url = form.attr('action');
            if (queryParams) {
                options.url = options.url + "?" + $.param(queryParams);
            }
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
         * #<nodeId>.hide.alert.alert-error
         *      button(class="close", data-dismiss="alert") x
         *          span.message
         *
         * for success flash
         *
         * #<nodeId>.hide.alert.alert-success
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
            isShow ? node.removeClass("hide") && node.css("display", "block") : node.addClass("hide");
            if (node.data("autohide") == true && !node.hasClass("hide")) {
                node.delay(4000).fadeOut(1000, function () {
                    $(this).addClass("hide");
                    $(msgSpan).html("");
                });
            }

            //attach close listener to hide the flash message
            $(node.find(".close")).click(function () {
                node.addClass('hide').css("display", "none");
                $(msgSpan).html("");
            });

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
        },
        autoSizeTextArea: function (textAreaId) {
            $(function () {
                $("body #" + textAreaId).autosize();
            });
        },
        /**
         * Options:
         *  message {String} message to be shown in alert popup
         *  buttonLabel {String} OK button label in alert popup
         *  callback {Function} Callback called when alert is closed
         *  okClass {String} Bootstrap class to show icon
         * @param options {Object}
         * @returns {*}
         */
        alert: function (options) {
            var message = options.message,
                buttonLabel = options.buttonLabel,
                callback = options.callback;

            var args = [message];
            buttonLabel && args.push(buttonLabel);
            callback && args.push(callback);

            bootbox.setIcons(null);
            options.okClass && bootbox.setIcons({
                "OK": options.okClass
            });
            return bootbox.alert.apply(bootbox, args);
        },
        /**
         * Options:
         *  message {String} message to be shown in confirm popup
         *  confirmButtonLabel {String} Confirm button label in confirm popup
         *  cancelButtonLabel {String} Cancel button label in confirm popup
         *  callback {Function} Callback called when confirm is closed, true or false is passed to callback
         *  confirmClass {String} Bootstrap class to show icon on confirm button
         *  cancelClass {String} Bootstrap class to show icon on cancel button
         * @param options {Object}
         * @returns {*}
         */
        confirm: function (options) {
            var message = options.message,
                cancelButtonLabel = options.cancelButtonLabel,
                confirmButtonLabel = options.confirmButtonLabel,
                callback = options.callback,
                icons = {
                    OK: null,
                    CANCEL: null,
                    CONFIRM: null
                };

            bootbox.setIcons(null);

            if (options.confirmClass) {
                icons.CONFIRM = options.confirmClass;
            }
            if (options.cancelClass) {
                icons.CANCEL = options.cancelClass;
            }
            bootbox.setIcons(icons);

            var args = [message];
            cancelButtonLabel && args.push(cancelButtonLabel);
            confirmButtonLabel && args.push(confirmButtonLabel);
            callback && args.push(callback);
            return bootbox.confirm.apply(bootbox, args);
        },
        /**
         * Options:
         *  message {String} message to be shown in prompt popup
         *  confirmButtonLabel {String} Confirm button label in confirm popup
         *  cancelButtonLabel {String} Cancel button label in confirm popup
         *  callback {Function} Callback called when confirm is closed, true or false is passed to callback
         *  defaultValue {String} Default value shown in prompt
         *  confirmClass {String} Bootstrap class to show icon on confirm button
         *  cancelClass {String} Bootstrap class to show icon on cancel button
         * @param options {Object}
         * @returns {*}
         */
        prompt: function (options) {
            var message = options.message,
                cancelButtonLabel = options.cancelButtonLabel,
                confirmButtonLabel = options.confirmButtonLabel,
                callback = options.callback,
                defaultValue = options.defaultValue,
                icons = {
                    OK: null,
                    CANCEL: null,
                    CONFIRM: null
                };

            bootbox.setIcons(null);

            if (options.confirmClass) {
                icons.CONFIRM = options.confirmClass;
            }
            if (options.cancelClass) {
                icons.CANCEL = options.cancelClass;
            }
            bootbox.setIcons(icons);

            var args = [message];
            cancelButtonLabel && args.push(cancelButtonLabel);
            confirmButtonLabel && args.push(confirmButtonLabel);
            callback && args.push(callback);
            defaultValue && args.push(defaultValue);
            return bootbox.prompt.apply(bootbox, args);
        }
    };

    Rocket.ajax = Rocket.Util.ajax;
    Rocket.io = Rocket.Util.io;
    Rocket.alert = Rocket.Util.alert;
    Rocket.confirm = Rocket.Util.confirm;
    Rocket.prompt = Rocket.Util.prompt;

});
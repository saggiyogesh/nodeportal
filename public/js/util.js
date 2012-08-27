/**
 *
 */

(function ($, Rocket) {
    var onLoadFns = [];
    Rocket.Util = {
        linkAsync:function (params, fn) {
            var that = this;
            params.success = fn;
            that.ajax(params);
        },
        submitFormAsync:function (form, fn) {
            var that = this,
                options = {};
            form = $(form);
            options.url = form.attr('action');
            options.method = form.attr('method') || "POST";
            options.data = form.serialize();
            options.success = fn;
            that.ajax(options);


        },
        ajax:function (options) {
            if (!options) {
                throw Error("Ajax options missing");
            }
            $.ajax({
                url:options.url,
                global:false,
                cache:false,
                async:options.async || true,
                type:options.method || 'GET',
                data:options.data,
                success:options.success || function () {
                }

            });
        },
        handleResponseError:function (obj) {
            if (obj.error) {
                window.location.reload();
            }
        },
        showDeleteConfirmation:function (url, redirect) {
            var that = this;
            var $dialog = $('<div></div>')
                .html('Are you sure to delete this ?')
                .dialog({
                    autoOpen:true,
                    title:'Delete',
                    resizable:false,
                    height:200,
                    width:300,
                    modal:true,
                    buttons:{
                        "Ok":function () {
                            $(this).dialog("close");
                            var options = {
                                method:"POST",
                                url:url,
                                success:function (data) {
                                    that.handleResponseError(data);
                                    if (redirect) {
                                        window.location.href = redirect;
                                    }

                                }
                            };
                            that.ajax(options);
                        },
                        Cancel:function () {
                            $(this).dialog("close");
                        }
                    }
                });

        },
        showInfoDialog:function (msg) {
            var that = this;
            msg = msg || "Sample info message"
            var $dialog = $('<div></div>')
                .html(msg)
                .dialog({
                    autoOpen:true,
                    title:'Information',
                    resizable:false,
                    height:200,
                    width:300,
                    modal:true,
                    buttons:{
                        Ok:function () {
                            $(this).dialog("close");
                        }
                    }
                });

        },
        invokePost:function (url, postParams) {
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

        onLoad:function (fn) {
            if (fn) {
                onLoadFns.push(fn)
            }
            else {
                _.each(onLoadFns, function (fn) {
                    fn();
                });
            }
        },
        getOrigin:function () {
            return window.location.origin || window.location.href.split(window.location.pathname)[0];
        },
        onFormCancel:function (ns, cancelButtonId) {
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
                if (redirectEl) {
                    location.href = that.getOrigin() + redirectEl.val();
                }
                else {
                    window.history.back();
                }
            });
        }
    };

    Rocket.ajax = Rocket.Util.ajax;
})(jQuery, Rocket);
define(["plugin", "pluginURL", "util", "editable"], function () {
    var ns = "threadComments";
    var COMMENT_HTML =
        '<div class="media" data-commentid="<%=id%>">' +
            '<a href="#" class="pull-left user-avatar">' +
            '   <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACDUlEQVR4Xu2Yz6/BQBDHpxoEcfTjVBVx4yjEv+/EQdwa14pTE04OBO+92WSavqoXOuFp+u1JY3d29rvfmQ9r7Xa7L8rxY0EAOAAlgB6Q4x5IaIKgACgACoACoECOFQAGgUFgEBgEBnMMAfwZAgaBQWAQGAQGgcEcK6DG4Pl8ptlsRpfLxcjYarVoOBz+knSz2dB6vU78Lkn7V8S8d8YqAa7XK83ncyoUCjQej2m5XNIPVmkwGFC73TZrypjD4fCQAK+I+ZfBVQLwZlerFXU6Her1eonreJ5HQRAQn2qj0TDukHm1Ws0Ix2O2260RrlQqpYqZtopVAoi1y+UyHY9Hk0O32w3FkI06jkO+74cC8Dh2y36/p8lkQovFgqrVqhFDEzONCCoB5OSk7qMl0Gw2w/Lo9/vmVMUBnGi0zi3Loul0SpVKJXRDmphvF0BOS049+n46nW5sHRVAXMAuiTZObcxnRVA5IN4DJHnXdU3dc+OLP/V63Vhd5haLRVM+0jg1MZ/dPI9XCZDUsbmuxc6SkGxKHCDzGJ2j0cj0A/7Mwti2fUOWR2Km2bxagHgt83sUgfcEkN4RLx0phfjvgEdi/psAaRf+lHmqEviUTWjygAC4EcKNEG6EcCOk6aJZnwsKgAKgACgACmS9k2vyBwVAAVAAFAAFNF0063NBAVAAFAAFQIGsd3JN/qBA3inwDTUHcp+19ttaAAAAAElFTkSuQmCC" ' +
            '       alt="64x64" style="width: 64px; height: 64px;" class="media-object">' +
            '</a>' +
            '<div class="media-body">' +
            '<h4 class="media-heading"><%=heading%></h4>' +
            '<span class="media-content"><%=body%></span>' +
            '<div class="media-controls">' +
//            '<a href="#" class="reply">Reply</a> ' +
//            '<a href="#" class="edit">Edit</a> ' +
        '</div>'
    '</div>' +
    '</div>';
    var FORM_HTML =
        '<form data-threadid="<%=threadId%>" class="form-search comment-form">' +
            '<textarea id="<%=textAreaId%>" placeholder="Post new comment"></textarea>' +
            '<button id="<%=buttonId%>" type="button" class="btn btn-primary post-button">Post</button>' +
            '</form>'
    var REPLY_SELECTOR = '.media .media-body .media-controls a.reply',
        EDIT_SELECTOR = '.media .media-body .media-controls a.edit',
        DELETE_SELECTOR = '.media .media-body .media-controls a.delete',
        REPLY_COMMENT_FORM_CLASS = "reply-comment-form";

    var editCommentURL = Rocket.PluginURL.createByNamespace(ns, "editComment", null, "exclusive");
    var removeCommentURL = Rocket.PluginURL.createByNamespace(ns, "removeComment", null, "exclusive");

    function initURL(options) {
        var paths = ["initThread"];
        paths.push(options.linkedModelId);
        paths.push(options.linkedModelName);

        if (options.linkedModelFinderParam) {
            paths.push(options.linkedModelFinderParam);
        }

        if (options.linkedPermissionSchemaKey) {
            paths.push(options.linkedPermissionSchemaKey);
        }

        return Rocket.PluginURL.createByNamespace(ns, paths, null, "exclusive");
    }

    function postComment(e) {
        var threadId = e.data.threadId;
        var parentCommentId = e.data.parentCommentId;
        var button = $(this);
        var form = $(button).parents("form");


//        var textAreaId = threadId + "_newComment";
//        var postButtonId = threadId + "_post";

        var textArea = form.find("textarea");

        var val = textArea.val();
        if (!val) {
            return;
        }

        Rocket.Util.toggleButtonDisable(button);

        var data = {
            content: val,
            threadId: threadId
        };
        if (parentCommentId) {
            data.parentCommentId = parentCommentId;
        }

        Rocket.ajax({
            url: Rocket.PluginURL.createByNamespace(ns, "postComment", null, "exclusive"),
            method: "POST",
            data: data,
            success: function (response) {
                renderComments(threadId, response.data.auth);
                textArea.val("");
                Rocket.Util.toggleButtonDisable(button);
            }
        });
    }

    function renderForm(container, threadId, parentCommentId) {
//        var fm = $('#' + threadId + "_commentList ." + REPLY_COMMENT_FORM_CLASS)
//        if (fm && fm.length > 0) {
//            fm.remove();
//        }
        var id = threadId + parentCommentId ? "_" + parentCommentId : "";
        var textAreaId = _.uniqueId("__commentForm__");

        var postButtonId = _.uniqueId("__commentForm__");
        var form = $(_.template(FORM_HTML)({
            threadId: threadId,
            textAreaId: textAreaId,
            buttonId: postButtonId
        }));
        if (parentCommentId) {
            container.after(form);
        }
        else {
            container.append(form);
        }

        if (parentCommentId) {
            form.addClass(REPLY_COMMENT_FORM_CLASS)
        }

        $("#" + postButtonId).on('click', {threadId: threadId, parentCommentId: parentCommentId}, postComment);

        Rocket.Util.autoSizeTextArea(textAreaId);
    }

    function renderComments(threadId, auth) {
        var commentListContainer = $("#" + threadId + "_commentList");
        commentListContainer.html("");
        var paths = ["getComments", threadId];
        var allComments = [], append = function (container, comment) {
                var el = $(_.template(COMMENT_HTML)({
                    id: comment.commentId,
                    heading: new Date(comment.createDate).toLocaleString(),
                    body: comment.content
                })).appendTo(container);

                //TODO permission check
                //TODO                                                                         r
                //TODO
                //TODO//TODO//TODO
                var mediaControls = el.find('.media-controls');
                if (auth.hasAdd) {
                    $('<a href="#" class="reply">Reply</a> ').appendTo(mediaControls)
                        .data('threadid', threadId).data('parentcommentid', comment.commentId);
                }

                if (auth.hasEdit) {
                    $('<a href="#" class="edit">Edit</a> ').appendTo(mediaControls)
                        .data('threadid', threadId).data('parentcommentid', comment.commentId);
                }

                if (auth.hasDelete) {
                    $('<a href="#" class="delete">Delete</a> ').appendTo(mediaControls)
                        .data('threadid', threadId).data('parentcommentid', comment.commentId);

                }
            },

            //recursive function to build comments tree
            insertComments = function (comment) {
                if (comment.parentCommentId == 0) {
                    append(commentListContainer, comment);
                }
                else {
                    var parent = commentListContainer.find("div[data-commentid='" + comment.parentCommentId + "']");
                    if (parent.length > 0) {
                        append(parent.find('.media-body:eq(0)'), comment);
                    }
                    else {
                        allComments.unshift(comment);
                    }
                }

                if (allComments.length > 0) {
                    insertComments(allComments.pop())
                }
                else {
                    return;
                }
            };

        Rocket.ajax({
            url: Rocket.PluginURL.createByNamespace(ns, paths, null, "exclusive"),
            success: function (response) {
                allComments = JSON.parse(response);
                if (allComments.length > 0) {
                    insertComments(allComments.pop());
                    commentListContainer.removeClass("hide");
                }
            }
        });

    }

    //bindings to reply link
    $('body').on('click', REPLY_SELECTOR, function (e) {
        e.preventDefault();
        var el = $(this);
        var c = el.parent();

        if (el.hasClass("clicked")) {
            el.removeClass("clicked");
            c.parent().find("form").remove();
            return;
        }

        el.addClass("clicked");
        renderForm(c, el.data('threadid'), el.data('parentcommentid'))
    });

    $.fn.editable.defaults.mode = "inline";
    //bindings to edit link
    $('body').on('click', EDIT_SELECTOR, function (e) {
        e.preventDefault();
        var el = $(this);
        var mediaBox = el.closest('.media');
        var contentBox = mediaBox.find(".media-content:eq(0)");
        var editableNode = contentBox.editable({
//            mode: "inline",
            type: 'textarea',
            placeholder: "Post new comment",
            rows: 0,
            pk: mediaBox.data("commentid"),
            params: {
                threadId: el.data('threadid')
            },
            url: editCommentURL
        });


        setTimeout(function () {
            editableNode.editable('show');
        }, 200);
    });

    //bindings to delete link
    $('body').on('click', DELETE_SELECTOR, function (e) {
        var errHTML = '<div class="alert alert-info">' +
            '<button type="button" class="close" data-dismiss="alert">×</button>' +
            'This comment is replied.' +
            '</div>'
        e.preventDefault();
        var el = $(this);
        var mediaBox = el.closest('.media');
        if (mediaBox.find(".media").length > 0) { //has child comments
            mediaBox.find('.media-body:eq(0)').prepend(errHTML);
            mediaBox.find('.alert').delay(2000).fadeOut(1000, function () {
                $(this).remove();
            });
            return;
        }

        var c = confirm('Are you sure to delete this comment ?');
        if (c == false) {
            return;
        }

        Rocket.ajax({
            url: removeCommentURL,
            method: "POST",
            data: {
                commentId: mediaBox.data("commentid"),
                threadId: el.data('threadid')
            },
            success: function (response) {
                if (response.status && response.status != "error") {
                    mediaBox.remove();
                }
            }
        });

    });

    //bind index load event
    Rocket.bind("threadComments:index:load", function (e) {
        var data = e.data, threadId = data.threadId,
            linkedPermissionSchemaKey = data.linkedPermissionSchemaKey;
        var textAreaId = threadId + "_newComment";
        var postButtonId = threadId + "_post";

        renderForm($("#" + threadId + "_thread .form"), threadId);

        renderComments(threadId, data.auth);
    });

    function ThreadComments(options) {
        if (!options.linkedModelId || !options.linkedModelName) {
            throw new Error("Options missing.");
        }

        Rocket.ajax({
            url: initURL(options),
            method: "POST",
            data: {
                mode: "exclusive"
            },
            success: function (response) {
                $(options.container).html(response);
            }
        });
    }

    Rocket.ThreadComments = ThreadComments;
});
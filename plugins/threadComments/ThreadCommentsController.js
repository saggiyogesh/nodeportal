var BasePluginController = require(process.cwd() + "/lib/BasePluginController.js");
var THREAD_SCHEMA = "Thread", COMMENT_SCHEMA = "Comment", USER_SCHEMA = "User",
    sanitize = require('validator').sanitize;

var ThreadCommentsController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.post({
            route: '/initThread/:linkedModelFinderParam?/:linkedModelName?/:linkedModelFinderField?/:linkedPermissionSchemaKey',
            action: initThreadAction
        });
        that.post({
            route: '/postComment', action: postCommentAction
        });
        that.get({
            route: '/getComments/:threadId?', action: getCommentsAction
        });
        that.post({
            route: '/editComment', action: editCommentAction
        });
        that.post({
            route: '/removeComment', action: removeCommentAction
        });
//        that.get({
//            route: '/remove/:id?/:type?', action: removePluginAction
//        });
    });
};

util.inherits(ThreadCommentsController, BasePluginController);

function editCommentAction(req, res, next) {
    var that = this, post = req.body;
    var content = post.value.trim(), commentId = post.pk;
    if (content && commentId) {
        var CommentService = that.getService(COMMENT_SCHEMA);
        var ThreadService = that.getService(THREAD_SCHEMA);
        var thread;
        async.series([
            function (n) {
                //get thread
                ThreadService.get("findByThreadId", post.threadId, function (err, t) {
                    if (t) {
                        thread = t;
                    }
                    n(err, t);
                });
            },
            function (n) {
                //check permissions
                var permissionSchemaKey = thread.linkedPermissionSchemaKey;
                var pv = new that.PermissionValidator(req, permissionSchemaKey, thread.linkedModelName);
                pv.hasPermission("EDIT_DISCUSSION", thread.linkedModelPK, n);
            },
            function (n) {
                CommentService.update({
                    commentId: commentId,
                    content: sanitize(content).xss(),
                    updateDate: Date.now()
                }, n);
            }
        ], function (err, result) {
            if (result) {
                that.setSuccess(req);
            }
            next(err);
        });
    }
    else {
        that.setErrorMessage(req, "Parameter Missing");
        next(null);
    }
}

function removeCommentAction(req, res, next) {
    var that = this, post = req.body;
    var commentId = post.commentId;
    if (commentId) {
        var CommentService = that.getService(COMMENT_SCHEMA);
        var ThreadService = that.getService(THREAD_SCHEMA);
        var thread;
        async.series([
            function (n) {
                //get thread
                ThreadService.findById(post.threadId, function (err, t) {
                    if (t) {
                        thread = t;
                    }
                    n(err, t);
                });
            },
            function (n) {
                //check permissions
                var permissionSchemaKey = thread.linkedPermissionSchemaKey;
                var pv = new that.PermissionValidator(req, permissionSchemaKey, thread.linkedModelName);
                pv.hasPermission("DELETE_DISCUSSION", thread.linkedModelPK, n);
            },
            function (n) {
                // if deleted comment has child comments then throw err
                CommentService.getByParentCommentId(commentId, function (err, c) {
                    if (c && c.length > 0) {
                        err = new Error("Nested comments exists")
                    }
                    n(err, c);
                });
            },
            function (n) {
                CommentService.remove(commentId, n);
            }

        ], function (err, result) {
            if (result) {
                that.setSuccess(req);
            }
            next(err);
        });
    }
    else {
        that.setErrorMessage(req, "Parameter Missing");
        next(null);
    }
}

function getCommentsAction(req, res, next) {
    var that = this, params = req.params,
        threadId = params.threadId;
    if (threadId) {
        var CommentService = that.getService(COMMENT_SCHEMA),
            UserService = that.getService(USER_SCHEMA),
            comments, json = [];

        async.series([
            function (n) {
                CommentService.getByThreadId(threadId, function (err, model) {
                    if (model) {
                        comments = model;
                    }
                    n(err, model);
                });
            },
            function (n) {
                async.eachSeries(comments, function (c, cb) {
                    c = c.toJSON();
                    UserService.findById(c.authorId, function (err, user) {
                        var profilePicURL = utils.getUserProfilePicURL(user);
                        c.userPicURL = profilePicURL;
                        json.push(c);
                        cb(err, user)
                    });

                }, function (err) {
                    n(err, true);
                });
            }
        ], function (err, r) {
            that.setSend(req, JSON.stringify(json));
            next(err);
        });
    }
    else {
        that.setErrorMessage(req, "Parameter Missing");
        next(null);
    }
}

function postCommentAction(req, res, next) {
    var that = this, post = req.body;
    var content = sanitize(post.content).xss(), threadId = post.threadId;

    if (threadId && content) {
        var userId = req.session.user.userId;
        var CommentService = that.getService(COMMENT_SCHEMA);
        var ThreadService = that.getService(THREAD_SCHEMA),
            commentDate = Date.now();
        var comment = {
            content: content,
            authorId: userId,
            threadId: threadId,
            parentCommentId: post.parentCommentId,
            createDate: commentDate
        };
        var thread;
        var permissionAction = "ADD_DISCUSSION";
        async.series([
            function (n) {
                //get thread
                ThreadService.findById(threadId, function (err, t) {
                    if (t) {
                        thread = t;
                    }
                    n(err, t);
                });
            },
            function (n) {
                //check permissions
                var permissionSchemaKey = thread.linkedPermissionSchemaKey;
                var pv = new that.PermissionValidator(req, permissionSchemaKey, thread.linkedModelName);
                pv.hasPermission(permissionAction, thread.linkedModelPK, n);
            },
            function (n) {
                CommentService.save(comment, n);
            },
            function (n) {
                n(null, true);

                utils.tick(function () {
                    //send email for comment notifications
                    CommentService.getByThreadId(threadId, function (err, comments) {
                        if (comments && comments.length > 0) {
                            var authorIds = _.uniq(_.pluck(comments, "authorId"));
                            var UserService = that.getService(USER_SCHEMA);
                            var arr = [];
                            authorIds.forEach(function (id) {
                                if (userId != id) {
                                    var q = {};
                                    q["userId" ] = id;
                                    arr.push(q);
                                }
                            });

                            var emailUsers = [], query = {where: {or: arr}};

                            UserService.find(query, function (err, users) {
                                if (users) {
                                    users.forEach(function (user) {
                                        if (user.notifications.comments) {
                                            emailUsers.push(user.fullName + " " + user.emailId);
                                        }
                                    });

                                    Debug._l("Sending comments email:" + emailUsers);

                                    var Mailer = that.Mailer;

                                    var from = 'NodePortal <comments@nodeportal.com>',

                                        to = 'NodePortal <comments@nodeportal.com>',

                                        subject = 'New comment';

                                    var m = new Mailer.MailMessage(from, to, subject);
                                    var tmpl = that.realPath() + "/tmpl/commentsMail.jade";
                                    m.setBcc(emailUsers);
                                    m.renderBodyFromJadeTemplate(tmpl, {
                                        userFullName: req.session.user.fullName.trim() + " wrote:",
                                        commentContent: content,
                                        commentDate: that.DateUtil.formatArticleDate(commentDate),
                                        commentURL: post.url
                                    }, function (err) {
                                        if (!err) {
                                            Mailer.sendMail(m, function (err, success) {
                                                if (!err) {
                                                    Debug._l("Comments mail delivered successfully..")
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            },
            function (n) {
                var pv = new that.PermissionValidator(req, thread.linkedPermissionSchemaKey, thread.linkedModelName);
                var actions = ["ADD_DISCUSSION", "EDIT_DISCUSSION", "DELETE_DISCUSSION"];
                pv.checkPermissionForActions(actions, thread.linkedModelPK, function (err, perms) {
                    !err && (req.attrs.actionsPermission = perms);
                    n(err, !err);
                });
            }
        ], function (err, result) {
            if (!err && result) {
//                var comments = result[1];
//                that.setJSON(req, comments);
                var aP = req.attrs.actionsPermission;
                var hasAdd = aP.ADD_DISCUSSION.isAuthorized, hasEdit = aP.EDIT_DISCUSSION.isAuthorized,
                    hasDelete = aP.DELETE_DISCUSSION.isAuthorized;
                var data = {
                    auth: {
                        hasAdd: hasAdd,
                        hasEdit: hasEdit,
                        hasDelete: hasDelete
                    }
                };

                that.setSuccess(req, null, data);
            }
            next(err);
        });
    } else {
        that.setErrorMessage(req, "Parameter Missing");
        next(null);
    }

}

function initThreadAction(req, res, next) {
    var that = this, params = req.params,
        linkedModelFinderParam = params.linkedModelFinderParam, linkedModelName = params.linkedModelName,

    //this field is used to fetch the linked model, otherwise default modelId is used.
        linkedModelFinderField = params.linkedModelFinderField,

    //permission schema key used to validate permissions
        linkedPermissionSchemaKey = params.linkedPermissionSchemaKey;

    if (linkedModelFinderParam && linkedModelName) {
        var ThreadService = that.getService(THREAD_SCHEMA);
        var LinkedModelService = that.getService(linkedModelName);

        var thread, model;

        async.series([
            function (n) {
                //find model obj
                var getModel = function (err, m) {
                    if (m) {
                        model = m;
                    }
                    else {
                        err = new Error("Invalid linked model.");
                    }
                    n(err, m);
                };

                if (linkedModelFinderField) {
                    var where = {};
                    where[linkedModelFinderField] = linkedModelFinderParam
                    LinkedModelService.findOne({where: where}, getModel);
                }
                else {
                    LinkedModelService.findById(linkedModelFinderParam, getModel);
                }
            },
            function (n) {
                //find thread
                ThreadService.getByLinkedModelIdAndLinkedModelName(linkedModelFinderParam, linkedModelName, function (err, t) {
                    if (t) {
                        thread = t.toObject();
                    }
                    n(err, t);
                });
            },
            function (n) {
                if (!thread) {
                    //create thread
                    var pk = model[LinkedModelService.getIdName()];

                    thread = {
                        linkedModelId: linkedModelFinderParam,
                        linkedModelName: linkedModelName,
                        linkedPermissionSchemaKey: linkedPermissionSchemaKey,
                        linkedModelFinderField: linkedModelFinderField,
                        linkedModelPK: pk
                    };
                    ThreadService.save(thread, n);
                }
                else {
                    n(null, true);
                }
            },
            function (n) {
                var pv = new that.PermissionValidator(req, thread.linkedPermissionSchemaKey, thread.linkedModelName);
                var actions = ["ADD_DISCUSSION", "EDIT_DISCUSSION", "DELETE_DISCUSSION", "VIEW"];
                pv.checkPermissionForActions(actions, thread.linkedModelPK, function (err, perms) {
                    !err && (req.attrs.actionsPermission = perms);
                    n(err, !err);
                });
            }
        ], function (err, result) {
//            if (err) {
//                next(err);
//            }
//            else {
//                next(err);
//            }

            if (model && thread) {
                req.attrs.model = model;
                req.attrs.thread = thread;
            }

            next(err);
        });
    }
    else {
        that.setErrorMessage(req, "Parameter Missing");
        next(null);
    }

}
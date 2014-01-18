var BasePluginController = require(process.cwd() + "/lib/BasePluginController.js");
var THREAD_SCHEMA = "Thread", COMMENT_SCHEMA = "Comment", USER_SCHEMA = "User",
    sanitize = require('validator').sanitize;

var ThreadCommentsController = module.exports = function (id, app) {
    BasePluginController.call(this, id, app);
    var that = this;
    that.listenLoadEvent(function (params) {
        that.post({
            route: '/initThread/:linkedModelFinderParam?/:linkedModelName?/:linkedModelFinderField?/:linkedPermissionSchemaKey', action: initThreadAction
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
    var that = this, DBActions = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        post = req.body;
    var content = post.value.trim(), commentId = post.pk;
    if (content && commentId) {
        var commentDBAction = DBActions.getInstance(req, COMMENT_SCHEMA);
        var threadDBAction = DBActions.getInstance(req, THREAD_SCHEMA);
        var thread;
        async.series([
            function (n) {
                //get thread
                threadDBAction.get("findByThreadId", post.threadId, function (err, t) {
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
                commentDBAction.update({
                    commentId: commentId,
                    content: sanitize(content).xss(),
                    updateDate: Date.now()
                }, n);
            }
        ], function (err, result) {
            if (result) {
                that.setSuccess(req);
            }
            next(err, req, res);
        });
    }
    else {
        that.setErrorMessage(req, "Parameter Missing");
        next(null, req, res);
    }
}

function removeCommentAction(req, res, next) {
    var that = this, DBActions = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        post = req.body;
    var commentId = post.commentId;
    if (commentId) {
        var commentDBAction = DBActions.getInstance(req, COMMENT_SCHEMA);
        var threadDBAction = DBActions.getInstance(req, THREAD_SCHEMA);
        var thread;
        async.series([
            function (n) {
                //get thread
                threadDBAction.get("findByThreadId", post.threadId, function (err, t) {
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
                commentDBAction.get("findByParentCommentId", commentId, function (err, c) {
                    if (c && c.length > 0) {
                        err = new Error("Nested comments exists")
                    }
                    n(err, c);
                });
            },
            function (n) {
                commentDBAction.remove(commentId, n);
            }

        ], function (err, result) {
            if (result) {
                that.setSuccess(req);
            }
            next(err, req, res);
        });
    }
    else {
        that.setErrorMessage(req, "Parameter Missing");
        next(null, req, res);
    }
}

function getCommentsAction(req, res, next) {
    var that = this, DBActions = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        threadId = params.threadId;
    if (threadId) {
        var commentDBAction = DBActions.getInstance(req, COMMENT_SCHEMA),
            userDBAction = DBActions.getInstance(req, USER_SCHEMA),
            q = commentDBAction.getQuery().where("threadId", threadId).sort("createDate"),
            comments, json = [];

        async.series([
            function (n) {
                commentDBAction.getByQuery(q, function (err, model) {
                    if (model) {
                        comments = model;
                    }
                    n(err, model);
                });
            },
            function (n) {
                async.eachSeries(comments, function (c, cb) {
                    c = c.toJSON();
                    userDBAction.getByDefaultFinderMethod(c.authorId, function (err, user) {
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
            next(err, req, res);
        });
    }
    else {
        that.setErrorMessage(req, "Parameter Missing");
        next(null, req, res);
    }
}

function postCommentAction(req, res, next) {
    var that = this, DBActions = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        post = req.body;
    var content = sanitize(post.content).xss(), threadId = post.threadId;

    if (threadId && content) {
        var userId = req.session.user.userId;
        var commentDBAction = DBActions.getInstance(req, COMMENT_SCHEMA);
        var threadDBAction = DBActions.getInstance(req, THREAD_SCHEMA),
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
                threadDBAction.get("findByThreadId", threadId, function (err, t) {
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
                commentDBAction.save(comment, n);
            },
            function (n) {
                n(null, true);

                utils.tick(function () {
                    //send email for comment notifications
                    commentDBAction.get("findByThreadId", threadId, function (err, comments) {
                        if (comments && comments.length > 0) {
                            var authorIds = _.uniq(_.pluck(comments, "authorId"));
                            var userDBAction = DBActions.getInstance(req, USER_SCHEMA),
                                query = userDBAction.getQuery();

                            var arr = [];
                            authorIds.forEach(function (id) {
                                if (userId != id) {
                                    var q = {};
                                    q["userId" ] = id;
                                    arr.push(q);
                                }
                            });
                            query.or(arr);

                            var emailUsers = [];
                            userDBAction.getByQuery(query, function (err, users) {
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
                                    m.renderBodyFromJadeTemplate(that.getApp(), tmpl, {
                                        userFullName: req.session.user.fullName.trim() + " wrote:",
                                        commentContent: content,
                                        commentDate: that.DateUtil.formatArticleDate(commentDate),
                                        commentURL: post.url
                                    }).setBcc(emailUsers);

                                    Mailer.sendMail(m, function (err, success) {
                                        if (!err) {
                                            Debug._l("Comments mail delivered successfully..")
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            }
        ], function (err, result) {
            if (result) {
//                var comments = result[1];
//                that.setJSON(req, comments);
                var pv = new that.PermissionValidator(req, thread.linkedPermissionSchemaKey, thread.linkedModelName);
                var hasAdd = pv.hasPermission("ADD_DISCUSSION", thread.linkedModelPK).isAuthorized == true,
                    hasEdit = pv.hasPermission("EDIT_DISCUSSION", thread.linkedModelPK).isAuthorized == true,
                    hasDelete = pv.hasPermission("DELETE_DISCUSSION", thread.linkedModelPK).isAuthorized == true;
                var data = {
                    auth: {
                        hasAdd: hasAdd,
                        hasEdit: hasEdit,
                        hasDelete: hasDelete
                    }
                };

                that.setSuccess(req, null, data);
            }
            next(err, req, res);
        });
    } else {
        that.setErrorMessage(req, "Parameter Missing");
        next(null, req, res);
    }

}

function initThreadAction(req, res, next) {
    var that = this, DBActions = that.getDBActionsLib(), db = that.getDB(), params = req.params,
        linkedModelFinderParam = params.linkedModelFinderParam, linkedModelName = params.linkedModelName,

    //this field is used to fetch the linked model, otherwise default modelId is used.
        linkedModelFinderField = params.linkedModelFinderField,

    //permission schema key used to validate permissions
        linkedPermissionSchemaKey = params.linkedPermissionSchemaKey;

    if (linkedModelFinderParam && linkedModelName) {
        var threadDBAction = DBActions.getInstance(req, THREAD_SCHEMA);
        var linkedModelDBAction = DBActions.getInstance(req, linkedModelName);

        var thread, model;

        async.series([
            function (next) {
                //find model obj
                var getModel = function (err, m) {
                    if (m) {
                        model = m;
                    }
                    else {
                        err = new Error("Invalid linked model.");
                    }
                    next(err, m);
                };

                if (linkedModelFinderField) {
                    var q = linkedModelDBAction.getQuery(true).where(linkedModelFinderField, linkedModelFinderParam);
                    linkedModelDBAction.getByQuery(q, getModel);
                }
                else {
                    linkedModelDBAction.getByDefaultFinderMethod(linkedModelFinderParam, getModel);
                }
            },
            function (next) {
                //find thread
                threadDBAction.get("findByLinkedModelIdAndLinkedModelName", [linkedModelFinderParam, linkedModelName], function (err, t) {
                    if (t) {
                        thread = t.toObject();
                    }
                    next(err, t);
                });
            },
            function (next) {
                if (!thread) {
                    //create thread
                    var pk = model[DBActions.getModelIdKey(linkedModelName)];

                    thread = {
                        linkedModelId: linkedModelFinderParam,
                        linkedModelName: linkedModelName,
                        linkedPermissionSchemaKey: linkedPermissionSchemaKey,
                        linkedModelFinderField: linkedModelFinderField,
                        linkedModelPK: pk
                    };
                    threadDBAction.save(thread, next);
                }
                else {
                    next(null, true);
                }
            },
            function (next) {
                //populating permission cache
                var pv = new that.PermissionValidator(req, thread.linkedPermissionSchemaKey, thread.linkedModelName);
                pv.hasPermission("ADD_DISCUSSION", thread.linkedModelPK, function () {
                    next(null, true);
                });
            }
        ], function (err, result) {
//            if (err) {
//                next(err, req, res);
//            }
//            else {
//                next(err, req, res);
//            }

            if (model && thread) {
                req.attrs.model = model;
                req.attrs.thread = thread;
            }

            next(err, req, res);
        });
    }
    else {
        that.setErrorMessage(req, "Parameter Missing");
        next(null, req, res);
    }

}
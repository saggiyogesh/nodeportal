define(["lib/ace","pluginURL", "uploader"], function () {
    var ns = Rocket.Plugin.currentPlugin.namespace, util = Rocket.Util, urls = [],
        currentThemeId, io = Rocket.io, editor, editorId, createButton, closeButton,
        openButton, tree, treeObj, treeId, treeRootNode, actionsButton, newAction, uploadAction,
        deleteAction, uploader, imageHolder;
    var validTitleName = ["css", "js", "images", "tmpl"];
    var EditSession = require("ace/edit_session").EditSession,
        Document = require("ace/document").Document,
        UndoManager = require("ace/undomanager").UndoManager;

    //Helper functions
    function getNodeId(id) {
        return  ns + "_" + id;
    }

    function getURL(action, isAppRoute) {
        if (!urls[action]) {
            urls[action] = Rocket.PluginURL({action:action, isAppRoute:isAppRoute});
        }
        return urls[action];
    }

    function showSuccessMsg(msg) {
        util.showSuccessFlash(msg);
    }

    function showErrorMsg(msg) {
        util.showErrorFlash(msg);
    }

    function getTreeActiveNode() {
        return $("#" + treeId).dynatree("getActiveNode")
    }

    function hideEditor(){
        $("#" + editorId).hide();
    }

    function hideImageHolder(){
        imageHolder.hide();
    }

    function showImage(themeId, folderName, fileName){
        hideEditor();
        imageHolder.attr("src", getURL("show") + "/" + themeId + "/" + folderName + "/" + fileName).show();
    }

    /**
     * Handler for save file changes
     * @param {String} themeId
     * @param {String} folderName
     * @param {String} fileName
     * @param {String} text
     */
    function saveFileChanges(themeId, folderName, fileName, text) {
        io({
            url:getURL("save") + "/" + themeId + "/" + folderName + "/" + fileName,
            data:{
                content:encodeURI(text)
            },
            callback:function (isSuccess, message, response) {
                if (!isSuccess) {
                    showErrorMsg(message);
                }
            }
        });
    }

    /**
     * Initialize editor for each file opened
     * @param {String} themeId
     * @param {String} folderName
     * @param {String} fileName
     * @param {String} text
     * @param {String} mode
     */
    function initAceEditor(themeId, folderName, fileName, text, mode) {
        hideImageHolder();
        $("#" + editorId).show();
        var doc = new Document(text);
        var session = new EditSession(doc, "ace/mode/" + mode);
        session.setUndoManager(new UndoManager());
        editor.setSession(session);

        //bind change event for text changes in opened file and save them.
        doc.on('change', function (e) {
            // e.type, etc
            console.log(e);
            saveFileChanges(themeId, folderName, fileName, doc.getValue());
        });
    }


    /**
     * Handler when theme file is activated in tree, calls io to show file content
     * @param {Number} themeId
     * @param {String} folderName
     * @param {String} fileName
     */
    function openFile(themeId, folderName, fileName) {
        if (themeId && folderName && fileName) {
            //if image then display it
            if (folderName === "images") {
                showImage(themeId, folderName, fileName);
                return;
            }

            var options = {
                url:getURL("show") + "/" + themeId + "/" + folderName + "/" + fileName,
                success:function (response) {
                    if (response.status === "error") {
                        util.showErrorFlash(response.message);
                    }
                    else {
                        // if js, css or jade file then show in editor
                        var mode = "scss";
                        if (fileName.indexOf(".js") > -1) {
                            mode = "javascript";
                        }
                        else if (fileName.indexOf(".css") > -1) {
                            mode = "css";
                        }

                        initAceEditor(themeId, folderName, fileName, response, mode);
                    }
                }
            };
            Rocket.ajax(options);
        }
    }

    /**
     * Renders theme's folders as tree in left side and attach handlers on each file
     * @param {String} themeId
     * @param {Object} fileList
     */
    function renderThemeTree(themeId, fileList, themeName) {
        var getTreeNodes = function (arr) {
            var ret = [];
            _.each(arr, function (fileName) {
                ret.push({title:fileName});
            });
            return ret;
        };
        var css = {title:validTitleName[0], isFolder:true, children:getTreeNodes(fileList["css"])},
            js = {title:validTitleName[1], isFolder:true, children:getTreeNodes(fileList["js"])},
            images = {title:validTitleName[2], isFolder:true, children:getTreeNodes(fileList["images"])},
            tmpl = {title:validTitleName[3], isFolder:true, children:getTreeNodes(fileList["tmpl"])},
            children = [css, images, js, tmpl];
        tree = treeObj.dynatree({
                onActivate:function (node) {
                    var data = node.data;
                    if (!data.isFolder) {
                        openFile(themeId, node.parent.data.title, data.title);
                    }
                    else {
                        hideEditor();
                        hideImageHolder();
                    }
                },
                children:{title:themeName, children:children, isFolder:true, expand:true}
            }
        );
        $(tree).dynatree("getTree").reload();
    }

    function openTheme(id) {
        io({
            url:getURL("openTheme") + "/" + id,
            callback:function (isSuccess, message, response) {
                if (isSuccess) {
                    showSuccessMsg(message);
                }
                else {
                    showErrorMsg(message);
                }
                if (response) {
                    renderThemeTree(response.id, response.files, response.name);
                    currentThemeId = id;
                    util.toggleButtonDisable(openButton);
                    util.toggleButtonDisable(createButton);
                    util.toggleButtonDisable(closeButton);
                    util.toggleButtonDisable(actionsButton);
                }
            }
        });
    }

    function uploadSuccess(data) {
        var node = getTreeActiveNode();
        if (node) {
            var title = node.data.title;
            if (node.data.isFolder && _.indexOf(validTitleName, title) > -1) {
                node.addChild({title:data.files[0].name});
            }
        }

    }

//Init
    editorId = getNodeId("code");
    editor = ace.edit(editorId);
    editor.setTheme("ace/theme/chrome");
    createButton = $("#" + getNodeId("create"));
    closeButton = $("#" + getNodeId("close"));
    openButton = $("#" + getNodeId("open"));
    treeId = getNodeId("themeTree");
    treeObj = $("#" + treeId);
    actionsButton = $("#" + getNodeId("actions"));
    newAction = $("#" + getNodeId("newAction"));
    uploadAction = $("#" + getNodeId("uploadAction"));
    deleteAction = $("#" + getNodeId("deleteAction"));
    uploader = new Rocket.Uploader({
        uploaderId:getNodeId("uploader"),
        url:getURL("uploadThemeFile"),
        onSuccess:uploadSuccess

    });
    imageHolder = $("#" + getNodeId("image"));


//Attach events to nodes
//handle create event
    createButton.click(function (e) {
        var name = $.trim(prompt("Enter new theme name"));
        if (name) {
            io({
                url:getURL("newTheme") + "/" + name,
                callback:function (isSuccess, message, response) {
                    if (isSuccess) {
                        showSuccessMsg(message);
                    }
                    else {
                        showErrorMsg(message);
                    }
                }
            });
        }
    });

//handle close button event close current opened theme and clearing tree also enable create and disable close button
    closeButton.click(function (e) {
        currentThemeId = null;
        util.toggleButtonDisable(openButton);
        util.toggleButtonDisable(createButton);
        util.toggleButtonDisable(closeButton);
        util.disableButton(actionsButton);
        treeObj.empty();
        editor.destroy();
        hideEditor();
        hideImageHolder();
    });

//handle theme select event
    $("." + ns + "-themeItem").click(function (e) {
        var curTgt = $(e.currentTarget);
        var id = curTgt.data("id");
        if (id) {
            openTheme(id);
        }
    });

//handle new file action
    newAction.click(function (e) {
        var tgt = e.currentTarget;
        var node = getTreeActiveNode();
        if (node) {
            var data = node.data, title = data.title;
            if (data.isFolder && _.indexOf(validTitleName, title) > -1) {
                var name = $.trim(prompt("Enter new file name"));
                if (name) {
                    io({
                        url:getURL("newFile") + "/" + currentThemeId + "/" + title + "/" + name,
                        callback:function (isSuccess, message, response) {
                            if (isSuccess) {
                                showSuccessMsg(message);
                                node.addChild({title:name});
                            }
                            else {
                                showErrorMsg(message);
                            }
                        }
                    });
                }
            }
        }
    });

//handle file delete action
    deleteAction.click(function (e) {
        var tgt = e.currentTarget;
        var node = getTreeActiveNode();
        if (node) {
            var data = node.data, name = data.title, folderName = node.parent.data.title;
            if (!data.isFolder) {
                var c = confirm('Are you sure to delete this ?');
                if (c == true) {
                    io({
                        url:getURL("deleteFile") + "/" + currentThemeId + "/" + folderName + "/" + name,
                        callback:function (isSuccess, message, response) {
                            if (isSuccess) {
                                showSuccessMsg(message);
                                node.remove();
                                hideEditor();
                                hideImageHolder();
                            }
                            else {
                                showErrorMsg(message);
                            }
                        }
                    });
                }
            }
        }
    });

//handle file upload action
    uploadAction.click(function (e) {
        var tgt = e.currentTarget;
        var node = getTreeActiveNode();
        if (node) {
            var data = node.data, title = data.title;
            if (data.isFolder && _.indexOf(validTitleName, title) > -1) {
                uploader.open();
                uploader.setData({"folderName":title, "themeId":currentThemeId});
            }
        }
    });
});
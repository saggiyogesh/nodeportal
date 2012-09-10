$(function () {
    var folderId = 0, resourceModels = [], urls = {},
        path = [
            {name:"Home", resourceId:0, type:'folder'}
        ]; // tracks whole user walk from parent to child folder and vice-versa
    var FOLDER_TYPE = "folder";
    var EDIT_MENU_COMMAND = "edit", RENAME_MENU_COMMAND = "rename", DOWNLOAD_MENU_COMMAND = "download",
        DELETE_MENU_COMMAND = "delete", ADD_SUBFOLDER_MENU_COMMAND = "add-subfolder";

    var TREE_LI_TMPL = _.template("<li><a class='tree-node folder' id='<%=folderId%>' href='javascript:;'><i class='icon-folder-close'></i> <%=name%></a></li>");
    var TREE_UP_LI_TMPL = _.template("<li><a class='tree-node-up' id='<%=parentFolderId%>' ><i></i> Up</a></li>");
    var BREADCRUMB_FOLDER_TMPL = _.template("<a id='<%=resourceId%>' href='javascript:;'><%=name%></a>");
    var uploadErrContainer = $("#upload_error"), errMsgHolder = uploadErrContainer.find("#error_message"),
        resourceView = $(".resource-view"), resourcesList = resourceView.find("#list"),
        resourceDetail = resourceView.find('#detail'), resourceTree = $(".resource-tree"),
        resourceTreeList = resourceTree.find("ul"), breadcrumbs = $('#breadcrumbs'),
        successMsgContainer = $('#successMsg'), uploadFileList;

    var DEFAULT_DETAIL_WIDTH = 400, DEFAULT_DETAIL_HEIGHT = 400;

    var IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "bmp"];

    function getURL(action, isAppRoute) {
        return Rocket.PluginURL({action:action, isAppRoute:isAppRoute});
    }


    //code with the help of google
    function getBytesWithUnit(bytes) {
        if (isNaN(bytes)) {
            return;
        }
        var units = [ ' bytes', ' KB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB' ];
        var amountOf2s = Math.floor(Math.log(+bytes) / Math.log(2));
        if (amountOf2s < 1) {
            amountOf2s = 0;
        }
        var i = Math.floor(amountOf2s / 10);
        bytes = +bytes / Math.pow(2, 10 * i);


        if (bytes.toString().length > bytes.toFixed(2).toString().length) {
            bytes = bytes.toFixed(2);
        }
        return bytes + units[i];
    }


    function getCurrentItem() {
        return path[path.length - 1];
    }


    function showErrMsg(message) {
        uploadErrContainer.removeClass("ui-helper-hidden");
        errMsgHolder.html(message);
    }

    function resetErrMsg() {
        uploadErrContainer.addClass("ui-helper-hidden");
    }

    function showSuccessMsg(message) {
        successMsgContainer.removeClass("ui-helper-hidden");
        successMsgContainer.find('span').html(message);
    }

    function resetSuccessMsg() {
        successMsgContainer.addClass("ui-helper-hidden");
    }

    function resetUploadFileList() {
        if (!uploadFileList) {
            uploadFileList = $('#uploader ul.qq-upload-list');
        }
        uploadFileList.html("");
    }

    function resetAllMsgs() {
        resetSuccessMsg();
        resetErrMsg();
        resetUploadFileList();
    }

    function initUploader(url) {
        //create ajax uploader
        new qq.FileUploader({
            element:document.getElementById('uploader'),
            // path to server-side upload script
            action:url + "/",
            params:{type:"ajaxUpload"},
            showMessage:showErrMsg,
            onSubmit:function (id, fileName) {
                this.params.folderId = folderId; // to set folderId for each request
                resetAllMsgs();
            },
            onComplete:function (id, fileName, responseJSON) {
                renderItemsByFolderId(responseJSON.folderId || folderId);
                if (getCurrentItem().type !== FOLDER_TYPE) {
                    upWalk();
                }
            },
            allowedExtensions:["aac", "avi", "bmp", "chm", "css", "default", "dll", "doc", "fla", "gif", "htm" , "html",
                "ini", "jar", "jpeg", "jpg", "js", "lasso", "mdb", "mov", "mp3", ",mpg",
                "pdf", "php", "ppt", "py", "rb", "real", "reg", "rtf", "sql", "swf", "txt",
                "vbs", "wav", "wma", "xls", "xml", "xsl", "zip", "jar", "war", "png"]
        });
    }

    //update breadcrumb
    function updateBreadcrumb() {
        breadcrumbs.html("");
        var buffer = [];
        for (var i = 0; i < path.length; i++) {
            var node = path[i];
            if (node.type == FOLDER_TYPE) {
                var divider = "<span class='divider'>/</span>"
                if (i == path.length - 1) { //chk for last item
                    divider = "";
                }
                buffer.push("<li><a href='javascript:;' id='" + node.resourceId + "'>" + node.name + " </a> " + divider + "</li>");
            } else {
                buffer.push("<span  id='" + node.resourceId + "'>" + node.name + " </span>");
                // breadcrumbs.append("<li><span  id='"+ node.resourceId+"'>" + node.name + " </span></li>");
            }
        }

        breadcrumbs.append(buffer.join(""));

        breadcrumbs.find('a').click(function (e) {
            var id = e.currentTarget.id;
            try {
                id = parseInt(id);
            }
            catch (e) {
            }
            renderItemsByFolderId(id);
            while (true) {
                var cur = getCurrentItem();
                if (id == cur.resourceId) {
                    break;
                }
                path.pop();
            }
            updateBreadcrumb();
        });

        //handle disabling of Up node in tree when folderId is zero
        if (folderId === 0) {
            var upNode = resourceTree.find('ul li:first-child');
            if (path.length > 1) {
                upNode.removeClass('disabled');
                upNode.find('i').addClass('icon-arrow-up');
            }
            else {
                upNode.addClass('disabled');
                upNode.find('i').addClass('icon-home');
            }
        }
    }

    function getDownloadURL(id) {
        return Rocket.Util.getOrigin() + urls["view"] + '/' + id;
    }

    function upWalk(renderFolder) {
        path.pop();
        updateBreadcrumb();
        if (renderFolder) renderItemsByFolderId(getCurrentItem().resourceId);
    }

    //handle item click. show item in edit mode
    function renderItemHTML(model) {
        var imgHolder = resourceDetail.find('img'),
            isImage = _.indexOf(IMAGE_EXTENSIONS, model.type.toLowerCase()) > -1 ? true : false;
        if (isImage) {
            var url = urls["detail"] + '/' + model.resourceId;
            imgHolder.attr('src', url);
        }
        else {
            imgHolder.width(DEFAULT_DETAIL_WIDTH);
            imgHolder.height(DEFAULT_DETAIL_HEIGHT);
            imgHolder.attr('src', '/images/fileicons/' + model.type.toLowerCase() + '.png');
        }

        var meta = resourceDetail.find('.meta');
        meta.find('.size').html("<b>Size: </b>" + getBytesWithUnit(model.size));
        meta.find('.name').html("<b>Name: </b>" + model.name);
        meta.find('.type').html("<b>Extension: </b>" + model.type);
        if (isImage) {
            meta.find('.pixels').html("<b>Pixels: </b>" + model.dimensions).show();
        }
        else {
            meta.find('.pixels').hide();
        }
        meta.find('.url').html("<b>URL: </b><input type='text' class='input-xlarge' value='" + getDownloadURL(model.resourceId) + "'/>");
        meta.find('.url input').focus(function () {$(this).select();}).mouseup(function (e) {e.preventDefault();});
        resourcesList.hide();
        resourceDetail.show();
    }

    //Item full view tool bar click handler
    (function () {
        resourceDetail.find('#download').click(function () {
            download(getCurrentItem().resourceId);
        });
        resourceDetail.find('#rename').click(function () {
            var model = getCurrentItem();
            rename(model.resourceId, false, function (newName) {
                model.name = newName;
                resourceDetail.find('.name').html("Name: " + newName);
                breadcrumbs.find('span#' + model.resourceId).html(newName);
            });
        });
        resourceDetail.find('#delete').click(function () {
            var model = getCurrentItem();
            remove(model.resourceId, model.type, function () {
                upWalk();
                resourceDetail.hide();
                resourcesList.show();
            });

        });
        $(resourceDetail.find('#go-up')).click(function () {
            resetAllMsgs();
            upWalk(true);
            resourceDetail.hide();
            resourcesList.show();
        });

        initUploader(getURL("uploadResource"));

//        getURL("uploadResource", initUploader);
        urls["view"] = getURL("view", true);
        urls["addFolder"] = getURL("addFolder");
        urls["rename"] = getURL("rename");
        urls["delete"] = getURL("delete");
        urls["download"] = getURL("download", true);
        urls["detail"] = getURL("detail");

    })();


    function handleItemClick(e) {
        //console.log(e);
        resetAllMsgs();
        var tgt = e.currentTarget, id = tgt.children[0].id;
        //open item in resouce view in edit mode

        for (var i = 0; i < resourceModels.length; i++) {
            var model = resourceModels[i];
            if (id == model.resourceId) {
                path.push(model);
                updateBreadcrumb();

                //continue on this code
                //console.log(model);
                //resourceView.html();
                if (model.type == FOLDER_TYPE) {
                    renderItemsByFolderId(model.resourceId);
                }
                else {
                    renderItemHTML(model);
                }
                break;
            }
        }
    }


    //attach menu as per type
    function attachMenu(item) {
        var menuType = item.find('a').hasClass(FOLDER_TYPE) ? "folderMenu" : "itemMenu";
        item.contextMenu({
                menu:menuType
            },
            function (action, el, pos) {
                switch (action) {
                    case ADD_SUBFOLDER_MENU_COMMAND:
                        var parentFolderId = el.find('a').attr('id');
                        addFolder(parentFolderId);
                        break;
                    case DOWNLOAD_MENU_COMMAND:
                        download(el.find('a').attr('id'));
                        break;
                    case RENAME_MENU_COMMAND:
                        rename(el.find('a').attr('id'), true);
                        break;
                    case DELETE_MENU_COMMAND:
                        var link = el.find('a');
                        remove(link.attr('id'), link.hasClass(FOLDER_TYPE) ? FOLDER_TYPE : "");
                        break;
                    default:
                        alert("Todo: apply action '" + action + "' to node " + el);
                }
            });

    }


    //fetch items under a folder
    function renderItemsByFolderId(id) {
        resourceDetail.hide();
        resourcesList.show();
        folderId = id;
        urls["getResources"] = urls["getResources"] || getURL("getResources");
        var options = {
            url:urls["getResources"] + '/' + id,
            data:{mode:"exclusive", noClientScript:true},
            success:function (data) {
                resourcesList.html(data);
                var items = resourcesList.find("li");
                items.click(handleItemClick);
                _.each(items, function (item) {
                    attachMenu($(item));
                });

            }
        };
        Rocket.ajax(options);
    }

    function createTreeUpNode(folderId) {
        var tmpl = TREE_UP_LI_TMPL({parentFolderId:folderId});
        var li = $(tmpl).appendTo(resourceTreeList);
        li.find('a.tree-node-up').click(function (e) {
            if (path.length > 1) { //disable click
                upWalk(true);
                resetAllMsgs();
            }
        });

        if (folderId === 0) {
            li.addClass("disabled");
            li.find('i').addClass('icon-home');
        }
        else {
            li.find('i').addClass('icon-arrow-up');
        }

    }

    function createTreeNode(model) {
        var tmpl = TREE_LI_TMPL({folderId:model.resourceId, name:model.name});
        var li = $(tmpl).appendTo(resourceTreeList);
        li.click(function (e) {
            if (getCurrentItem().type !== FOLDER_TYPE) { //condition when item is shown and folder is clicked. To update breadcrumb.
                path.pop();
            }
            handleItemClick(e);
        });
        attachMenu(li);
    }

    //bind manageResource:resourceView:change event
    Rocket.bind("manageResource:resourceViewList:change", function (e) {
        //console.log("manageResource:resourceView");
        resourceModels = e.data;
        resourceTreeList.html("");

        //update folder tree on left side
        createTreeUpNode(folderId);
        _.each(resourceModels, function (model) {
            if (model.type == FOLDER_TYPE) {
                createTreeNode(model);
            }
        });
    });

    function download(id) {
        window.location.href = getDownloadURL(id);
    }

    function remove(id, type, next) {
        resetAllMsgs();
        var c = confirm('Are you sure to delete this ?');
        if (c == true) {
            var url = urls["delete"] + '/' + id + '/' + type;
            var options = {
                url:url,
                success:function (data) {
                    if (data.success == true) {
                        showSuccessMsg("Deleted successfully.");
                        if (next && _.isFunction(next))   next();
                        renderItemsByFolderId(folderId);
                    }
                    else if (data.error) {
                        showErrMsg(data.error);
                    }
                }
            };
            Rocket.ajax(options);
        }
    }


    function rename(id, renderFolder, next) {
        resetAllMsgs();
        var name = $.trim(prompt("Enter new name"));
        if (name) {
            var url = urls["rename"] + '/' + name + '/' + id + '/' + folderId;
            var options = {
                url:url,
                success:function (data) {
                    if (data.success == true) {
                        showSuccessMsg("Renamed successfully.");
                        if (next && _.isFunction(next))   next(name);
                        renderFolder && renderItemsByFolderId(folderId);
                    }
                    else if (data.error) {
                        showErrMsg(data.error);
                    }
                }
            };
            Rocket.ajax(options);
            return name;
        }
    }


    function addFolder(parentFolderId, reload) {
        resetAllMsgs();
        var name = $.trim(prompt("Enter new folder name"));
        if (name) {
            var url = urls["addFolder"] + '/' + name + '/' + parentFolderId;
            var options = {
                url:url,
                success:function (data) {
                    if (reload && data.success == true) {
                        showSuccessMsg("Folder added successfully.");
                        renderItemsByFolderId(folderId);
                    }
                    else if (data.error) {
                        showErrMsg(data.error);
                    }
                }
            };
            Rocket.ajax(options);
        }

    }

    //add folder
    $("#addFolder").click(function () {
        addFolder(folderId, true);
        if (getCurrentItem().type !== FOLDER_TYPE) {
            upWalk();
        }
    });

    //init
    renderItemsByFolderId(folderId);
    updateBreadcrumb();
});
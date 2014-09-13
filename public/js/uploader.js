/**
 * Lib for ajax uploading of file to server.
 */
define(["util", "_", "dynaTree", "fileUpload", "modal"], function () {
    var
        UPLOADER_TMPL = '<form id="<%=uploaderId%>" action="" method="POST" enctype="multipart/form-data">' +
            '<div class="row fileupload-buttonbar"><div class="span4"><span class="btn btn-success fileinput-button">' +
            '<i class="icon-plus icon-white"></i><span>Add file(s)</span><input type="file" name="files[]" multiple>' +
            '</span> <button type="submit" class="btn btn-primary start"><i class="icon-upload icon-white"></i>' +
            '<span>Start all</span></button> <button type="reset" class="btn btn-warning cancel">' +
            '<i class="icon-ban-circle icon-white"></i><span>Cancel all</span></button></div>' +
            '<div class="span4 drop-alert hide" ><div class="alert alert-success"><strong>Drop files !!</strong></div></div>' +
            '<div class="span5 fileupload-progress fade"><div class="progress progress-success progress-striped ' +
            'active" role="progressbar" aria-valuemin="0" aria-valuemax="100"><div class="bar" style="width:0%;"></div>' +
            '</div><div class="progress-extended"></div></div></div><div class="fileupload-loading"></div>' +
            '<br><table role="presentation" class="table table-striped"><tbody class="files" ' +
            'data-toggle="modal-gallery" data-target="#modal-gallery"></tbody></table></form>',

        HIDDEN_INPUT_TMPL = '<input type="hidden" name="<%=name%>" value="<%=value%>" class="uploader-hidden-input"/>';

    /**
     * Constructor.
     * options object supports mostly all options of jQuery-File-Upload(https://github.com/blueimp/jQuery-File-Upload/wiki/Options)
     * Compulsory are :
     * url {String} : server url to which files are uploaded
     * Optional are:
     * uploaderId {String}: Id of ajax uploader. This is not the html node id. No need to create html node.
     * deleteFormData {Boolean}: Default value is false. if true then after each upload, form hidden params are cleared.
     * @param {Object} options
     */
    function uploader(options) {
        this.uploaderId = options.uploaderId || _.uniqueId("__uploader__");
        this.url = options.url;
        this.deleteFormData = options.deleteFormData || false;
        this.options = options;
        this.init();
    }

    /**
     * Initializes the uploader
     */
    uploader.prototype.init = function () {
        var that = this;
        that.modelId = that.uploaderId + "_Model";
        that.pluginNS = Rocket.Plugin.currentPlugin.namespace;
        var uploaderCompiled = _.template(UPLOADER_TMPL);

        that.model = new Rocket.Modal({
            id: that.uploaderId,
            body: uploaderCompiled({
                uploaderId: that.uploaderId
            }),
            title: "Upload files to server",
            width: 0.7,
            onHide: function () {
                that._clearFormData();
                that._clearUploads();
            }

        });

        var options = that.options;

        delete options.uploaderId;

        that._onSuccess = options.onSuccess;
        delete options.onSuccess;

        that._onError = options.onError;
        delete options.onError;

        that._always = options.always;
        delete options.always;


        //default options which can't be overridden
        var defaultOpts = {
            uploadTemplateId: null,
            downloadTemplateId: null,
            uploadTemplate: function (o) {
                var rows = $();
                $.each(o.files, function (index, file) {
                    var row = $('<tr class="template-upload fade">' +
                        '<td class="name"></td>' +
                        '<td class="size"></td>' +
                        (file.error ? '<td class="error" colspan="2"><span class="label label-important">Error</span>&nbsp;<span class="msg"></span></span></td>' :
                            '<td><div class="progress">' + '<div class="bar" style="width:0%;"></div></div></td>' +
                                '<td class="start"><button class="btn btn-primary"><i class="icon-upload icon-white"></i><span>Start</span></button></td>'
                            ) + '<td class="cancel"><button class="btn btn-warning"><i class="icon-ban-circle icon-white"></i><span>Cancel</span></button></td></tr>');
                    row.find('.name').text(file.name);
                    row.find('.size').text(o.formatFileSize(file.size));
                    if (file.error) {
                        row.find('.error .msg').text(file.error);
                    }
                    rows = rows.add(row);
                });
                return rows;
            },
            downloadTemplate: function (o) {
                var rows = $();
                $.each(o.files, function (index, file) {
                    var row = $('<tr class="template-download fade">' +
                        (file.error ? '<td class="name"></td>' +
                            '<td class="size"></td><td class="error" colspan="3"><span class="label label-important">Error</span>&nbsp;<span class="msg"></span></span></td>' :
                            '<td class="name"></td>' +
                                '<td class="size"></td><td class="success" colspan="3"><span class="label label-success">Success</span>&nbsp;<span class="msg">Upload Successful</span></td>'
                            ) + '</tr>');
                    row.find('.name').text(file.name);
                    row.find('.size').text(o.formatFileSize(file.size));
                    if (file.error) {
                        row.find('.error .msg').text(file.error);
                    }
                    rows = rows.add(row);
                });
                return rows;
            }
        };
        _.extend(options, defaultOpts);
        options.always = that._handleAlways();

        //setting up model as drop zone
//        options.dropZone = $("#" + that.uploaderId);

        $('#' + that.uploaderId).fileupload(options);

        that.form = $('#' + that.uploaderId);

        that.bindEvents();
    };

    /**
     * Files drag drop events are attached with the uploader.
     */
    uploader.prototype.bindEvents = function () {
        var that = this;
        var dropAlert = $("#" + that.modelId + " .drop-alert");
        $("#" + that.uploaderId)
            .on("dragover", function (e) {
                dropAlert.show();
            })
            .on('dragleave', function (e) {
                dropAlert.hide();
            })
            .on('drop', function (e) {
                dropAlert.hide();
            });
    };

    /**
     * To open the Model of uploader
     */
    uploader.prototype.open = function () {
        var that = this;
        that.model.show();
    };

    /**
     * Sets data key values as hidden form fields
     * @param {Object} data
     */
    uploader.prototype.setData = function (data) {
        var that = this, com = _.template(HIDDEN_INPUT_TMPL),
            form = $("#" + that.uploaderId),
            pluginNS = that.pluginNS;

        _.each(data, function (value, name) {
            // if plugin namespace is there then post form data for that plugin
            if (pluginNS)
                name = pluginNS + "[" + name + "]";
            form.append(com({name: name, value: value}));
        });
    };

    /**
     * Provides handler of 'always' event of uploader.
     */
    uploader.prototype._handleAlways = function () {
        var that = this, options = that.options;
        return function (e, data) {
            console.log(e);
            console.log(data)

            //handle error text from server
            var responseJSON = data.jqXHR.responseJSON;
            if (data.textStatus === "error" || responseJSON.status === "error") {
                var errMsg = responseJSON.message;
                data.files[0].error = errMsg;
            }
            
            if (that.deleteFormData) {
                //empty the form hidden data elements after request
                that._clearFormData();
            }
            if (that._always) {
                that._always(e, data);
            }
            if (that._onSuccess && data.textStatus === "success") {
                that._onSuccess(data.result);
            }

            if (that._onError && data.textStatus === "error") {
                that._onError(data.result);
            }

        };
    };

    /**
     * Clears form's hidden data inputs
     */
    uploader.prototype._clearFormData = function () {
        this.form.find("input.uploader-hidden-input").remove();
    };

    /**
     * Clears the upload info's
     */
    uploader.prototype._clearUploads = function () {
        this.form.find("tr").remove();
    };

    Rocket.Uploader = uploader;
});
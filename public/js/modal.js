define(["util", "_", "bootstrap"], function () {
    var MODAL_TMPL = '<div id="<%=id%>" class="modal hide fade" tabindex="-1" role="dialog" ' +
        'aria-labelledby="<%=id%>_Label" aria-hidden="true" style="display: none;"><div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>' +
        '<h3 id="myModalLabel"><%=modalHeading%></h3></div><div class="modal-body"><%=modalBody %></div>' +
        '<div class="modal-footer"><button class="btn" data-dismiss="modal">Close</button></div></div>';


    /**
     * Constructor to create a bootstrap modal
     * options keys are:
     * id {String} Id of Modal
     * title {String} Title of Modal
     * body {String|Object} Body appended in modal
     * width {Number} Width of modal in decimals default is 0.5
     * closeOnEsc {Boolean} Close Modal by Escape key
     * remote {String} Content is loaded in modal's body
     * onShow {Function} Listener of modal show event
     * onShown {Function} Listener of modal shown event
     * onHide {Function} Listener of modal hide event
     * onHidden {Function} Listener of modal hidden event
     * @param options
     * @constructor
     */
    function Modal(options) {
        this.id = options.id + "_Modal";
        this.title = options.title;
        this.body = options.body;
        this.options = options;
        this.width = options.width || 0.5 // https://github.com/twbs/bootstrap/issues/675

        this._init();
        this._bindEvents()
    }

    Modal.prototype._init = function () {
        var that = this;

        var modalCompiled = _.template(MODAL_TMPL);

        var modalHTML = modalCompiled({
            id: that.id,
            modalHeading: that.title,
            modalBody: that.body
        });
        var body = $("body");

        body.append(modalHTML);
        var options = that.options;
        $('#' + that.id).modal({
            backdrop: options.backdrop,
            keyboard: options.closeOnEsc,
            remote: options.remote,
            show: false
        }).css({
                'width': function () {
                    return ($(document).width() * that.width) + 'px';
                },
                'margin-left': function () {
                    return -($(this).width() / 2);
                }
            });

    };

    /**
     * Method to show the modal
     */
    Modal.prototype.show = function () {
        var that = this;
        $('#' + that.id).modal('show');
    };

    /**
     * Method to hide the modal
     */
    Modal.prototype.hide = function () {
        var that = this;
        $('#' + that.id).modal('hide');
    };


    /**
     * Method to get jquery object of body of Modal
     */
    Modal.prototype.getBody = function () {
        var that = this;
        return $("#" + that.id + " .modal-body");

    };

    Modal.prototype._bindEvents = function () {
        var that = this;
        var options = that.options;
        $('#' + that.id).on('show', options.onShow).on('hide', options.onHide)
            .on('shown', options.onShown).on('hidden', options.onHidden);
    };

    Rocket.Modal = Modal;
});
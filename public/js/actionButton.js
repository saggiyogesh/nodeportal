define(["util", "_", "bootstrap", "plugin"], function () {
    var PARENT_TMPL = '<div class="btn-group"></div>';
    var UL_TMPL = '<ul class="dropdown-menu"><%=liHtml%></ul>';
    var LI_TMPL = '<li><a href="<%=href%>" id="<%=id%>" class="<%=className%>" <%=dataAttrs%>><%=text%></a></li>';

    var opts = {
        handlerId: "testActionButton",
        buttonType: "danger",
        buttonSize: "mini",
        dropUp: false,
        actions: [
            {text: "Action 1", id: "12", href: "http://www.google.com"},
            {
                text: "Action 2", id: "45", data: {
                id: 12,
                name: 'test_data'
            },
                onClick: function (e) {
                    console.info("clicked");
                    console.log(e);
                    console.log(this);

                }
            }
        ]
    };

    /**
     * Options:
     *      handlerId {String}: id of node(anchor tag), rendered as action button
     *      buttonType {String}: Bootstrap button class name (danger, warning, success etc). Default: none
     *      buttonSize {String}: Bootstrap button size class (mini, small etc). Default: none
     *      dropUp {Boolean}: To open drop up menu. Default: false
     *      actions {Array}: Array of objects(action) to be inserted.
     *      pullRight{String}: Drop down menu is aligned to right
     *
     *      Action options:
     *          text(String): Label to be shown
     *          id {String}: Id of the action link
     *          href{URL}: URL that to be opened when action is clicked
     *          data {Object}: data attributes for action
     *          onClick{Function}: Click event handler for action. If href is also defined then href will be opened.
     *          permissionAction {String}: permission action to check server side permission
     *
     *
     * @param options{Object}
     * @constructor
     */
    function ActionButton(options, permissionConf) {
        var that = this;
        if (!options.handlerId) {
            throw new Error("Handler is not defined in Action button");
        }

        if (!options.actions || options.actions.length === 0) {
            throw new Error("Actions are not defined in Action button");
        }


        this.permissionConf = permissionConf;

        var handlerNode = $("#" + options.handlerId);

        this.handlerNode = handlerNode;
        this.options = options

        handlerNode.attr("href", "#");
        handlerNode.addClass("btn dropdown-toggle");
        handlerNode.attr("data-toggle", "dropdown");
        handlerNode.html(handlerNode.html() + ' <span class="caret"><span>');

        if (options.buttonType) {
            handlerNode.addClass("btn-" + options.buttonType);
        }

        if (options.buttonSize) {
            handlerNode.addClass("btn-" + options.buttonSize);
        }

        this._renderParent();
        handlerNode.click(function (e) {
            var options = that.options;
            if(that.permissionConf){
                var conf = that.permissionConf;
                var permissionActions = _.pluck(options.actions, 'permissionAction');
                Rocket.Plugin.isActionsAuthorized(conf.modelId, conf.modelName, conf.permissionSchemaKey, permissionActions, function(response){
                    if(response.success == true){
                        that.getPermission = function(action){
                            return response[action];
                        }
                    }
                    that._render();
                    that._bindEvents();

                    //fix for dropdown open
                    var parent = $(that.parent);
                    parent.parent().removeClass("open");
                    parent.addClass("open");
                });
            }else{
                that._render();
                that._bindEvents();
            }

        });

        that.getPermission = function(){
            return true;
        };
    }

    ActionButton.prototype._bindEvents = function () {
        var options = this.options,
            parent = this.parent;

        _.each(options.actions, function (action) {
            var node = parent.find("li a[data-uniqid='" + action.data.uniqid + "']");
            console.log(node)
            if (node && node.length > 0) {
                $(node[0]).click(function (e) {
                    var that = this;
                    console.log(e);
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    var href = action.href;
                    if (href) {
                        window.location.href = href;
                    }
                    else if (action.onClick) {
                        var fn = action.onClick;
                        fn.apply(that, [e]);
                    }
                });
            }
        });
    };

    ActionButton.prototype._render = function () {
        if (this.parent.find('ul.dropdown-menu').length > 0) {
            return;
        }

        var that = this;
        console.log(that.getPermission("VIEW"))

        var options = this.options,
            handlerNode = this.handlerNode;
        var liHtml = [],
            liTmplCompiled = _.template(LI_TMPL),
            blankObj = {
                href: "#",
                id: "",
                className: "",
                dataAttrs: ""
            };
        _.each(options.actions, function (action) {
            action.data = action.data || {};
            action.data.uniqid = _.uniqueId("__ab__");
            var dataHtml = [];
            _.each(action.data, function (val, key) {
                console.log(key + " :: " + val);
                var h = " data-" + key + "=" + val;
                dataHtml.push(h);
            });
            action.dataAttrs = dataHtml.join(" ");

            var tmpl = liTmplCompiled(_.extend(_.clone(blankObj), action));
            if(that.getPermission(action.permissionAction)){
                liHtml.push(tmpl);
            }
//          console.log(tmpl);
        });
        console.log(liHtml);
        var ulHtml = _.template(UL_TMPL)({liHtml: liHtml.join("")});
        console.log(ulHtml);
        that.parent.append(ulHtml);
    };

    ActionButton.prototype._renderParent = function(){
        var that = this, options = that.options;

        var handlerNode = that.handlerNode;
        handlerNode.wrap(PARENT_TMPL);

        var parent = handlerNode.parent();
        if (options.dropUp) {
            parent.addClass("dropup");
        }
        if (options.pullRight) {
            parent.addClass("pull-right");
        }
        that.parent = parent;
    };


    Rocket.ActionButton = ActionButton;

    /*var opts = {
     handlerId: "testActionButton",
     buttonType: "danger",
     buttonSize: "mini",
     dropUp: false,
     actions: [
     {text: "Action 1", id: "12", href: "http://www.google.com"},
     {
     text: "Action 2", id: "45", data: {
     id: 12,
     name: 'test_data'
     },
     onClick: function (e) {
     console.info("clicked");
     console.log(e);
     console.log(this);

     }
     }
     ]
     };

     new ActionButton(opts);
     */

});
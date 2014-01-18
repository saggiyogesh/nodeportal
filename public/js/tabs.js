define(["util", "_", "bootstrap"], function () {

    var TAB_CONTAINER_TMPL = '<ul id="<%=tabId%>" class="nav"><%=tabHTML%></ul>';
    var TAB_CHILD_TMPL = '<li><a href="<%=href%>" data-tabid="<%=childId%>" data-toggle="tab"><%=text%></a></li>';

    var TAB_CONTENT_TMPL = '<div class="tab-content"></div>';
    var TAB_CONTENT_CHILD_TMPL = '<div class="tab-pane" id="<%=contentId%>"><%=content%></div>';

    var ACTIVE_CLASS_NAME = "active";

    /**
     * Constructor to create bootstrap tabs.
     * Options:
     *      containerId {String} Container in which tabs are rendered
     *      [id] {String|Number} Id of current tab
     *      pills {Boolean} Renders tabs as pills. Default false.
     *      appendHash{Boolean} Appends tab's href as url hash
     *      tabDirection {String} Should be "below", "left" or "right" to render tabs in that direction. Default none.
     *      items {Array of Objects} Tabs to be rendered
     *          Item object properties:
     *              header {String} Tab header
     *              content {String} Tab content html
     *              ajax {URL} when tab is shown response of this url is rendered in tab content overwriting existing content.
     *              active {Boolean}. If true then this tab is active. Default first tab is active.
     *              ajaxSuccess {Function}. Function called after tab content is loaded by ajax.
     * @param options
     * @constructor
     */
    function Tabs(options) {
        if (!options.containerId) {
            throw new Error("Container id not defined");
        }

        /**
         * Getter for tabs options
         * @returns {Object}
         */
        this.getOptions = function () {
            return options;
        };

        this.container = $("#" + options.containerId);
        this.tabId = options.id || _.uniqueId("__tabs__");
        var tabs = options.items;


        if (!tabs || !_.isArray(tabs)) {
            throw new Error("Empty or incorrect tab items type");
        }

        this._tabs = tabs;

        this._ajaxSource = {};

        this._ajaxSuccessFn = {};

        this._opts = options;

        this.init();
        this._handleEvents();
    }

    Tabs.prototype._handleEvents = function () {
        var that = this, appendHash = that.getOptions().appendHash;
        if (appendHash) {
            //binding window's hashChange event
            $(window).on('hashchange', function (e) {
                that.setActiveByHash();
            });
        }

        $('#' + that.tabId + ' a[data-toggle="tab"]').on('shown', function (e) {
            var tgt = $(this);
            if (appendHash) {
                location.hash = tgt.data("tabid");
            }
            var href = tgt.attr("href");
            if (that._ajaxSource[href]) {
                Rocket.ajax({
                    url: that._ajaxSource[href],
                    success: function (response) {
                        that.container.find("div.tab-content " + href).html(response);
                        var fn = that._ajaxSuccessFn[href];
                        fn && fn.call(this, response);
                    }
                });
            }
        });
    };

    /**
     * Sets the indexed tab active
     * @param {Number} index
     */
    Tabs.prototype.setActive = function (index) {
        var that = this;
        $('#' + that.tabId + ' a:eq(' + index + ')').tab('show');
    };

    /**
     * Actives the tab whose data-tabid attribute matches tabId
     * @param tabId
     */
    Tabs.prototype.setActiveByTabId = function (tabId) {
        var that = this;
        $('#' + that.tabId + " a[data-tabid='" + tabId + "']").tab('show');
    };

    /**
     * Method used to activate tab by hash. It matches data-tabid to hash.
     */
    Tabs.prototype.setActiveByHash = function () {
        var tabId;
        try {
            tabId = location.hash.split("#")[1];
        }
        catch (e) {
        }
        if (tabId) {
            this.setActiveByTabId(tabId);
        }
    };

    Tabs.prototype.init = function () {
        var that = this,
            lis = [],
            activeIndex = 0;

        //tab direction
        if (that._opts.tabDirection) {
            var direction = that._opts.tabDirection;
            var setTabDirection = function (className) {
                that.container.addClass("tabbable");
                that.container.addClass("tabs-" + className);
            };
            switch (direction) {
                case "below" :
                    setTabDirection("below");
                    break;
                case "left" :
                    setTabDirection("left");
                    break;
                case "right" :
                    setTabDirection("right");
                    break;

            }
        }

        //get tab head ul
        var ul = _.template(TAB_CONTAINER_TMPL)({
            tabId: that.tabId,
            tabHTML: ""
        });
        ul = $(ul);

        //is pills style
        if (that._opts.pills) {
            ul.addClass("nav-pills");
        }
        else {
            ul.addClass("nav-tabs")
        }


        //get tab content parent div
        var div = $(TAB_CONTENT_TMPL);


        _.each(that._tabs, function (tab, i) {
            tab.id = tab.id || _.uniqueId("__tab_item__");
            tab.href = tab.href || "#" + _.uniqueId("__tab_href__");
            var html = _.template(TAB_CHILD_TMPL)({
                href: tab.href,
                childId: tab.id,
                text: tab.header
            });
            html = $(html);

            if (tab.active) {
                activeIndex = i;
            }

            ul.append(html);
//            lis.push(html);

            //render content divs
            var childContent = _.template(TAB_CONTENT_CHILD_TMPL)({
                contentId: tab.href.split("#")[1],
                content: tab.content || ""
            });
            childContent = $(childContent);
            childContent.addClass("fade");
            if (i == 0) {
//                html.addClass(ACTIVE_CLASS_NAME);
                childContent.addClass("in");
//                childContent.addClass(ACTIVE_CLASS_NAME);
            }
            div.append(childContent);

            //insert ajax urls
            if (tab.ajax) {
                that._ajaxSource[tab.href] = tab.ajax;

                //insert ajax success functions
                that._ajaxSuccessFn[tab.href] = tab.ajaxSuccess;
            }

        });


        that.container.append(ul);
        that.container.append(div);

        //checks for appendHash option & hash
        //if available then active ta using hash
        if (!that.getOptions().appendHash || !location.hash) {
            setTimeout(function () {
                that.setActive(activeIndex);
            }, 0);
        } else {
            setTimeout(function () {
                that.setActiveByHash();
            }, 0);
        }
    };

    Rocket.Tabs = Tabs;
});
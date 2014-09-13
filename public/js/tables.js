//Bootstrap data tables plugin with multiple checkboxes to select rows and action button to add action for each row
//Only tested with ajax source
define(["_", "util", "bootstrap", "typing", "dataTable", "datatables-bootstrap", "actionButton"], function () {
    var dataTable,
        TMPL = '<table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered" id="{tableId}"></table>';
    dataTable = function (options, data) {
        var contentBox = options.contentBox, tableId = options.id || _.uniqueId("__rocket__table_");
        if (!contentBox) {
            throw new Error("Content Box is undefined");
        }

        this.getContentBox = function () {
            return $('#' + contentBox);
        };

        this.getOptions = function () {
            return options;
        };

        var opts = { "sDom": "<'row'<'span4'l><''f>r>t<'row'<'span4'i><''p>>",
            "sPaginationType": "bootstrap",
            "oLanguage": {
                "sLengthMenu": "_MENU_ records per page"
            },
            "aoColumns": this.manageColumns(options, data.columns)
        };

        if(options.hideSearch){
            opts.bFilter = false;
        }

        if (options.checkBoxAll) {
            opts["aaSorting"] = [
                [1, 'asc']
            ];
        }

        if (options.actionButton) {
            if (!options.actionButton.actions) {
                throw new Error("Actions are not defined")
            }
            var actions = options.actionButton.actions;
        }

//        if (options.contextMenu) {
//            var that = this;
//            opts["fnRowCallback"] = function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
//                //console.log(nRow);
//                var obj = {
//                    hasCheckbox: options.checkBoxAll ? true : false,
//                    contextMenu: options.contextMenu,
//                    nRow: nRow,
//                    aData: aData
//
//                };
//                that.bindContextMenu(obj);
//
//            }
//        }
        if (!options.ajax) {
            opts["aaData"] = data.values;

//            options.checkBoxAll ? this.getCBHeader(data.columns) : data.columns,
//            options.checkBoxAll ? this.manageValues(data.values) : data.values
        }
        else {
            opts["bProcessing"] = true;
            opts["bServerSide"] = true;
            opts["sAjaxSource"] = options.ajax;
            var that = this;
            opts["fnServerData"] = function (sSource, aoData, fnCallback) {
                Rocket.ajax({
                    "dataType": 'json',
                    "type": "GET",
                    "url": sSource,
                    "data": aoData,
                    "success": function (json) {
                        json.aaData = that.manageValues(json.aaData);
                        fnCallback(json);
                        if (options.checkBoxAll) {
                            that.handleCheckBoxClick();
                        }

                        if (options.actionButton) {
                            that.renderActions();
                        }
                    }
                });

            }
        }

        this.getContentBox().html(TMPL.replace("{tableId}", tableId));
        var table = this.table = $('#' + tableId).dataTable(opts), parentNode = table.parent();

        parentNode.find('.dataTables_filter input').unbind();

        parentNode.find('.dataTables_filter input').typing({
            stop: function (event, $elem) {
                table.fnFilter($elem.val());
            },
            delay: 400
        });

        if (!options.ajax && options.checkBoxAll) {
            this.handleCheckBoxClick();
        }
    };

    dataTable.prototype.renderActions = function () {
        var that = this, actions = that.getOptions().actionButton.actions;

        that.getContentBox().find('table td .action-button').each(function (i, node) {
            console.info(node)
            node = $(node);
            var opts = that.getOptions().actionButton;
            opts.handlerId = node.attr("id");
            opts.actions = actions;
            var permissionConf;
            if (opts.permissionSchemaKey) {
                permissionConf = {
                    modelId: node.data("id"),
                    modelName: opts.modelName,
                    permissionSchemaKey: opts.permissionSchemaKey
                };
            }
//            delete opts.modelName;
//            delete opts.permissionSchemaKey;
            new Rocket.ActionButton(opts, permissionConf);
        });


    };
//    dataTable.prototype.attachMenu = function (selector, contextMenu) {
//        var menuId = contextMenu.menuId, items = contextMenu.items,
//            ns = contextMenu.namespace, that = this;
//        selector = _.isString(selector) ? $("#" + selector) : selector;
//        selector.contextMenu({
//            menu: menuId
//        }, function (action, el, pos) {
//            Rocket.trigger({type: ns + ":" + menuId + ":" + action, target: that, data: {el: el, pos: pos} });
//        });
//    };
//
//    dataTable.prototype.bindContextMenu = function (obj) {
//        var hasCheckBox = obj.hasCheckbox, nRow = obj.nRow, aData = obj.aData,
//            contextMenu = obj.contextMenu;
//        this.attachMenu($(nRow), contextMenu);
//    };

    dataTable.prototype.createActionButton = function (id) {
        var that = this, options = that.getOptions();
        return "<button class='action-button' style='min-width: 80px;' id='actionButton__" + id + "' data-id='" + id + "'>  Action  </button>"
    };


    dataTable.prototype.manageValues = function (values) {
        var that = this, options = that.getOptions();
        _.each(values, function (val) {
            var id = val[0];
            if (options.checkBoxAll) {
                val[0] = that.createCB({type: 'data', value: id});
            }

            if (options.actionButton) {
                var actions = options.actionButton.actions;
                val.push(that.createActionButton(id));
            }
        });
        return values;
    };

    dataTable.prototype.manageColumns = function (options, columns) {
        var that = this;
        if (options.checkBoxAll) {
            columns = that.getCBHeader(columns);
        }

        if (options.actionButton) {
            columns.push({ "sTitle": "", "bSortable": false})
        }
        return columns;
    };

    dataTable.prototype.getCBHeader = function (columns) {
        var that = this;
        return _.flatten([
            { "sTitle": that.createCB({type: 'selectAll'}), "bSortable": false},
            columns
        ]);
    };

    dataTable.prototype.createCB = function (options) {
        var checkbox_tmpl = '<td><input type="checkbox"/></td>';
        if (!options.type) throw Error("Type is not defined.");

        var cbContainer = $(checkbox_tmpl), cb = cbContainer.find('input');

        if (options.type == "selectAll") {
            cb.attr("id", "selectAll");
        }
        else if (options.type == "data") {
            cb.addClass("cb-data");
        }

        if (options.value) {
            cb.val(options.value);
        }
//        console.log(cb);
//        console.log("con> " + cbContainer.html());


        return cbContainer.html();

    };

    dataTable.prototype.handleCheckBoxClick = function () {
        var table = this.table, cbData = table.find(".cb-data"), tableId = table.attr("id"),
            getCBValues = function () {
                var values = [];
                table.find(".cb-data:checked").each(function () {
                    values.push($(this).val());
                });
                return values;
            };
        table.find("#selectAll").click(function () {
            cbData.attr('checked', this.checked);
            Rocket.trigger({type: tableId + ":checkBox:click", target: this, data: getCBValues()});
        });

        cbData.click(function () {
            if (cbData.length == table.find(".cb-data:checked").length) {
                table.find("#selectAll").attr("checked", "checked");
            } else {
                table.find("#selectAll").removeAttr("checked");
            }
            Rocket.trigger({type: tableId + ":checkBox:click", target: this, data: getCBValues()});

        });
    };


    Rocket.Table = dataTable;
});


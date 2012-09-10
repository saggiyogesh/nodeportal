//Inspired from nettuts.
$(function () {
    var settings = {
        columns:".column",
        contentSelector:".plugin-body",
        handleSelector:".plugin-head"
    };

    var items = $(".column .plugin"), columnsSelector = ".column",
        handleSelector = ".plugin-head", contentSelector = ".plugin-body";

    items.find(handleSelector).css({
        cursor:'move'
    }).mousedown(
        function (e) {
            items.css({width:''});
            $(this).parent().css({
                width:$(this).parent().width() + 'px'
            });
        }).mouseup(function () {
            if (!$(this).parent().hasClass('dragging')) {
                $(this).parent().css({width:''});
            } else {
                $(columnsSelector).sortable('disable');
            }
        });

    $(columnsSelector).sortable({
        appendTo:'body',
        //tolerance: 'pointer',
        distance:2,
        scrollSensitivity:50,
        scrollSpeed:30,
        items:items,
        connectWith:$(columnsSelector),
        handle:handleSelector,
        placeholder:'plugin-placeholder',
        forcePlaceholderSize:true,
        revert:300,
        delay:100,
        opacity:0.8,
        containment:'document',
        start:function (e, ui) {
            $(ui.helper).addClass('dragging');
        },
        stop:function (e, ui) {
            $(ui.item).css({width:''}).removeClass('dragging');
            $(columnsSelector).sortable('enable');
            var cols = $(".container .column"), obj = {};
            cols.each(function(i, n){
                obj[i] = [];
                var plugins = $(n).find('.plugin');
                plugins.each(function(j , n){
                    if(j == 0){
                    }
                    obj[i].push($(n).attr("id"))
                });
            });
            //console.log(obj);
            var options = {
                url:"/app/updatePageData",
                method:"POST",
                data:{data:JSON.stringify(obj), pageId : Rocket.PageValues.getPageId()},
                success:function (data) {

                }
            };
            Rocket.ajax(options);
        }
    });

});
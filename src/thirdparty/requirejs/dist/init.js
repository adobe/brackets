$(document).ready(function($) {

    // set panel min-height to full browser height
    $(window).bind("load resize", function(){
        var h = $(window).height();
        $("#wrapper, #grid, #navBg").css({ "min-height" : (h) });
        $("#content").css({ "min-height" : (h-168) });
    });

    // toggle grid

    $("#grid").hide();

    $(document.documentElement).keyup(function (event) {
        if (event.keyCode == 71) {
            $("#grid").fadeToggle(100);
        }
    });

    // if window is larger than #nav then #nav == fixed, if #nav is larger than window #nav == relative
    $(window).bind("load resize", function(){
        var w = $(window).height();
        var h = $("#nav").outerHeight();
        $("#nav").css("position",(w < h) ? "" : "fixed");
    });

    // open / close off-canvas navigation
    $('.off-canvas-button').click(function() {
        // transform button to close shape
        $(this).toggleClass('open');
        // slide in side navigation
        $('#nav').toggleClass('open');
    });
    // done!
});

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets: true, $*/

define(function (require, exports, module) {
    "use strict";

    var Menus               = brackets.getModule("command/Menus"),
        Resizer             = brackets.getModule("utils/Resizer"),
        UrlParams           = brackets.getModule("utils/UrlParams").UrlParams,
        StatusBar           = brackets.getModule("widgets/StatusBar"),
        Strings             = brackets.getModule("strings"),
        MainViewManager     = brackets.getModule("view/MainViewManager");

    var PhonePreview  = require("text!lib/Mobile.html");
    var PostMessageTransport = require("lib/PostMessageTransport");
    var IframeBrowser = require("lib/iframe-browser");
    var Compatibility = require("lib/compatibility");

    /**
     * This function calls all the hide functions and listens
     * for bramble to be loaded
     */
    function initUI(callback) {
        addLivePreviewButton(function() {
            toggleMobileViewButton();

            if(shouldHideUI()) {
                removeTitleBar();
                removeMainToolBar();
                removeLeftSideToolBar();
                removeRightSideToolBar();
            }

            callback();
        });
    }

    /**
     * This function parses brackets URL, and looks for the GET parameter "ui"
     * if ui is set to 1, then the UI is shown
     */
    function shouldHideUI() {
        var params = new UrlParams();
        params.parse();
        return params.get("ui") !== "1";
    }

    /**
     * This function merely removes the left side tool bar
     */
    function removeLeftSideToolBar() {
        //Hide second pane working set list
        $("#working-set-list-second-pane").addClass("hideLeftToolbar");
        //Remove splitview button
        $("#sidebar .working-set-splitview-btn").remove();
        Resizer.hide("#sidebar");
    }

    /**
     * This function merely removes the title bar
     * and the header of the first pane
     */
    function removeTitleBar() {
        $("#titlebar").remove();
        $("#first-pane .pane-header").remove();
        //Alter the height of the affected elements
        $("#editor-holder").addClass("editor-holder-height");
        $("#first-pane .pane-content, .cm-s-light-theme").addClass("first-pane-height");
    }

    /**
     * Used to remove the top tool bar
     */
    function removeMainToolBar() {
        //remove the file menu
        Menus.removeMenu(Menus.AppMenuBar.FILE_MENU);

        //remove the edit menu
        Menus.removeMenu(Menus.AppMenuBar.EDIT_MENU);

        //remove the find menu
        Menus.removeMenu(Menus.AppMenuBar.FIND_MENU);

        //remove the view menu
        Menus.removeMenu(Menus.AppMenuBar.VIEW_MENU);

        //remove the navigate menu
        Menus.removeMenu(Menus.AppMenuBar.NAVIGATE_MENU);

        //remove the help menu
        Menus.removeMenu(Menus.AppMenuBar.HELP_MENU);
    }

    /**
     * Used to remove the right side tool bar
     */
    function removeRightSideToolBar() {
        Resizer.makeResizable("#main-toolbar");
        Resizer.hide("#main-toolbar");
        $(".content").addClass("hideRightToolbar");
    }

    /**
     * Used to show the mobile view.
     */
    function showMobile() {
        $("#bramble-iframe-browser").addClass("phone-body");
        $("#second-pane").append(PhonePreview);
        $("#bramble-iframe-browser").appendTo("#phone-content");
        $("#second-pane").addClass("second-pane-scroll");
    }

    /**
     * Used to hide the mobile view.
     */
    function hideMobile() {
        $("#bramble-iframe-browser").appendTo("#second-pane");
        $(".phone-container").detach();
        $("#second-pane").removeClass("second-pane-scroll");
    }

    /**
     * Used to add a button to the status bar to toggle
     * between mobile view and desktop view.
     */
    function toggleMobileViewButton() {
        var isMobileViewOpen = false;

        var mobileView = Mustache.render("<div><a id='mobileViewButton' href=#></a></div>", Strings);
        StatusBar.addIndicator("mobileViewButtonBox", $(mobileView), true, "",
                               "Click to open preview in a mobile view", "status-overwrite");
        $("#mobileViewButton").addClass("mobileButton");

        $("#mobileViewButton").click(function () {
            PostMessageTransport.reload();

            if(!isMobileViewOpen) {
                // Switch the icon
                $("#mobileViewButton").removeClass("mobileButton");
                $("#mobileViewButton").addClass("desktopButton");
                // Updates the tooltip
                StatusBar.updateIndicator("mobileViewButtonBox", true, "",
                                          "Click to open preview in a desktop view");

                showMobile();

                isMobileViewOpen = true;
                // Give focus back to the editor when the outside of the mobile phone is clicked.
                // Prevents the status bar from disappearing.
                $("#second-pane").click(function() {
                    MainViewManager.setActivePaneId("first-pane");
                });
            }
            else {
                // Switch the icon
                $("#mobileViewButton").removeClass("desktopButton");
                $("#mobileViewButton").addClass("mobileButton");
                // Updates the tooltip
                StatusBar.updateIndicator("mobileViewButtonBox", true, "",
                                          "Click to open preview in a mobile view");

                hideMobile();

                isMobileViewOpen = false;
            }
        });
    }

    /**
     * Used to add a button to the status bar for the
     * detached live preview.
     * For IE 11, we show the detach button, but only changes
     * to code that trigger a reload will show up in the detached
     * window.
     * For IE <11, we do not show the detach button
     */
    function addLivePreviewButton(callback) {
        var livePreview = Mustache.render("<div><a id='liveDevButton' href=#></a></div>", Strings);
        StatusBar.addIndicator("liveDevButtonBox", $(livePreview), true, "",
                               "Click to open preview in separate window", "mobileViewButtonBox");
        $("#liveDevButton").addClass("liveDevButtonDetach");

        $("#liveDevButton").click(function () {
            Resizer.makeResizable("#second-pane");

            // Checks if the attached preview is visible.
            // If it is, the attached preview is hidden
            // and the detached preview is opened.
            if(Resizer.isVisible("#second-pane")) {
                IframeBrowser.detachPreview();
            }
            else {
                IframeBrowser.attachPreview();
            }
        });

        Compatibility.supportsIFrameHTMLBlobURL(function(err, isCompatible) {
            if(err) {
                console.error("[Brackets IFrame-Browser] Unexpected error:", err);
                return callback();
            }

            // If we are in IE v<11, we hide the detachable preview button
            if(!isCompatible && document.all) {
                $("#liveDevButton").css("display", "none");
                console.log("[Brackets IFrame-Browser] Detachable preview disabled due to incompatibility with current browser (you are possibly running IE 10 or below)");
            }

            callback();
        });
    }

    // Define public API
    exports.initUI                 = initUI;
    exports.removeLeftSideToolBar  = removeLeftSideToolBar;
    exports.removeMainToolBar      = removeMainToolBar;
    exports.removeRightSideToolBar = removeRightSideToolBar;
});

/* global $ */
define(function (require, exports, module) {
    "use strict";

    var EventDispatcher = require("utils/EventDispatcher");

    function triggerUpdateLayoutEvent(eventName) {
        // XXXBramble: when the main view's layout changes, trigger an event
        // that indicates the widths of the sidebar, first editor pane, and second
        // editor pane.
        eventName = "bramble:updateLayout" + eventName;

        var firstPane = $("#first-pane");
        var secondPane = $("#second-pane");
        var sidebar = $("#sidebar");

        exports.trigger(eventName, sidebar.is(":visible") ? sidebar.width() : 0,
                                   firstPane ? firstPane.width() : 0,
                                   secondPane ? secondPane.width() : 0);
    }

    EventDispatcher.makeEventDispatcher(exports);

    // bramble:updateLayoutStart event when layout begins to change
    exports.triggerUpdateLayoutStart = function() {       
        triggerUpdateLayoutEvent("Start");
    };

    // bramble:updateLayoutEnd event when layout finishes changing
    exports.triggerUpdateLayoutEnd = function() {        
        triggerUpdateLayoutEvent("End");
    };

    // bramble:previewModeChange event when we switch from desktop to mobile mode.
    // `mode` should be "desktop" or "mobile"
    exports.triggerPreviewModeChange = function(mode) {
        exports.trigger("bramble:previewModeChange", mode);
    };

    // bramble:themeChange event when the theme is switched
    exports.triggerThemeChange = function(theme) {
        exports.trigger("bramble:themeChange", theme);
    };

    // bramble:sidebarChange event when collapsed or expanded. Second arg is visible (true/false);
    exports.triggerSidebarCollapsed = function() {
        exports.trigger("bramble:sidebarChange", false);
    };
    exports.triggerSidebarExpanded = function() {
        exports.trigger("bramble:sidebarChange", true);
    };

    // file delete and rename needs to get broadcast to live dev transport
    exports.triggerFileRenamed = function(oldFilename, newFilename) {
        exports.trigger("fileRenamed", oldFilename, newFilename);
    };
    exports.triggerFileRemoved = function(filename) {
        exports.trigger("fileRemoved", filename);
    };

    // turning tutorial view on/off
    exports.triggerTutorialVisibilityChange = function(visible) {
        exports.trigger("bramble:tutorialVisibilityChange", visible);
    };

    // enabling/disabling the inspector
    exports.triggerInspectorChange = function(enabled) {
        exports.trigger("bramble:inspectorChange", enabled);
    };
});

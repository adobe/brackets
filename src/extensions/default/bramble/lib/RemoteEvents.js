/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, parent */

define(function (require, exports, module) {
    "use strict";

    var BrambleEvents = brackets.getModule("bramble/BrambleEvents");
    var MainViewManager = brackets.getModule("view/MainViewManager");
    var ViewCommandHandlers = brackets.getModule("view/ViewCommandHandlers");
    var Path = brackets.getModule("filesystem/impls/filer/FilerUtils").Path;
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager");
    var UI = require("lib/UI");
    var Theme = require("lib/Theme");

    function sendEvent(data) {
        parent.postMessage(JSON.stringify(data), "*");
    }

    // When the main view's layout changes, trigger an event that indicates
    // the widths of the sidebar, first editor pane, and second editor pane.
    // There is no clean way to do this with the Brackets API.
    function sendLayoutEvent() {
        var $firstPane = $("#first-pane");
        var $secondPane = $("#second-pane");
        var $sidebar = $("#sidebar");

        sendEvent({
            type: "bramble:layout",
            sidebarWidth: $sidebar.is(":visible") ? $sidebar.width() : 0,
            firstPaneWidth: $firstPane ? $firstPane.width() : 0,
            secondPaneWidth: $secondPane ? $secondPane.width() : 0
        });
    }

    function sendActiveEditorChangeEvent(file) {
        var fullPath = file.fullPath;
        var filename = Path.basename(fullPath);

        sendEvent({
            type: "bramble:activeEditorChange",
            fullPath: fullPath,
            filename: filename
        });
    }

    function start() {
        // Listen for layout changes. We currently consolidate start/end
        // events into one single "bramble:layout" event for the hosting app.
        BrambleEvents.on("bramble:updateLayoutStart", sendLayoutEvent);
        BrambleEvents.on("bramble:updateLayoutEnd", sendLayoutEvent);

        // Listen for a change to the preview mode
        BrambleEvents.on("bramble:previewModeChange", function(e, mode) {
            sendEvent({
                type: "bramble:previewModeChange",
                mode: mode
            });
        });

        // Listen for changes to the sidebar
        BrambleEvents.on("bramble:sidebarChange", function(e, visible) {
            sendEvent({
                type: "bramble:sidebarChange",
                visible: visible
            });
        });

        // Listen for the user changing what file is being viewed
        var lastKnownEditorFilePath;
        MainViewManager.on("currentFileChange", function(e, file) {
            if(!file) {
                return;
            }

            if(file.fullPath !== lastKnownEditorFilePath) {
                lastKnownEditorFilePath = file.fullPath;
                sendActiveEditorChangeEvent(file);
            }
        });

        // Listen for file rename
        BrambleEvents.on("fileRenamed", function(e, oldFilePath, newFilePath) {
            if (oldFilePath === lastKnownEditorFilePath) {
                lastKnownEditorFilePath = newFilePath;
                sendActiveEditorChangeEvent({ fullPath: newFilePath });
            }
        });

        // Listen for changes to the theme
        BrambleEvents.on("bramble:themeChange", function(e, theme) {
            sendEvent({
                type: "bramble:themeChange",
                theme: theme
            });
        });

        // Listen for changes to Tutorial visibility
        BrambleEvents.on("bramble:tutorialVisibilityChange", function(e, visible) {
            sendEvent({
                type: "bramble:tutorialVisibilityChange",
                visible: visible
            });
        });

        // Listen for changes to the inspector
        BrambleEvents.on("bramble:inspectorChange", function(e, enabled) {
            sendEvent({
                type: "bramble:inspectorChange",
                enabled: enabled
            });
        });

        // Listen for changes to the font size
        ViewCommandHandlers.on("fontSizeChange", function(e, fontSize) {
            sendEvent({
                type: "bramble:fontSizeChange",
                fontSize: fontSize
            });
        });

        // Listen for changes to word wrap
        PreferencesManager.on("change", "wordWrap", function () {
            sendEvent({
                type: "bramble:wordWrapChange",
                wordWrap: PreferencesManager.get("wordWrap")
            });
        });
        
        // Listen for changes to allow javascript
        PreferencesManager.on("change", "allowJavaScript", function () {
            sendEvent({
                type: "bramble:allowJavaScriptChange",
                allowJavaScript: PreferencesManager.get("allowJavaScript")
            });
        });
    }

    /**
     * Send initial state and a "ready" event
     */
    function loaded() {
        var initialFile = MainViewManager.getCurrentlyViewedFile();
        var fullPath = "";
        var filename = "";

        // avoid exception when the editor is not viewing any file
        if (initialFile) {
            fullPath = initialFile.fullPath;
            filename = Path.basename(fullPath);
        }

        var $firstPane = $("#first-pane");
        var $secondPane = $("#second-pane");
        var $sidebar = $("#sidebar");

        sendEvent({
            type: "bramble:loaded",
            sidebarVisible: $sidebar.is(":visible"),
            sidebarWidth: $sidebar.is(":visible") ? $sidebar.width() : 0,
            firstPaneWidth: $firstPane ? $firstPane.width() : 0,
            secondPaneWidth: $secondPane ? $secondPane.width() : 0,
            fullPath: fullPath,
            filename: filename,
            previewMode: UI.getPreviewMode(),
            fontSize: ViewCommandHandlers.getFontSize(),
            theme: Theme.getTheme(),
            wordWrap: PreferencesManager.get("wordWrap"),
            allowJavaScript: PreferencesManager.get("allowJavaScript")
        });
    }

    exports.start = start;
    exports.loaded = loaded;
});

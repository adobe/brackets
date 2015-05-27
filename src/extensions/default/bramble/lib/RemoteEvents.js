/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, parent */

define(function (require, exports, module) {
    "use strict";

    var BrambleEvents = brackets.getModule("bramble/BrambleEvents");
    var EditorManager = brackets.getModule("editor/EditorManager");
    var MainViewManager = brackets.getModule("view/MainViewManager");
    var Path = brackets.getModule("filesystem/impls/filer/FilerUtils").Path;
    var UI = require("lib/UI");

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
        // Signal to the hosting app that we're ready to mount a filesystem
        sendEvent({type: "bramble:readyToMount"});

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

        // Listen for the user changing the active editor
        var lastKnownEditorFilePath;
        EditorManager.on("activeEditorChange", function(e, currentEditor) {
            if (!currentEditor) {
                return;
            }

            var file = currentEditor.document.file;
            if(file.fullPath !== lastKnownEditorFilePath) {
                lastKnownEditorFilePath = file.fullPath;
                sendActiveEditorChangeEvent(file);
            }
        });
    }

    /**
     * Send initial state and a "ready" event
     */
    function loaded() {
        var initialFile = MainViewManager.getCurrentlyViewedFile();
        var fullPath = initialFile.fullPath;
        var filename = Path.basename(fullPath);

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
            previewMode: UI.getPreviewMode()
        });
    }

    exports.start = start;
    exports.loaded = loaded;
});

define(function (require, exports, module) {
    "use strict";

    var LiveDevelopment = brackets.getModule("LiveDevelopment/LiveDevMultiBrowser");
    var StartupState    = brackets.getModule("bramble/StartupState");
    var EditorManager   = brackets.getModule("editor/EditorManager");
    var BrambleEvents   = brackets.getModule("bramble/BrambleEvents");
    var Filer           = brackets.getModule("filesystem/impls/filer/BracketsFiler");
    var Path            = Filer.Path;

    var PostMessageTransport = require("lib/PostMessageTransport");

    // Whether or not we're overriding the preview with a tutorial
    var _tutorialOverride;

    // When we want to override, in order to get the tutorial to
    // show, we need to force a reload for the preview.
    var _forceReload;

    function setOverride(val) {
        _tutorialOverride = !!val;

        // We need to reload the browser preview. If we're going to override,
        // we can simply reload the current live dev instance.  If not, we
        // need to properly reset live dev so it points at the project's main file.
        if(_tutorialOverride) {
            _forceReload = true;
            PostMessageTransport.reload();
        } else {
            // If we're turning off the override, we need to open the project's
            // "main" web file, and the easiest way is to close/re-open live dev.
            LiveDevelopment.close().done(LiveDevelopment.open);
        }

        BrambleEvents.triggerTutorialVisibilityChange(_tutorialOverride);
    }

    function getOverride() {
        return _tutorialOverride;
    }

    function getPath() {
        return Path.join(StartupState.project("root"), "tutorial.html");
    }

    /**
     * Callback returns `true` or `false`, like fs.exists().
     */
    function exists(callback) {
        Filer.fs().stat(getPath(), function(err, stats) {
            callback(stats && stats.type === "FILE");
        });
    }

    /**
     * Whether or not the file currently in the editor is the tutorial file.
     */
    function _tutorialInEditor() {
        var editor = EditorManager.getCurrentFullEditor();
        if(!editor) {
            return false;
        }

        return getPath() === editor.document.file.fullPath;
    }

    /**
     * When the tutorial is hijacking the preview iframe, we only
     * need to reload when we're actually editing the tutorial.html file.
     */
    function shouldReload() {
        if(_forceReload) {
            _forceReload = false;
            return true;
        }

        return getOverride() && _tutorialInEditor();
    }

    /**
     * When the tutorial is hijacking the preview iframe, we don't
     * need to spam postMessage with DOM diffs and instrumentation calls.
     * We only want to do this if the actual tutorial.html file is open in the editor,
     * in which case one is likely editing it, and wants to see dynamic updates.
     */
    function shouldPostMessage() {
        return getOverride() && _tutorialInEditor();
    }

    exports.setOverride = setOverride;
    exports.getOverride = getOverride;
    exports.getPath = getPath;
    exports.exists = exists;
    exports.shouldReload = shouldReload;
    exports.shouldPostMessage = shouldPostMessage;
});

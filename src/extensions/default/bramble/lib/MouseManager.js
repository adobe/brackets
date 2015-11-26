/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true, bitwise: true */
define(function (require, exports, module) {
    "use strict";

    var BrambleEvents = brackets.getModule("bramble/BrambleEvents");
    var EditorManager = brackets.getModule("editor/EditorManager");
    var LiveDevMultiBrowser = brackets.getModule("LiveDevelopment/LiveDevMultiBrowser");
    var LiveDevProtocol = brackets.getModule("LiveDevelopment/MultiBrowserImpl/protocol/LiveDevProtocol");
    var CommandManager = brackets.getModule("command/CommandManager");
    var Commands = brackets.getModule("command/Commands");
    var FileSystem = brackets.getModule("filesystem/FileSystem");

    var MouseManagerRemote = require("text!lib/MouseManagerRemote.js");
    var IframeBrowser = require("lib/iframe-browser");

    var _isInspectorEnabled = false;
    var _prevLineMarker;
    var _prevElemHighlightId;

    // Override the preview document's cursor property
    function setIframeCursor(value) {
        var iframe;
        var doc;

        iframe = IframeBrowser.getBrowserIframe();
        if(!iframe) {
            return;
        }

        doc = iframe.contentDocument || iframe.contentWindow.document;
        if(!doc) {
            return;
        }

        doc.body.style.cursor = value;
    }

    // Depending on the state of the inspector, apply the appropriate cursor
    function ensurePreviewCursor() {
        if(_isInspectorEnabled) {
            setIframeCursor("pointer");
        } else {
            setIframeCursor("auto");
        }
    }

    // Make sure the editor is showing the current LiveDoc HTML for inspector
    function ensureLiveDoc() {
        // Preview path
        var currentDoc = LiveDevMultiBrowser._getCurrentLiveDoc();
        var liveDocPath = currentDoc.doc.file.fullPath;
        // Editor path
        var currentEditor = EditorManager.getActiveEditor();
        var editorPath = currentEditor.document.file.fullPath;

        // If they already match, nothing to do
        if(liveDocPath === editorPath) {
            return;
        }

        // Otherwise, switch editor to LiveDoc's HTML file
        FileSystem.resolve(liveDocPath, function(err, file) {
            if(err) {
                console.log("[Bramble Error] unable to open path in editor", liveDocPath, err);
                return;
            }
            CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: file.fullPath });
        });
    }

    function getCodeMirror() {
        var editor = EditorManager.getActiveEditor();
        return editor._codeMirror;
    }

    // Clear text marks in the editor, including ones we've added with inspector
    function clearMarks() {
        var codeMirror = getCodeMirror();

        // Clear any text we've marked
        clearLineHighlight();

        // Get rid of multiple selections in the editor
        var doc = codeMirror.getDoc();
        var pos = doc.getCursor("start");
        codeMirror.setCursor(pos);
    }

    // When the user re-focuses the editor, clear any marks we've set with inspector
    function clearMarksOnFocus() {
        var codeMirror = getCodeMirror();

        function onFocus() {
            var codeMirror = getCodeMirror();
            codeMirror.off("focus", onFocus);
            clearMarks();
        }

        codeMirror.on("focus", onFocus);
    }

    function enableInspector() {
        _isInspectorEnabled = true;
        // Make sure the proper HTML file is in the editor
        ensureLiveDoc();
        // Deal with selection logic in editor and preview (reset it)
        clearMarksOnFocus();
        clearMarks();
        clearElemHighlight();
        // Set the preview mouse cursor to a pointer
        setIframeCursor("pointer");
        // Let clients know we've enabled the inspector
        BrambleEvents.triggerInspectorChange(true);
    }

    function disableInspector(clear) {
        _isInspectorEnabled = false;
        // reset the preview mouse cursor
        setIframeCursor("auto");
        // Depending on how this is called (user request vs. our logic)
        // clear any highlights in the preview/editor.
        if(clear) {
            clearElemHighlight();
            clearMarks();
        } else {
            // Reset last highlighted element
            _prevElemHighlightId = null;
        }
        BrambleEvents.triggerInspectorChange(false);
    }

    function highlightElem(id) {
        // If we just highlighted this element, don't bother doing again.
        // Useful when user slowly moves their mouse over an element, re-triggering.
        if(id === _prevElemHighlightId) {
            return;
        }
        _prevElemHighlightId = id;

        var selector = "[data-brackets-id='" + id + "']";
        var script = "_LD.highlightRule(" + JSON.stringify(selector) + ")";
        LiveDevProtocol.evaluate(script);
    }

    function clearElemHighlight() {
        _prevElemHighlightId = null;
        LiveDevProtocol.evaluate("_LD.hideHighlight()");
    }

    function getHighlightInfo(msg) {
        var match = msg.match(/^bramble-highlight-lines\:([0-9]+),([0-9]+),([0-9]+),([0-9]+),?([0-9]+)?/);
        if(!(match && match[1] && match[2] && match[3] && match[4])) {
            return;
        }

        return {
            startLine:  match[1]|0,
            startCh:    match[2]|0,
            endLine:    match[3]|0,
            endCh:      match[4]|0,
            bracketsId: match[5]|0
        };
    }

    function isHighlightLineRequest(msg) {
        return !!getHighlightInfo(msg);
    }

    function isDisableRequest(msg) {
        return msg.match(/^bramble-inspector-disable$/);
    }

    function clearLineHighlight() {
        if(!_prevLineMarker) {
            return;
        }

        _prevLineMarker.clear();
        _prevLineMarker = null;
    }

    function highlightLine(msg) {
        if(!_isInspectorEnabled) {
            return;
        }

        var info = getHighlightInfo(msg);
        if(!info) {
            return;
        }

        var from = {
            line: info.startLine,
            ch: info.startCh
        };
        var to = {
            line: info.endLine,
            ch: info.endCh
        };

        clearLineHighlight();

        // If we have a brackets-id for this element, highlight it in the preview
        if(info.bracketsId) {
            highlightElem(info.bracketsId);
        }

        // Centre the code in the editor viewport
        var codeMirror = getCodeMirror();
        var halfViewPort = (codeMirror.getScrollInfo().clientHeight / 2)|0;
        codeMirror.scrollIntoView({from: from, to: to}, halfViewPort);
        _prevLineMarker = codeMirror.markText(from, to, { className: "bramble-inspector-highlight" });
    }

    function getRemoteScript(filename) {
        filename = filename || "unknown";

        // Track scroll position per filename, so you can be at different points in each doc
        return "<script>window.___brambleFilename = '" + filename + "';</script>\n" +
               "<script>\n" + MouseManagerRemote + "</script>\n";
    }

    exports.enableInspector = enableInspector;
    exports.disableInspector = disableInspector;
    exports.isDisableRequest = isDisableRequest;
    exports.getRemoteScript = getRemoteScript;
    exports.highlightLine = highlightLine;
    exports.isHighlightLineRequest = isHighlightLineRequest;
    exports.ensurePreviewCursor = ensurePreviewCursor;
});

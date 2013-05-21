/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, window, $, brackets */

/**
 * Manages panels surrounding the editor area.
 * 
 * Updates panel sizes when the window is resized. Maintains the max resizing limits for panels, based on
 * currently available window size. Persists & restores panel sizes across sessions.
 * 
 * Events:
 *    - editorAreaResize -- When editor-holder's size changes for any reason (including panel show/hide
 *              panel resize, or the window resize).
 *              The 2nd arg is the new editor-holder height.
 *              The 3rd arg is a refreshHint flag for internal EditorManager use.
 */
define(function (require, exports, module) {
    "use strict";
    
    var AppInit                 = require("utils/AppInit"),
        EditorManager           = require("editor/EditorManager"),
        Resizer                 = require("utils/Resizer");
    
    
    /** @type {jQueryObject} The ".content" vertical stack (editor + all header/footer panels) */
    var $windowContent;
    
    /** @type {jQueryObject} The "#editor-holder": has only one visible child, the current CodeMirror
        instance (or the no-editor placeholder) */
    var $editorHolder;
    
    
    /**
     * Calculates the available height for the full-size Editor (or the no-editor placeholder),
     * accounting for the current size of all visible panels, toolbar, & status bar.
     * @return {number}
     */
    function _calcEditorHeight() {
        var availableHt = $windowContent.height();
        
        $editorHolder.siblings().each(function (i, elem) {
            var $elem = $(elem);
            if ($elem.css("display") !== "none") {
                availableHt -= $elem.outerHeight();
            }
        });
        
        // Clip value to 0 (it could be negative if a panel wants more space than we have)
        return Math.max(availableHt, 0);
    }
    
    
    /**
     * Calculates a new size for editor-holder and dispatches a change event. Does not actually update
     * editor-holder's size (EditorManager does that in response to our event).
     * 
     * @param {string=} refreshHint  One of "skip", "force", or undefined. See EditorManager docs.
     */
    function triggerEditorResize(refreshHint) {
        var editorAreaHeight = _calcEditorHeight();
        
        // TODO: update panel max heights
        
        $(exports).trigger("editorAreaResize", [editorAreaHeight, refreshHint]);
    }
    
    
    /** Trigger editor area resize whenever the window is resized */
    function handleWindowResize() {
        // Immediately adjust editor's height, but skip the refresh since CodeMirror will call refresh()
        // itself when it sees the window resize event
        triggerEditorResize("skip");
    }
    
    /** Trigger editor area resize whenever the given panel is shown/hidden/resized */
    function listenToResize($panel) {
        $panel.on("panelCollapsed panelExpanded panelResizeUpdate", function () {
            triggerEditorResize();
        });

        $panel.on("panelExpanded", function () {
            var _currentEditor = EditorManager.getCurrentFullEditor();

            // Make sure that we're not switching files
            // and still on an active editor
            if (_currentEditor) {

                // Gather info to determine whether to scroll after editor resizes
                var scrollInfo = _currentEditor._codeMirror.getScrollInfo(),
                    currScroll = scrollInfo.top,
                    height     = scrollInfo.clientHeight,
                    textHeight = _currentEditor.getTextHeight(),
                    cursorTop  = _currentEditor._codeMirror.cursorCoords().top,
                    allHeight  = 0;

                var bottom = cursorTop - $("#editor-holder").offset().top + textHeight - height;

                // Determine whether panel would block text at cursor
                // If so, scroll the editor to expose the cursor above
                // the panel
                if (bottom <= $panel.height() && bottom >= 5) {
                    _currentEditor._codeMirror.scrollIntoView();
                }
            }
        });
    }
    
    
    /**
     * Represents a panel below the editor area (a child of ".content").
     * 
     * @param {!jQueryObject} $panel  The entire panel, including any chrome, already in the DOM.
     * @param {number=} minSize  Minimum height of panel in px; default is 0
     */
    function Panel($panel, minSize) {
        this.$panel = $panel;
        
        Resizer.makeResizable($panel[0], Resizer.DIRECTION_VERTICAL, Resizer.POSITION_TOP, minSize, false, undefined, true);
        listenToResize($panel);
    }
    
    /** @type {jQueryObject} */
    Panel.prototype.$panel = null;
    
    Panel.prototype.isVisible = function () {
        return this.$panel.is(":visible");
    };
    
    Panel.prototype.show = function () {
        Resizer.show(this.$panel[0]);
    };
    Panel.prototype.hide = function () {
        Resizer.hide(this.$panel[0]);
    };
    
    Panel.prototype.setVisible = function (visible) {
        if (visible) {
            Resizer.show(this.$panel[0]);
        } else {
            Resizer.hide(this.$panel[0]);
        }
    };
    
    
    /**
     * Creates a new panel beneath the editor area and above the status bar footer. Panel is initially invisible.
     * 
     * @param {!string} id  Unique id for this panel. Use package-style naming, e.g. "myextension.feature.panelname"
     * @param {!jQueryObject} $panel  DOM content to use as the panel. Need not be in the document yet.
     * @param {number=} minSize  Minimum height of panel in px; default is 0
     * @return {!Panel}
     */
    function createBottomPanel(id, $panel, minSize) {   // TODO: allow retrieval by id...
        $panel.insertBefore("#status-bar");
        $panel.hide();
        return new Panel($panel, minSize);
    }
    
    
    /**
     * Force PanelManager to recalculate the editor-holder size and trigger an event, in cases that our normal panel
     * and window listeners wouldn't detect.
     * 
     * For internal use only: most code should call EditorManager.resizeEditor() for this purpose.
     */
    function _notifyLayoutChange(refreshHint) {
        triggerEditorResize(refreshHint);
    }
    
    
    // Attach to key parts of the overall UI, once created
    AppInit.htmlReady(function () {
        $windowContent = $(".content");
        $editorHolder = $("#editor-holder");
        
        // Sidebar is a special case: a side panel rather than a bottom panel. It could still affect the
        // editor-holder's height if changing .content's width causes the inBrowser titlebar to wrap/unwrap.
        if (brackets.inBrowser) {
            listenToResize($("#sidebar"));
        }
    });
    
    // If someone adds a panel in the .content stack the old way, make sure we still listen for resize/show/hide
    // (Resizer emits a deprecation warning for us - no need to log anything here)
    $(Resizer).on("deprecatedPanelAdded", function (event, $panel) {
        listenToResize($panel);
    });
    
    // Add this as a capture handler so we're guaranteed to run it before the editor does its own
    // refresh on resize.
    window.addEventListener("resize", handleWindowResize, true);
    
    
    // Define public API
    exports.createBottomPanel    = createBottomPanel;
    exports._notifyLayoutChange  = _notifyLayoutChange;
});

/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
/*global define, window, $ */

/**
* Manages layout of panels surrounding the editor area, and size of the editor area (but not its contents).
 * 
 * Updates panel sizes when the window is resized. Maintains the max resizing limits for panels, based on
 * currently available window size.
 * 
 * Events:
 * `workspaceUpdateLayout` When workspace size changes for any reason (including panel show/hide panel resize, or the window resize).
 *              The 2nd arg is the available workspace height.
 *              The 3rd arg is a refreshHint flag for internal use (passed in to recomputeLayout)
 */
define(function (require, exports, module) {
    "use strict";
    
    var AppInit                 = require("utils/AppInit"),
        EventDispatcher         = require("utils/EventDispatcher"),
        Resizer                 = require("utils/Resizer");
    
    //constants
    var EVENT_WORKSPACE_UPDATE_LAYOUT  = "workspaceUpdateLayout",
        EVENT_WORKSPACE_PANEL_SHOWN    = "workspacePanelShown",
        EVENT_WORKSPACE_PANEL_HIDDEN   = "workspacePanelHidden";
    
    /** 
     * The ".content" vertical stack (editor + all header/footer panels) 
     * @type {jQueryObject} 
     */
    var $windowContent;

    /** 
     * The "#editor-holder": has only one visible child, the current CodeMirror instance (or the no-editor placeholder) 
     * @type {jQueryObject} 
     */
    var $editorHolder;
    
    /** 
     * A map from panel ID's to all reated panels
     */
    var panelIDMap = {};

    /**
     * Have we already started listening for the end of the ongoing window resize? 
     * @type {boolean} 
     */
    var windowResizing = false;
    

    /**
     * Calculates the available height for the full-size Editor (or the no-editor placeholder),
     * accounting for the current size of all visible panels, toolbar, & status bar.
     * @return {number}
     */
    function calcAvailableHeight() {
        var availableHt = $windowContent.height();
        
        $editorHolder.siblings().each(function (i, elem) {
            var $elem = $(elem);
            if ($elem.css("display") !== "none" && $elem.css("position") !== "absolute") {
                availableHt -= $elem.outerHeight();
            }
        });
        
        // Clip value to 0 (it could be negative if a panel wants more space than we have)
        return Math.max(availableHt, 0);
    }
    
    /** Updates panel resize limits to disallow making panels big enough to shrink editor area below 0 */
    function updateResizeLimits() {
        var editorAreaHeight = $editorHolder.height();
        
        $editorHolder.siblings().each(function (i, elem) {
            var $elem = $(elem);
            if ($elem.css("display") === "none") {
                $elem.data("maxsize", editorAreaHeight);
            } else {
                $elem.data("maxsize", editorAreaHeight + $elem.outerHeight());
            }
        });
    }
    
    
    /**
     * Calculates a new size for editor-holder and resizes it accordingly, then and dispatches the "workspaceUpdateLayout"
     * event. (The editors within are resized by EditorManager, in response to that event).
     * 
     * @param {boolean=} refreshHint  true to force a complete refresh
     */
    function triggerUpdateLayout(refreshHint) {
        // Find how much space is left for the editor
        var editorAreaHeight = calcAvailableHeight();
        
        $editorHolder.height(editorAreaHeight);  // affects size of "not-editor" placeholder as well
        
        // Resize editor to fill the space
        exports.trigger(EVENT_WORKSPACE_UPDATE_LAYOUT, editorAreaHeight, refreshHint);
    }
    
    
    /** Trigger editor area resize whenever the window is resized */
    function handleWindowResize() {
        // These are not initialized in Jasmine Spec Runner window until a test
        // is run that creates a mock document.
        if (!$windowContent || !$editorHolder) {
            return;
        }
        
        // FIXME (issue #4564) Workaround https://github.com/codemirror/CodeMirror/issues/1787
        triggerUpdateLayout();
        
        if (!windowResizing) {
            windowResizing = true;
            
            // We don't need any fancy debouncing here - we just need to react before the user can start
            // resizing any panels at the new window size. So just listen for first mousemove once the
            // window resize releases mouse capture.
            $(window.document).one("mousemove", function () {
                windowResizing = false;
                updateResizeLimits();
            });
        }
    }
    
    /** Trigger editor area resize whenever the given panel is shown/hidden/resized 
     *  @param {!jQueryObject} $panel the jquery object in which to attach event handlers 
     */
    function listenToResize($panel) {
        // Update editor height when shown/hidden, & continuously as panel is resized
        $panel.on("panelCollapsed panelExpanded panelResizeUpdate", function () {
            triggerUpdateLayout();
        });
        // Update max size of sibling panels when shown/hidden, & at *end* of resize gesture
        $panel.on("panelCollapsed panelExpanded panelResizeEnd", function () {
            updateResizeLimits();
        });
    }
    
    
    /**
     * Represents a panel below the editor area (a child of ".content").
     * @constructor
     * @param {!jQueryObject} $panel  The entire panel, including any chrome, already in the DOM.
     * @param {number=} minSize  Minimum height of panel in px.
     */
    function Panel($panel, minSize) {
        this.$panel = $panel;
        
        Resizer.makeResizable($panel[0], Resizer.DIRECTION_VERTICAL, Resizer.POSITION_TOP, minSize, false, undefined, true);
        listenToResize($panel);
    }
    
    /** 
     * Dom node holding the rendered panel 
     * @type {jQueryObject} 
     */
    Panel.prototype.$panel = null;
    
    /** 
     * Determines if the panel is visible
     * @return {boolean} true if visible, false if not
     */
    Panel.prototype.isVisible = function () {
        return this.$panel.is(":visible");
    };
    
    /** 
     * Shows the panel
     */
    Panel.prototype.show = function () {
        Resizer.show(this.$panel[0]);
        exports.trigger(EVENT_WORKSPACE_PANEL_SHOWN, this.panelID);
    };

    /** 
     * Hides the panel
     */
    Panel.prototype.hide = function () {
        Resizer.hide(this.$panel[0]);
        exports.trigger(EVENT_WORKSPACE_PANEL_HIDDEN, this.panelID);
    };
    
    /** 
     * Sets the panel's visibility state
     * @param {boolean} visible true to show, false to hide
     */
    Panel.prototype.setVisible = function (visible) {
        if (visible) {
            this.show();
        } else {
            this.hide();
        }
    };
    
    
    /**
     * Creates a new resizable panel beneath the editor area and above the status bar footer. Panel is initially invisible.
     * The panel's size & visibility are automatically saved & restored as a view-state preference.
     * 
     * @param {!string} id  Unique id for this panel. Use package-style naming, e.g. "myextension.feature.panelname"
     * @param {!jQueryObject} $panel  DOM content to use as the panel. Need not be in the document yet. Must have an id
     *      attribute, for use as a preferences key.
     * @param {number=} minSize  Minimum height of panel in px.
     * @return {!Panel}
     */
    function createBottomPanel(id, $panel, minSize) {
        $panel.insertBefore("#status-bar");
        $panel.hide();
        updateResizeLimits();  // initialize panel's max size
        
        panelIDMap[id] = new Panel($panel, minSize);
        panelIDMap[id].panelID = id;

        return panelIDMap[id];
    }
    
    /**
     * Returns an array of all panel ID's
     * @returns {Array} List of ID's of all bottom panels
     */
    function getAllPanelIDs() {
        var property, panelIDs = [];
        for (property in panelIDMap) {
            if (panelIDMap.hasOwnProperty(property)) {
                panelIDs.push(property);
            }
        }
        return panelIDs;
    }

    /**
     * Gets the Panel interface for the given ID. Can return undefined if no panel with the ID is found.
     * @param   {string} panelID
     * @returns {Object} Panel object for the ID or undefined
     */
    function getPanelForID(panelID) {
        return panelIDMap[panelID];
    }
    
    /**
     * Called when an external widget has appeared and needs some of the space occupied 
     *  by the mainview manager
     * @param {boolean} refreshHint true to refresh the editor, false if not
     */
    function recomputeLayout(refreshHint) {
        triggerUpdateLayout(refreshHint);
        updateResizeLimits();
    }
    
    
    /* Attach to key parts of the overall UI, once created */
    AppInit.htmlReady(function () {
        $windowContent = $(".content");
        $editorHolder = $("#editor-holder");
        
        // Sidebar is a special case: it isn't a Panel, and is not created dynamically. Need to explicitly
        // listen for resize here.
        listenToResize($("#sidebar"));
    });
    
    /* Unit test only: allow passing in mock DOM notes, e.g. for use with SpecRunnerUtils.createMockEditor() */
    function _setMockDOM($mockWindowContent, $mockEditorHolder) {
        $windowContent = $mockWindowContent;
        $editorHolder = $mockEditorHolder;
    }
    
    /* Add this as a capture handler so we're guaranteed to run it before the editor does its own
     * refresh on resize.
     */
    window.addEventListener("resize", handleWindowResize, true);
    
    
    EventDispatcher.makeEventDispatcher(exports);
    
    // Define public API
    exports.createBottomPanel               = createBottomPanel;
    exports.recomputeLayout                 = recomputeLayout;
    exports.getAllPanelIDs                  = getAllPanelIDs;
    exports.getPanelForID                   = getPanelForID;
    exports._setMockDOM                     = _setMockDOM;
    exports.EVENT_WORKSPACE_UPDATE_LAYOUT   = EVENT_WORKSPACE_UPDATE_LAYOUT;
    exports.EVENT_WORKSPACE_PANEL_SHOWN     = EVENT_WORKSPACE_PANEL_SHOWN;
    exports.EVENT_WORKSPACE_PANEL_HIDDEN    = EVENT_WORKSPACE_PANEL_HIDDEN;
});

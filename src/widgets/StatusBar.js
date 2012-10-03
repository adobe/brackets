/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, document*/

/**
 * A status bar with support for file information and busy and status indicators.
 */
define(function (require, exports, module) {
    'use strict';
    
    var AppInit         = require("utils/AppInit"),
        Editor          = require("editor/Editor"),
        EditorManager   = require("editor/EditorManager"),
        ExtensionUtils  = require("utils/ExtensionUtils"),
        Strings         = require("strings"),
        StringUtils     = require("utils/StringUtils");
    
    // Current focused full editor
    var fullEditor;
    
    // Indicates if the busy cursor is active to avoid unnecesary operations
    var busyCursor = false;
    
    // A simple regexp to sanitize indicator ids
    var indicatorIDRegexp = new RegExp("[^a-zA-Z 0-9]+", "g");
    
    // These vars are initialized by the AppInit.htmlReady handler
    // below since they refer to DOM elements
    var $editorContainer,
        $statusBar,
        $modeInfo,
        $cursorInfo,
        $fileInfo,
        $tabInfo,
        $indicators,
        $busyIndicator;
    
    function _updateModeInfo() {
        $modeInfo.text(fullEditor.getModeForSelection());
    }
    
    function _updateFileInfo() {
        $fileInfo.text(StringUtils.format(Strings.STATUSBAR_LINE_COUNT, fullEditor.lineCount()));
    }
    
    function _updateTabCharInfo() {
        $tabInfo.text(StringUtils.format(Strings.STATUSBAR_TAB_SIZE, fullEditor._codeMirror.getOption("tabSize")));
    }
    
    function _updateCursorInfo() {
        var cursor      = fullEditor.getCursorPos(),
            cursorInfo  = StringUtils.format(Strings.STATUSBAR_CURSOR_POSITION, (cursor.line + 1), (cursor.ch + 1));
        
        $cursorInfo.text(cursorInfo);
    }
    
    /**
     * @private
     * Updates the focused full editor and cleans listeners
     * TODO Add support for inline editors
     */
    function _onFocusedEditorChange(evt) {
        
        if (fullEditor) {
            $(fullEditor).off("cursorActivity", _updateCursorInfo);
        }
        
        fullEditor  = EditorManager.getCurrentFullEditor();
        
        if (fullEditor === null) {
            
           // Check if the statusbar is visible to hide it
            if ($statusBar.is(":visible")) {
                $statusBar.hide();
                EditorManager.resizeEditor();
            }
            
        } else {
            
            // Check if the statusbar is not visible to show it
            if (!$statusBar.is(":visible")) {
                $statusBar.show();
                EditorManager.resizeEditor();
            }
            
            $(fullEditor).on('cursorActivity', _updateCursorInfo);
            _updateCursorInfo();
            _updateModeInfo();
            _updateFileInfo();
            _updateTabCharInfo();
        }
    }
    
    /**
     * Shows the 'busy' indicator
     * @param {boolean} updateCursor Sets the cursor to "wait"
     */
    function showBusyIndicator(updateCursor) {
        if (updateCursor) {
            busyCursor = true;
            $("*").addClass("busyCursor");
        }
        
        $busyIndicator.show();
    }
    
    /**
     * Hides the 'busy' indicator
     */
    function hideBusyIndicator() {
        // Check if we are using the busyCursor class to avoid
        // unnecesary calls to $('*').removeClass()
        if (busyCursor) {
            busyCursor = false;
            $("*").removeClass("busyCursor");
        }
        
        $busyIndicator.hide();
    }
    
    /**
     * Registers a new status indicator
     * @param {string} id Registration id of the indicator to be updated.
     * @param {DOMNode} indicator Optional DOMNode for the indicator
     * @param {boolean} visible Shows or hides the indicator over the statusbar.
     * @param {string} style Sets the attribute "class" of the indicator.
     * @param {string} tooltip Sets the attribute "title" of the indicator.
     * @param {string} command Optional command name to execute on the indicator click.
     * TODO Unused command parameter. Include command functionality for statusbar indicators.
     */
    function addIndicator(id, indicator, visible, style, tooltip, command) {
        
        indicator = indicator || document.createElement("span");
        tooltip = tooltip || "";
        style = style || "";
        id = id.replace(indicatorIDRegexp, "-") || "";
        
        var $indicator = $(indicator);
        
        $indicator.attr("id", id);
        $indicator.attr("title", tooltip);
        $indicator.addClass("indicator");
        $indicator.addClass("style");
            
        if (!visible) {
            $indicator.hide();
        }
        
        $indicators.prepend($indicator);
    }
    
    /**
     * Updates a status indicator
     * @param {string} id Registration id of the indicator to be updated.
     * @param {boolean} visible Shows or hides the indicator over the statusbar.
     * @param {string} style Sets the attribute "class" of the indicator.
     * @param {string} tooltip Sets the attribute "title" of the indicator.
     * @param {string} command Optional command name to execute on the indicator click.
     */
    function updateIndicator(id, visible, style, tooltip, command) {
        
        var $indicator = $("#" + id.replace(indicatorIDRegexp, "-"));
        
        if ($indicator) {
            
            if (visible) {
                $indicator.show();
            } else {
                $indicator.hide();
            }
            
            if (style) {
                $indicator.removeClass();
                $indicator.addClass(style);
            } else {
                $indicator.removeClass();
                $indicator.addClass("indicator");
            }
            
            if (tooltip) {
                $indicator.attr("title", tooltip);
            }
        }
    }
    
    /**
     * @private
     * Initialize the status bar and the focused editor status 
     */
    function _initStatusBar() {
        fullEditor = EditorManager.getCurrentFullEditor();
        $(fullEditor).on("cursorActivity", _updateCursorInfo);
        
        _updateCursorInfo();
        _updateModeInfo();
        _updateFileInfo();
        _updateTabCharInfo();
    }
    
    $(EditorManager).on("focusedEditorChange", _onFocusedEditorChange);
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        $editorContainer    = $("#editor-holder");
        $statusBar          = $("#status-bar");
        $modeInfo           = $("#status-mode");
        $cursorInfo         = $("#status-cursor");
        $fileInfo           = $("#status-file");
        $tabInfo            = $("#status-tab");
        $indicators         = $("#status-indicators");
        $busyIndicator      = $("#busy-indicator");
        
        $statusBar.hide();
        $busyIndicator.hide();
        _onFocusedEditorChange();
    });
    
    exports.showBusyIndicator = showBusyIndicator;
    exports.hideBusyIndicator = hideBusyIndicator;
    exports.addIndicator = addIndicator;
    exports.updateIndicator = updateIndicator;
});
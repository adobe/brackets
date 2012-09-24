/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, document, console */

/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    'use strict';
    
    var AppInit         = require("utils/AppInit"),
        Editor          = require("editor/Editor"),
        EditorManager   = require("editor/EditorManager"),
        ExtensionUtils  = require("utils/ExtensionUtils");
    
    //
    var $editorContainer,
        $statusBar,
        $modeInfo,
        $cursorInfo,
        $fileInfo,
        $tabInfo,
        $indicators,
        $busyIndicator;
    
    var busyCursor = false;
    
    var indicatorIDRegexp = new RegExp("[^a-zA-Z 0-9]+", "g");
    
    function _updateCursorInfo() {
        var fullEditor  = EditorManager.getCurrentFullEditor(),
            cursor      = fullEditor.getCursorPos(),
            cursorInfo  = "Line " + (cursor.line + 1) + ", " + "Column " + (cursor.ch + 1);
        
        $cursorInfo.text(cursorInfo);
    }
    
    function _updateModeInfo() {
        var fullEditor  = EditorManager.getCurrentFullEditor(),
            mode        = fullEditor.getModeForSelection();
        
        $modeInfo.text(mode);
    }
    
    function _updateFileInfo() {
        var fullEditor  = EditorManager.getCurrentFullEditor(),
            lineCount   = fullEditor.lineCount();
        
        $fileInfo.text(lineCount + " Lines");
    }
    
    function _updateTabCharInfo() {
        var fullEditor  = EditorManager.getCurrentFullEditor(),
            tabSize     = fullEditor._codeMirror.getOption("tabSize");
        
        $tabInfo.text("Tab Size: " + tabSize);
    }
    
    function _onFocusedEditorChange(evt) {
        
        var fullEditor  = EditorManager.getCurrentFullEditor();
        
        $(fullEditor).on('cursorActivity', _updateCursorInfo);
        _updateCursorInfo();
        _updateModeInfo();
        _updateFileInfo();
        _updateTabCharInfo();
    }
    
    /**
     * Shows the 'busy' notification
     * 
     */
    function showBusyIndicator(updateCursor) {
        if (updateCursor) {
            busyCursor = true;
            $("*").addClass("busyCursor");
        }
        
        $busyIndicator.show();
        //$busyIndicator.addClass("busyIndicator");
    }
    
    /**
     *
     *
     */
    function hideBusyIndicator() {
        // Check if we are using the busyCursor class to avoid
        // unnecesary calls to $('*').removeClass()
        if (busyCursor) {
            busyCursor = false;
            $("*").removeClass("busyCursor");
        }
        
        //$busyIndicator.removeClass("busyIndicator");
        $busyIndicator.hide();
    }
    
    /**
     *
     */
    function addIndicator(id, indicator, visible, style, tooltip, command) {
        
        console.log(id);
        console.log(indicator);
        console.log(visible);
        
        indicator = indicator || document.createElement("span");
        tooltip = tooltip || "";
        style = style || "";
        id = id.replace(indicatorIDRegexp, "-") || "";
        
        var $indicator = $(indicator);
        
        $indicator.attr("id", id);
        $indicator.attr("title", tooltip);
        $indicator.addClass("indicator");
        $indicator.addClass("style");
        $indicator.on('click', function () {
            console.log("add command");
            console.log(command);
        });
            
        if (!visible) {
            $indicator.hide();
        }
        
        $indicators.prepend($indicator);
    }
    
    /**
     *
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
            
            if (command) {
                $indicator.on('click', function () {
                    console.log("udpate command");
                    console.log(command);
                });
            }
        }
    }
    
    function _initStatusBar() {
        var fullEditor  = EditorManager.getCurrentFullEditor();
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
        $statusBar          = $("#statusbar");
        $modeInfo           = $("#status-mode");
        $cursorInfo         = $("#status-cursor");
        $fileInfo           = $("#status-file");
        $tabInfo            = $("#status-tab");
        $indicators         = $("#status-indicators");
        $busyIndicator      = $("#busy-indicator");
        
        $busyIndicator.hide();
        _initStatusBar();
    });
    
    exports.showBusyIndicator = showBusyIndicator;
    exports.hideBusyIndicator = hideBusyIndicator;
    exports.addIndicator = addIndicator;
    exports.updateIndicator = updateIndicator;
});
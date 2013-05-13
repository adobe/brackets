/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
 * The ViewCommandHandlers object dispatches the following event(s):
 *    - fontSizeChange -- Triggered when the font size is changed via the
 *          Increase Font Size, Decrease Font Size, or Restore Font Size commands.
 *          The 2nd arg to the listener is the amount of the change. The 3rd arg
 *          is a string containing the new font size after applying the change.
 *          The 4th arg is a string containing the new line height after applying
 *          the change.
 */

define(function (require, exports, module) {
    "use strict";
    
    var Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        KeyBindingManager       = require("command/KeyBindingManager"),
        Strings                 = require("strings"),
        ProjectManager          = require("project/ProjectManager"),
        EditorManager           = require("editor/EditorManager"),
        PreferencesManager      = require("preferences/PreferencesManager"),
        DocumentManager         = require("document/DocumentManager"),
        AppInit                 = require("utils/AppInit");
    
    /**
     * @const
     * @type {string}
     */
    var DYNAMIC_FONT_STYLE_ID = "codemirror-dynamic-fonts";

    /**
     * @const
     * @private
     * The smallest font size in pixels
     * @type {int}
     */
    var MIN_FONT_SIZE = 1;
    
    /**
     * @const
     * @private
     * The largest font size in pixels
     * @type {int}
     */
    var MAX_FONT_SIZE = 72;
    
    /**
     * @const
     * @private
     * The ratio of line-height to font-size when they use the same units
     * @type {float}
     */
    var LINE_HEIGHT = 1.3;
    
    /**
     * @private
     * @type {PreferenceStorage}
     */
    var _prefs = {};

    /**
     * @private
     * @type {PreferenceStorage}
     */
    var _defaultPrefs = { fontSizeAdjustment: 0 };

    /**
     * @private
     * @type {boolean}
     */
    var _fontSizePrefsLoaded = false;
    
    
    /**
     * @private
     * Removes the styles used to update the font size
     */
    function _removeDynamicFontSize() {
        $("#" + DYNAMIC_FONT_STYLE_ID).remove();
    }
    
    /**
     * @private
     * Sets the font size and restores the scroll position as best as possible.
     * TODO: Remove the viewportTop hack and direclty use scrollPos.y once #3115 is fixed.
     * @param {string} fontSizeStyle A string with the font size and the size unit
     * @param {string} lineHeightStyle A string with the line height and a the size unit
     */
    function _setSizeAndRestoreScroll(fontSizeStyle, lineHeightStyle) {
        var editor      = EditorManager.getCurrentFullEditor(),
            oldWidth    = editor._codeMirror.defaultCharWidth(),
            oldHeight   = editor.getTextHeight(),
            scrollPos   = editor.getScrollPos(),
            viewportTop = $(".CodeMirror-lines", editor.getRootElement()).parent().position().top,
            scrollTop   = scrollPos.y - viewportTop;
        
        // It's necessary to inject a new rule to address all editors.
        _removeDynamicFontSize();
        var style = $("<style type='text/css'></style>").attr("id", DYNAMIC_FONT_STYLE_ID);
        style.html(".CodeMirror {" +
                   "font-size: "   + fontSizeStyle   + " !important;" +
                   "line-height: " + lineHeightStyle + " !important;}");
        $("head").append(style);
        
        editor.refreshAll();
        
        // Calculate the new scroll based on the old font sizes and scroll position
        var newWidth    = editor._codeMirror.defaultCharWidth(),
            newHeight   = editor.getTextHeight(),
            deltaX      = scrollPos.x / oldWidth,
            deltaY      = scrollTop / oldHeight,
            scrollPosX  = scrollPos.x + Math.round(deltaX * (newWidth - oldWidth)),
            scrollPosY  = scrollPos.y + Math.round(deltaY * (newHeight - oldHeight));
        
        // Scroll the document back to its original position, but not on the first load since the position
        // was saved with the new height and already been restored.
        if (_fontSizePrefsLoaded) {
            editor.setScrollPos(scrollPosX, scrollPosY);
        }
    }
    
    /**
     * @private
     * Increases or decreases the editor's font size.
     * @param {number} adjustment Negative number to make the font smaller; positive number to make it bigger
     * @return {boolean} true if adjustment occurred, false if it did not occur 
     */
    function _adjustFontSize(adjustment) {
        var fsStyle = $(".CodeMirror").css("font-size");
        var lhStyle = $(".CodeMirror").css("line-height");

        var validFont = /^[\d\.]+(px|em)$/;
        
        // Make sure the font size and line height are expressed in terms
        // we can handle (px or em). If not, simply bail.
        if (fsStyle.search(validFont) === -1 || lhStyle.search(validFont) === -1) {
            return false;
        }
        
        // Guaranteed to work by the validation above.
        var fsUnits = fsStyle.substring(fsStyle.length - 2, fsStyle.length);
        var lhUnits = lhStyle.substring(lhStyle.length - 2, lhStyle.length);
        var delta   = (fsUnits === "px") ? 1 : 0.1;
        
        var fsOld   = parseFloat(fsStyle.substring(0, fsStyle.length - 2));
        var lhOld   = parseFloat(lhStyle.substring(0, lhStyle.length - 2));
        
        var fsNew   = fsOld + (delta * adjustment);
        var lhNew   = (fsUnits === lhUnits) ? fsNew * LINE_HEIGHT : lhOld;
        
        var fsStr   = fsNew + fsUnits;
        var lhStr   = lhNew + lhUnits;

        // Don't let the font size get too small or too large. The minimum font size is 1px or 0.1em
        // and the maximum font size is 72px or 7.2em depending on the unit used
        if (fsNew < MIN_FONT_SIZE * delta || fsNew > MAX_FONT_SIZE * delta) {
            return false;
        }
        
        _setSizeAndRestoreScroll(fsStr, lhStr);
        
        $(exports).triggerHandler("fontSizeChange", [adjustment, fsStr, lhStr]);
        return true;
    }
    
    /** Increases the font size by 1 */
    function _handleIncreaseFontSize() {
        if (_adjustFontSize(1)) {
            _prefs.setValue("fontSizeAdjustment", _prefs.getValue("fontSizeAdjustment") + 1);
        }
    }
    
    /** Decreases the font size by 1 */
    function _handleDecreaseFontSize() {
        if (_adjustFontSize(-1)) {
            _prefs.setValue("fontSizeAdjustment", _prefs.getValue("fontSizeAdjustment") - 1);
        }
    }
    
    /** Restores the font size to the original size */
    function _handleRestoreFontSize() {
        _adjustFontSize(-_prefs.getValue("fontSizeAdjustment"));
        _prefs.setValue("fontSizeAdjustment", 0);
    }
    
    
    /**
     * @private
     * Updates the user interface appropriately based on whether or not a document is
     * currently open in the editor.
     */
    function _updateUI() {
        if (DocumentManager.getCurrentDocument() !== null) {
            if (!CommandManager.get(Commands.VIEW_INCREASE_FONT_SIZE).getEnabled()) {
                // If one is disabled then they all are disabled, so enable them all
                CommandManager.get(Commands.VIEW_INCREASE_FONT_SIZE).setEnabled(true);
                CommandManager.get(Commands.VIEW_DECREASE_FONT_SIZE).setEnabled(true);
                CommandManager.get(Commands.VIEW_RESTORE_FONT_SIZE).setEnabled(true);
            }
            
            // Font Size preferences only need to be loaded one time
            if (!_fontSizePrefsLoaded) {
                _removeDynamicFontSize();
                _adjustFontSize(_prefs.getValue("fontSizeAdjustment"));
                _fontSizePrefsLoaded = true;
            }
            
        } else {
            // No current document so disable all of the Font Size commands
            CommandManager.get(Commands.VIEW_INCREASE_FONT_SIZE).setEnabled(false);
            CommandManager.get(Commands.VIEW_DECREASE_FONT_SIZE).setEnabled(false);
            CommandManager.get(Commands.VIEW_RESTORE_FONT_SIZE).setEnabled(false);
        }
    }
    
    
    
    /**
     * @private
     * Calculates the first and last visible lines of the focused editor
     * @param {number} textHeight
     * @param {number} scrollTop
     * @param {number} editorHeight
     * @param {number} viewportFrom
     * @return {{first: number, last: number}}
     */
    function _getLinesInView(textHeight, scrollTop, editorHeight, viewportFrom) {
        var scrolledTop    = scrollTop / textHeight,
            scrolledBottom = (scrollTop + editorHeight) / textHeight;
        
        // Subtract a line from both for zero-based index. Also adjust last line
        // to round inward to show a whole lines.
        var firstLine      = Math.ceil(scrolledTop) - 1,
            lastLine       = Math.floor(scrolledBottom) - 2;
        
        return { first: viewportFrom + firstLine, last: viewportFrom + lastLine };
    }
    
    /**
     * @private
     * Scroll the viewport one line up or down.
     * @param {number} direction -1 to scroll one line up; 1 to scroll one line down.
     */
    function _scrollLine(direction) {
        var editor        = EditorManager.getCurrentFullEditor(),
            textHeight    = editor.getTextHeight(),
            cursorPos     = editor.getCursorPos(),
            hasSelecction = editor.hasSelection(),
            inlineEditors = editor.getInlineWidgets(),
            scrollInfo    = editor._codeMirror.getScrollInfo(),
            viewportFrom  = editor._codeMirror.getViewport().from,
            paddingTop    = editor._getLineSpaceElement().offsetTop,
            viewportTop   = $(".CodeMirror-lines", editor.getRootElement()).parent().position().top,
            editorHeight  = scrollInfo.clientHeight;
        
        // To make it snap better to lines and dont cover the cursor when the scroll is lower than the top padding,
        // we make it start direclty from the top padding
        var scrolledTop   = scrollInfo.top < paddingTop && direction > 0 ? paddingTop : scrollInfo.top;
        
        // CodeMirror has a strange behaviour when it comes to calculate the height of the not rendered lines,
        // so instead, we calculate the amount of hidden rendered lines at top and add it to the first rendered line.
        var scrollTop     = scrolledTop - viewportTop,
            linesInView   = _getLinesInView(textHeight, scrollTop, editorHeight, viewportFrom);
        
        // Go through all the editors and reduce the scroll top and editor height to recalculate the lines in view 
        var line, total;
        inlineEditors.forEach(function (inlineEditor) {
            line  = editor._getInlineWidgetLineNumber(inlineEditor);
            total = inlineEditor.info.height / textHeight;
            
            if (line >= viewportFrom) {
                if (line < linesInView.first) {
                    scrollTop   -= inlineEditor.info.height;
                    linesInView  = _getLinesInView(textHeight, scrollTop, editorHeight, viewportFrom);
                
                } else if (line + total < linesInView.last) {
                    editorHeight -= inlineEditor.info.height;
                    linesInView   = _getLinesInView(textHeight, scrollTop, editorHeight, viewportFrom);
                }
            }
        });
        
        // If there is no selection move the cursor so that is always visible.
        if (!hasSelecction) {
            // Move the cursor to the first visible line.
            if (cursorPos.line < linesInView.first) {
                editor.setCursorPos({line: linesInView.first + direction, ch: cursorPos.ch});
            
            // Move the cursor to the last visible line.
            } else if (cursorPos.line > linesInView.last) {
                editor.setCursorPos({line: linesInView.last + direction, ch: cursorPos.ch});
            
            // Move the cursor up or down using moveV to keep the goal column intact, since setCursorPos deletes it.
            } else if ((direction > 0 && cursorPos.line === linesInView.first) ||
                    (direction < 0 && cursorPos.line === linesInView.last)) {
                editor._codeMirror.moveV(direction, "line");
            }
        }
        
        // If there are inline editors just add/remove 1 line to the scroll top.
        if (inlineEditors.length) {
            editor.setScrollPos(scrollInfo.left, scrolledTop + (textHeight * direction));
        
        // If there arent, we can make it snap to the line.
        } else {
            var lines = linesInView.first - viewportFrom + direction + 1;
            editor.setScrollPos(scrollInfo.left, viewportTop + (textHeight * lines));
        }
    }
    
    /** Scrolls one line up */
    function _handleScrollLineUp() {
        _scrollLine(-1);
    }
    
    /** Scrolls one line down */
    function _handleScrollLineDown() {
        _scrollLine(1);
    }
    
    
    // Register command handlers
    CommandManager.register(Strings.CMD_INCREASE_FONT_SIZE, Commands.VIEW_INCREASE_FONT_SIZE, _handleIncreaseFontSize);
    CommandManager.register(Strings.CMD_DECREASE_FONT_SIZE, Commands.VIEW_DECREASE_FONT_SIZE, _handleDecreaseFontSize);
    CommandManager.register(Strings.CMD_RESTORE_FONT_SIZE,  Commands.VIEW_RESTORE_FONT_SIZE,  _handleRestoreFontSize);
    CommandManager.register(Strings.CMD_SCROLL_LINE_UP,     Commands.VIEW_SCROLL_LINE_UP,     _handleScrollLineUp);
    CommandManager.register(Strings.CMD_SCROLL_LINE_DOWN,   Commands.VIEW_SCROLL_LINE_DOWN,   _handleScrollLineDown);

    // There are no menu items, so bind commands directly
    KeyBindingManager.addBinding(Commands.VIEW_SCROLL_LINE_UP);
    KeyBindingManager.addBinding(Commands.VIEW_SCROLL_LINE_DOWN);

    // Initialize the PreferenceStorage
    _prefs = PreferencesManager.getPreferenceStorage(module, _defaultPrefs);

    // Update UI when opening or closing a document
    $(DocumentManager).on("currentDocumentChange", _updateUI);

    // Update UI when Brackets finishes loading
    AppInit.appReady(_updateUI);
});

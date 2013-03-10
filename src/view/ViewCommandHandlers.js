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

define(function (require, exports, module) {
    "use strict";
    
    var Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
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
     * Unique PreferencesManager clientID
     * @type {string}
     */
    var PREFERENCES_CLIENT_ID = "com.adobe.brackets." + module.id;
    
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

    function _removeDynamicFontSize(refresh) {
        $("#" + DYNAMIC_FONT_STYLE_ID).remove();
        if (refresh) {
            EditorManager.getCurrentFullEditor().refreshAll();
        }
    }
    
    /**
     * @private
     * Increases or decreases the editor's font size.
     * @param {number} negative number to make the font smaller; positive number to make it bigger.
     * @return {boolean} true if adjustment occurred, false if it did not occur 
     */
    function _adjustFontSize(adjustment) {
        var styleId = "codemirror-dynamic-fonts";

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

        var fsOld = parseFloat(fsStyle.substring(0, fsStyle.length - 2));
        var lhOld = parseFloat(lhStyle.substring(0, lhStyle.length - 2));

        var fsDelta = (fsUnits === "px") ? adjustment : (0.1 * adjustment);
        var lhDelta = (lhUnits === "px") ? adjustment : (0.1 * adjustment);

        var fsNew = fsOld + fsDelta;
        var lhNew = lhOld + lhDelta;
        
        var fsStr = fsNew + fsUnits;
        var lhStr = lhNew + lhUnits;

        // Don't let the font size get too small.
        if ((fsUnits === "px" && fsNew < MIN_FONT_SIZE) ||
                (fsUnits === "em" && fsNew < (MIN_FONT_SIZE * 0.1))) {
            return false;
        }
        
        // Don't let the font size get too large.
        if ((fsUnits === "px" && fsNew > MAX_FONT_SIZE) ||
                (fsUnits === "em" && fsNew > (MAX_FONT_SIZE * 0.1))) {
            return false;
        }
        
        // It's necessary to inject a new rule to address all editors.
        _removeDynamicFontSize(false);
        var style = $("<style type='text/css'></style>").attr("id", DYNAMIC_FONT_STYLE_ID);
        style.html(".CodeMirror {" +
                   "font-size: "   + fsStr + " !important;" +
                   "line-height: " + lhStr + " !important;}");
        $("head").append(style);
        
        var editor = EditorManager.getCurrentFullEditor();
        editor.refreshAll();
        
        // Scroll the document back to its original position. This can only happen
        // if the font size is specified in pixels (which it currently is).
        if (fsUnits === "px") {
            var scrollPos = editor.getScrollPos();
            var scrollDeltaX = Math.round(scrollPos.x / lhOld);
            var scrollDeltaY = Math.round(scrollPos.y / lhOld);
            
            scrollDeltaX = (adjustment >= 0 ? scrollDeltaX : -scrollDeltaX);
            scrollDeltaY = (adjustment >= 0 ? scrollDeltaY : -scrollDeltaY);
            
            editor.setScrollPos((scrollPos.x + scrollDeltaX),
                                (scrollPos.y + scrollDeltaY));
        }
        
        return true;
    }
    
    function _handleIncreaseFontSize() {
        if (_adjustFontSize(1)) {
            _prefs.setValue("fontSizeAdjustment", _prefs.getValue("fontSizeAdjustment") + 1);
        }
    }

    function _handleDecreaseFontSize() {
        if (_adjustFontSize(-1)) {
            _prefs.setValue("fontSizeAdjustment", _prefs.getValue("fontSizeAdjustment") - 1);
        }
    }
    
    function _handleRestoreFontSize() {
        _removeDynamicFontSize(true);
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
                _removeDynamicFontSize(false);
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
    
    // Register command handlers
    CommandManager.register(Strings.CMD_INCREASE_FONT_SIZE, Commands.VIEW_INCREASE_FONT_SIZE, _handleIncreaseFontSize);
    CommandManager.register(Strings.CMD_DECREASE_FONT_SIZE, Commands.VIEW_DECREASE_FONT_SIZE, _handleDecreaseFontSize);
    CommandManager.register(Strings.CMD_RESTORE_FONT_SIZE,  Commands.VIEW_RESTORE_FONT_SIZE,  _handleRestoreFontSize);

    // Init PreferenceStorage
    _prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, _defaultPrefs);

    // Update UI when opening or closing a document
    $(DocumentManager).on("currentDocumentChange", _updateUI);

    // Update UI when Brackets finishes loading
    AppInit.appReady(_updateUI);
});

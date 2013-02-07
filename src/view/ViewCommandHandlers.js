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
        EditorManager           = require("editor/EditorManager");
    
    /**
     * @const
     * @type {string}
     */
    var DYNAMIC_FONT_STYLE_ID = "codemirror-dynamic-fonts";

    function _removeDynamicFontSize(refresh) {
        $("#" + DYNAMIC_FONT_STYLE_ID).remove();
        if (refresh) {
            EditorManager.getCurrentFullEditor().refreshAll();
        }
    }
    
    /**
     * @private
     * Increases or decreases the editor's font size.
     * @param {number} -1 to make the font smaller; 1 to make it bigger.
     */
    function _adjustFontSize(direction) {
        var styleId = "codemirror-dynamic-fonts";

        var fsStyle = $(".CodeMirror").css("font-size");
        var lhStyle = $(".CodeMirror").css("line-height");

        var validFont = /^[\d\.]+(px|em)$/;
        
        // Make sure the font size and line height are expressed in terms
        // we can handle (px or em). If not, simply bail.
        if (fsStyle.search(validFont) === -1 || lhStyle.search(validFont) === -1) {
            return;
        }
        
        // Guaranteed to work by the validation above.
        var fsUnits = fsStyle.substring(fsStyle.length - 2, fsStyle.length);
        var lhUnits = lhStyle.substring(lhStyle.length - 2, lhStyle.length);

        var fsOld = parseFloat(fsStyle.substring(0, fsStyle.length - 2));
        var lhOld = parseFloat(lhStyle.substring(0, lhStyle.length - 2));

        var fsDelta = (fsUnits === "px") ? 1 : 0.1;
        var lhDelta = (lhUnits === "px") ? 1 : 0.1;

        if (direction === -1) {
            fsDelta *= -1;
            lhDelta *= -1;
        }

        var fsNew = fsOld + fsDelta;
        var lhNew = lhOld + lhDelta;
        
        var fsStr = fsNew + fsUnits;
        var lhStr = lhNew + lhUnits;

        // Don't let the fonts get too small.
        if (direction === -1 && ((fsUnits === "px" && fsNew <= 1) || (fsUnits === "em" && fsNew <= 0.1))) {
            return;
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
            editor.setScrollPos(scrollPos.x + (scrollDeltaX * direction),
                                scrollPos.y + (scrollDeltaY * direction));
        }

    }
    
    function _handleIncreaseFontSize() {
        _adjustFontSize(1);
    }

    function _handleDecreaseFontSize() {
        _adjustFontSize(-1);
    }
    
    function _handleRestoreFontSize() {
        _removeDynamicFontSize(true);
    }
    
    CommandManager.register(Strings.CMD_INCREASE_FONT_SIZE, Commands.VIEW_INCREASE_FONT_SIZE, _handleIncreaseFontSize);
    CommandManager.register(Strings.CMD_DECREASE_FONT_SIZE, Commands.VIEW_DECREASE_FONT_SIZE, _handleDecreaseFontSize);
    CommandManager.register(Strings.CMD_RESTORE_FONT_SIZE,  Commands.VIEW_RESTORE_FONT_SIZE,  _handleRestoreFontSize);
});

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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

define(function (require, exports, module) {
    'use strict';
    
    var Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        SidebarView             = require("project/SidebarView"),
        ProjectManager          = require("project/ProjectManager"),
        EditorManager           = require("editor/EditorManager");
    
    function _handleHideSidebar() {
        SidebarView.toggleSidebar();
    }
    
    /**
     * @private
     * Increases or decreases the editor's font size.
     * @param {string} "up" or "down"
     */
    function _adjustFontSize(direction) {
        var styleId = "codemirror-dynamic-fonts";

        var fs = $(".CodeMirror-scroll").css("font-size");
        var lh = $(".CodeMirror-scroll").css("line-height");

        var fsUnits = fs.substring(fs.length - 2, fs.length);
        var lhUnits = lh.substring(lh.length - 2, lh.length);

        fs = fs.substring(0, fs.length - 2);
        lh = lh.substring(0, lh.length - 2);

        var fsDelta = (fsUnits === "px") ? 1 : 0.1;
        var lhDelta = (lhUnits === "px") ? 1 : 0.1;

        if (direction === "down") {
            fsDelta *= -1;
            lhDelta *= -1;
        }

        var fsStr = (parseFloat(fs) + fsDelta) + fsUnits;
        var lhStr = (parseFloat(lh) + lhDelta) + lhUnits;

        if (fsStr === "1px" || fsStr === ".1em") {
            return;
        }

        $("#" + styleId).remove();
        var style = window.document.createElement("style");
        style.setAttribute("type", "text/css");
        style.setAttribute("id", styleId);
        style.innerHTML = ".CodeMirror-scroll{font-size:" + fsStr +
                          " !important;line-height:" + lhStr + " !important;}";
        $("head").append(style);

        var fullEditor = EditorManager.getCurrentFullEditor();
        fullEditor._codeMirror.refresh();
        
        var inlineEditors = fullEditor.getInlineWidgets();
        inlineEditors.forEach(function (multilineEditor, i, arr) {
            multilineEditor.sizeInlineWidgetToContents(true);
            multilineEditor._updateRelatedContainer();
            multilineEditor.editors.forEach(function (editor, j, arr) {
                editor._codeMirror.refresh();
            });
        });
    }

    function _handleIncreaseFontSize() {
        _adjustFontSize("up");
    }

    function _handleDecreaseFontSize() {
        _adjustFontSize("down");
    }
    
    CommandManager.register(Commands.VIEW_HIDE_SIDEBAR,       _handleHideSidebar);
    CommandManager.register(Commands.VIEW_INCREASE_FONT_SIZE, _handleIncreaseFontSize);
    CommandManager.register(Commands.VIEW_DECREASE_FONT_SIZE, _handleDecreaseFontSize);
});

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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */


/**
 * Manages tickmarks shown along the scrollbar track.
 * NOT yet intended for use by anyone other than the FindReplace module.
 */
define(function (require, exports, module) {
    "use strict";

    var Editor              = require("editor/Editor"),
        EditorManager       = require("editor/EditorManager");
    
    
    /** @type {number} Top of scrollbar track area, relative to top of scrollbar */
    var trackOffset;
    
    /** @type {number} Height of scrollbar track area */
    var trackHt;
    
    
    /** Clear any markers in the editor's tickmark track, but leave it visible */
    function clear(codeMirror) {
        $(".tickmark-track", codeMirror.getWrapperElement()).empty();
    }

    /** Add or remove the tickmark track from the editor's UI */
    function setVisible(editor, visible) {
        var rootElem = editor.getRootElement();
        
        if (visible) {
            // Don't support inline editors yet - search inside them is pretty screwy anyway (#2110)
            if (editor.getFirstVisibleLine() > 0 || editor.getLastVisibleLine() < editor.lineCount() - 1) {
                return;
            }
            
            // TODO: what if window resized while Find is active?
            
            var $sb = $(".CodeMirror-vscrollbar", rootElem);
            var $overlay = $("<div class='tickmark-track'></div>");
            $sb.parent().append($overlay);
            
            trackHt = $sb[0].offsetHeight;
            
            if (trackHt > 0) {
                // Scrollbar visible: determine offset of track from top of scrollbar
                if (brackets.platform === "win") {
                    console.log("WIN");
                    trackOffset = 17;  // Up arrow pushes down track
                } else {
                    console.log("MAC");
                    trackOffset = 0;   // No arrows
                }
                
            } else {
                // No scrollbar: use the height of the entire code content
                trackHt = $(".CodeMirror-sizer", rootElem)[0].offsetHeight;
                trackOffset = 0;
            }
            
            trackHt -= trackOffset * 2;
            
            
        } else {
            $(".tickmark-track", rootElem).remove();
        }
    }
    
    /** Add a tickmark to the editor's tickmark track, if it's visible */
    function addTickmark(editor, pos) {
        
        var top = Math.round(pos.line / editor.lineCount() * trackHt) + trackOffset;
        top--;  // subtract ~1/2 the ht of a tickmark to center it on ideal pos
        
        var $mark = $("<div class='tickmark' style='top:" + top + "px'></div>");
        
        $(".tickmark-track", editor.getRootElement()).append($mark);
    }
    
    
    exports.clear = clear;
    exports.setVisible = setVisible;
    exports.addTickmark = addTickmark;
});

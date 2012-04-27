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
/*global define: false, $: false, CodeMirror: false */

/**
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var Commands           = require("command/Commands"),
        CommandManager     = require("command/CommandManager"),
        EditorManager      = require("editor/EditorManager");
    
    
    function handleLineComment() {
        var editor = EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }
        
        // TODO: check Editor mode, proxy to JSUtils...? (ideally should be extendible per-language w/o hardcoded mapping)
        
        
        // Behavior comparison:
        // Brackets preserves exact selection & never moves cursor;  "//" inserted at 0;  [ctrl+/];
        //       w/ not-tabs, all lines jump in 2 chars;  block = n/a yet
        // IntelliJ preserves exact selection; moves cursor to next line only if there was NO selection
        //      (altho bug: cursor moves right 2 cols in that case);  "//" inserted at 0;  [ctrl+/];
        //      w/ not-tabs, all lines jump in 2 chars;  block = [ctrl+shift+/](win+mac)
        // Eclipse(FB) preserves exact selection & never moves cursor;  "//" inserted at 0;  [ctrl+/];
        //      w/ not-tabs, all lines jump in 2 chars;  block = [ctrl+shift+/](win+mac)
        // Espresso preserves exact selection & never moves cursor (altho bug: first // excluded from sel);
        //      "//" inserted at 0;  [ctrl+/];  w/ not-tabs, all lines jump in 2 chars;  block = n/a?
        // Sublime preserves exact selection & never moves cursor;  "// " inserted at first non-ws col,
        //      leaves all-ws lines untouched;  [ctrl+/];  tabs or not, all lines jump in 3 chars;
        //      block = [ctrl+shift+/](win) [cmd+alt+/](mac)
        // TextMate preserves exact selection & never moves cursor; "// " inserted at first non-ws col;  [ctrl+/];
        //      tabs or not, all lines jump in 3 chars;  block = [ctrl+alt+/]
        // Coda has block comment only, bound to [ctrl+/]
        
        var sel = editor.getSelection();
        var startLine = sel.start.line;
        var endLine = sel.end.line;
        
        // In full-line selection, cursor pos is start of next line - but don't want to modify that line
        if (sel.end.ch === 0 && startLine < endLine) {
            endLine--;
        }
        
        // Are there any non-blank lines that aren't commented out?
        var containsUncommented = false;
        var i;
        var line;
        for (i = startLine; i <= endLine; i++) {
            line = editor.getLineText(i);
            // A line is commented out if it starts with 0-N whitespace chars, then "//"
            if (!line.match(/^\s*\/\//) && line.trim().length > 0) {
                containsUncommented = true;
                break;
            }
        }
        
        // Make the edit
        // TODO: should go through Document
        
        var cm = editor._codeMirror;
        cm.operation(function () {
            if (containsUncommented) {
                for (i = startLine; i <= endLine; i++) {
                    cm.replaceRange("//", {line: i, ch: 0});
                }
                
                var hasSelection = (sel.start.line !== sel.end.line) || (sel.start.ch !== sel.end.ch);
                
                // Make sure selection includes "//" that was added at start of range
                if (sel.start.ch === 0 && hasSelection) {
                    // note: grabbing *current* selection end instead of old one, so it's been updated for our text insertions
                    cm.setSelection({line: startLine, ch: 0}, editor.getSelection().end);
                }
            } else {
                for (i = startLine; i <= endLine; i++) {
                    line = editor.getLineText(i);
                    var commentI = line.indexOf("//");
                    if (commentI !== -1) {
                        cm.replaceRange("", {line: i, ch: commentI}, {line: i, ch: commentI + 2});
                    }
                }
            }
        });
        
    }
    

    // Register commands
    CommandManager.register(Commands.EDIT_LINE_COMMENT, handleLineComment);
});

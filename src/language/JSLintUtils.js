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
/*global define: false, $: false, JSLINT: false, PathUtils: false*/

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent non-module scripts
    require("thirdparty/path-utils/path-utils.min");
    require("thirdparty/jslint/jslint");
    
    // Load dependent modules
    var DocumentManager         = require("document/DocumentManager"),
        EditorManager           = require("editor/EditorManager");
    
    var _enabled = true;
    
    function getEnabled() {
        return _enabled;
    }
    
    function setEnabled(enabled) {
        _enabled = enabled;
    }
    
    
    function run() {
        var currentDoc = DocumentManager.getCurrentDocument();
        var ext = currentDoc ? PathUtils.filenameExtension(currentDoc.file.fullPath) : "";
        var lintResults = $("#jslint-results");
        var goldStar = $("#gold-star");
        
        if (getEnabled() && /^(\.js|\.htm|\.html)$/i.test(ext)) {
            var text = currentDoc.getText();
            
            // If a line contains only whitespace, remove the whitespace
            // This should be doable with a regexp: text.replace(/\r[\x20|\t]+\r/g, "\r\r");,
            // but that doesn't work.
            var i, arr = text.split("\n");
            for (i = 0; i < arr.length; i++) {
                if (!arr[i].match(/\S/)) {
                    arr[i] = "";
                }
            }
            text = arr.join("\n");
            
            var result = JSLINT(text, null);
            
            if (!result) {
                var errorTable = $("<table class='zebra-striped condensed-table'>")
                                   .append("<tbody>");
                var selectedRow;
                
                JSLINT.errors.forEach(function (item, i) {
                    if (item) {
                        var makeCell = function (content) {
                            return $("<td/>").text(content);
                        };
                        
                        // Add row to error table
                        var row = $("<tr/>")
                            .append(makeCell(item.line))
                            .append(makeCell(item.reason))
                            .append(makeCell(item.evidence || ""))
                            .appendTo(errorTable);
                        
                        row.click(function () {
                            if (selectedRow) {
                                selectedRow.removeClass("selected");
                            }
                            row.addClass("selected");
                            selectedRow = row;
                            
                            var editor = EditorManager.getCurrentFullEditor();
                            editor.setCursorPos(item.line - 1, item.character - 1);
                            EditorManager.focusEditor();
                        });
                    }
                });

                $("#jslint-results .table-container")
                    .empty()
                    .append(errorTable);
                lintResults.show();
                goldStar.hide();
            } else {
                lintResults.hide();
                goldStar.show();
            }
        } else {
            // JSLint is disabled or does not apply to the current file, hide
            // both the results and the gold star
            lintResults.hide();
            goldStar.hide();
        }
        
        EditorManager.resizeEditor();
    }
    
    
    //register our event listeners
    $(DocumentManager).on("currentDocumentChange", function () {
        run();
    });
    
    $(DocumentManager).on("documentSaved", function (event, document) {
        if (document === DocumentManager.getCurrentDocument()) {
            run();
        }
    });
    
    // Define public API
    exports.run = run;
    exports.getEnabled = getEnabled;
    exports.setEnabled = setEnabled;
});

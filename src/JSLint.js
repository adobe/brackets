/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, JSLINT: false, PathUtils: false*/

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent non-module scripts
    require("thirdparty/path-utils/path-utils.min");
    require("thirdparty/jslint/jslint");
    
    // Load dependent modules
    var DocumentManager         = require("DocumentManager"),
        EditorManager           = require("EditorManager");
    
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
                            
                            var editor = EditorManager.getFullEditorForDocument(currentDoc);
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

/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, PathUtils */

/*
*/


define(function (require, exports, module) {
    'use strict';
    
    var Async               = require("Async"),
        CommandManager      = require("CommandManager"),
        Commands            = require("Commands"),
        DocumentManager     = require("DocumentManager"),
        EditorManager       = require("EditorManager"),
        FileIndexManager    = require("FileIndexManager");

    // Much of this file was copied from QuickFileOpen. We should have a common dialog
    // class that everyone can use.
    
    /**
    * FindInFilesDialog class
    * @constructor
    *
    */
    function FindInFilesDialog() {
        this.closed = false;
        this.result = null; // $.Deferred
    }

    /**
    * Creates a dialog div floating on top of the current code mirror editor
    */
    FindInFilesDialog.prototype._createDialogDiv = function (template) {
        var wrap = $("#editorHolder")[0];
        this.dialog = wrap.insertBefore(document.createElement("div"), wrap.firstChild);
        this.dialog.className = "CodeMirror-dialog";
        this.dialog.innerHTML = '<div>' + template + '</div>';
    };
    
    /**
    * Closes the search dialog and resolves the promise that showDialog returned
    */
    FindInFilesDialog.prototype._close = function (value) {
        if (this.closed) {
            return;
        }
        
        this.closed = true;
            
        this.dialog.parentNode.removeChild(this.dialog);

        this.result.resolve(value);
    };
        
    /**
    * Shows the search dialog and initializes the auto suggestion list with filenames from the current project
    * @returns {$.Promise} a promise that is resolved when the dialgo closes with the string value from the search field
    */
    FindInFilesDialog.prototype.showDialog = function () {
        var dialogHTML = 'Find in Files: <input type="text" id="findInFilesInput" style="width: 10em"> <span style="color: #888">(Use /re/ syntax for regexp search)</span>';
        this.result = new $.Deferred();
        this._createDialogDiv(dialogHTML);
        var searchField = $('input#findInFilesInput');
        var that = this;
        
        searchField.bind("keydown", function (event) {
            if (event.keyCode === 13 || event.keyCode === 27) {  // Enter/Return key or Esc key
                event.stopPropagation();
                event.preventDefault();
                
                var query = searchField.val();
                
                if (event.keyCode === 27) {
                    query = null;
                }
                
                that._close(query);
            }
        })
            .focus();
        
        return this.result;
    };


    function _getSearchMatches(contents, queryExpr) {
        // Quick exit if not found
        if (contents.search(queryExpr) === -1) {
            return null;
        }
        
        var trimmedContents = contents;
        var startPos = 0;
        var matchStart;
        var matchLength = contents.match(queryExpr)[0].length;
        var matches = [];
        
        function getLineNum(offset) {
            return contents.substr(0, offset).split("\n").length - 1; // 0 based linenum
        }
        
        function getLine(lineNum) {
            return contents.split("\n")[lineNum];
        }
        
        while ((matchStart = trimmedContents.search(queryExpr)) !== -1) {
            var lineNum = getLineNum(matchStart + startPos);
            var ch = matchStart - trimmedContents.substr(0, matchStart).lastIndexOf("\n") - 1; // 0 based pos
            
            // ch is realtive to trimmedContents. If there are multiple matches on a line, any match
            // past the first needs to be adjusted here.
            if (trimmedContents.lastIndexOf("\n", matchStart) === -1) {
                var textBefore = contents.substr(0, startPos);
                ch += (textBefore.length - textBefore.lastIndexOf("\n") - 1);
            }
                
            matches.push({
                start: {line: lineNum, ch: ch},
                end: {line: lineNum, ch: ch + matchLength},
                line: getLine(lineNum)
            });
            trimmedContents = trimmedContents.substr(matchStart + matchLength);
            startPos += matchStart + matchLength;
        }
        
        return matches;
    }
        
    function _showSearchResults(searchResults) {
        var $searchResultsDiv = $("#search-results");
        
        if (searchResults && searchResults.length) {
            var resultTable = $("<table class='zebra-striped condensed-table'>")
                                .append("<tbody>");
            
            // Count the total number of matches
            var numMatches = 0;
            searchResults.forEach(function (item) {
                numMatches += item.matches.length;
            });
            
            // Show result summary in header
            $("#search-result-summary")
                .text(" - " + numMatches + " matches in " + searchResults.length + " files");
            
            searchResults.forEach(function (item) {
                if (item) {
                    var makeCell = function (content) {
                        return $("<td/>").html(content);
                    };
                    
                    var esc = function (str) {
                        str = str.replace(/</g, "&lt;");
                        str = str.replace(/>/g, "&gt;");
                        return str;
                    };
                    
                    var highlightMatch = function (line, start, end) {
                        return esc(line.substr(0, start)) + "<span class='highlight'>" + esc(line.substring(start, end)) + "</span>" + esc(line.substr(end));
                    };
                    
                    // Add row for file name
                    $("<tr/>")
                        .append("<td colspan='3'>File: <b>" + item.fullPath + "</b></td>")
                        .appendTo(resultTable);
                    
                    // Add row for each match in file
                    item.matches.forEach(function (match) {
                        var row = $("<tr/>")
                            .append(makeCell(" "))      // Indent
                            .append(makeCell("line: " + (match.start.line + 1)))
                            .append(makeCell(highlightMatch(match.line, match.start.ch, match.end.ch)))
                            .appendTo(resultTable);
                        
                        row.click(function () {
                            CommandManager.execute(Commands.FILE_OPEN, {fullPath: item.fullPath})
                                .done(function (doc) {
                                    // Opened document is now the focused editor
                                    EditorManager.getFocusedEditor().editor.setSelection(match.start, match.end);
                                });
                        });
                    });
                    
                }
            });
            
            $("#search-results .table-container")
                .empty()
                .append(resultTable);
            
            $searchResultsDiv.show();
        } else {
            $searchResultsDiv.hide();
        }
        
        EditorManager.resizeEditor();
    }
    
    /**
    * Displays a non-modal embedded dialog above the code mirror editor that allows the user to do
    * a find operation across all files in the project.
    */
    function doFindInFiles() {

        var dialog = new FindInFilesDialog();
        var searchResults = [];
                            
        dialog.showDialog()
            .done(function (query) {
                if (query) {
                    var queryExpr = new RegExp(query, "i"); // TODO: handle regular expression search
                    FileIndexManager.getFileInfoList("all")
                        .done(function (fileListResult) {
                            Async.doInParallel(fileListResult, function (fileInfo) {
                                var result = new $.Deferred();
                                
                                DocumentManager.getDocumentContents(fileInfo.fullPath)
                                    .done(function (contents) {
                                        var matches = _getSearchMatches(contents, queryExpr);
                                        
                                        if (matches && matches.length) {
                                            searchResults.push({
                                                fullPath: fileInfo.fullPath,
                                                matches: matches
                                            });
                                        }
                                        result.resolve();
                                    })
                                    .fail(function (error) {
                                        // Error reading this file. This is most likely because the file isn't a text file.
                                        // Resolve here so we move on to the next file.
                                        result.resolve();
                                    });
                                
                                return result;
                            })
                                .done(function () {
                                    console.dir(searchResults);
                                    _showSearchResults(searchResults);
                                })
                                .fail(function () {
                                    console.log("find in files failed.");
                                });
                        });
                }
            });
    }

    CommandManager.register(Commands.FIND_IN_FILES, doFindInFiles);
});
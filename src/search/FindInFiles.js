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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, PathUtils, window */

/*
 * Adds a "find in files" command to allow the user to find all occurances of a string in all files in
 * the project.
 * 
 * The keyboard shortcut is Cmd(Ctrl)-Shift-F.
 *
 * FUTURE:
 *  - Proper UI for both dialog and results
 *  - Refactor dialog class and share with Quick File Open
 *  - Search files in working set that are *not* in the project
 *  - Handle matches that span mulitple lines
 *  - Refactor UI from functionality to enable unit testing
 */


define(function (require, exports, module) {
    "use strict";
    
    var Async               = require("utils/Async"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        ProjectManager      = require("project/ProjectManager"),
        DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        FileIndexManager    = require("project/FileIndexManager"),
        KeyEvent            = require("utils/KeyEvent"),
        AppInit             = require("utils/AppInit"),
        StatusBar           = require("widgets/StatusBar");

    var searchResults = [];
    
    var FIND_IN_FILES_MAX = 100,
        maxHitsFoundInFile = false;
    
    function _getQueryRegExp(query) {
        // Clear any pending RegEx error message
        $(".CodeMirror-dialog .alert-message").remove();
        
        // If query is a regular expression, use it directly
        var isRE = query.match(/^\/(.*)\/(g|i)*$/);
        if (isRE) {
            // Make sure the 'g' flag is set
            var flags = isRE[2] || "g";
            if (flags.search("g") === -1) {
                flags += "g";
            }
            try {
                return new RegExp(isRE[1], flags);
            } catch (e) {
                $(".CodeMirror-dialog div").append("<div class='alert-message' style='margin-bottom: 0'>" + e.message + "</div>");
                return null;
            }
        }

        // Query is a string. Turn it into a case-insensitive regexp
        
        // Escape regex special chars
        query = StringUtils.regexEscape(query);
        return new RegExp(query, "gi");
    }
    
    /**
     * Returns label text to indicate the search scope. Already HTML-escaped.
     * @param {?Entry} scope
     */
    function _labelForScope(scope) {
        var projName = ProjectManager.getProjectRoot().name;
        if (scope) {
            var displayPath = StringUtils.htmlEscape(ProjectManager.makeProjectRelativeIfPossible(scope.fullPath));
            return StringUtils.format(Strings.FIND_IN_FILES_SCOPED, displayPath);
        } else {
            return Strings.FIND_IN_FILES_NO_SCOPE;
        }
    }
    
    
    // This dialog class was mostly copied from QuickOpen. We should have a common dialog
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
        this.dialog = $("<div />")
                          .attr("class", "CodeMirror-dialog")
                          .html("<div>" + template + "</div>")
                          .prependTo($("#editor-holder"));
    };
    
    /**
    * Closes the search dialog and resolves the promise that showDialog returned
    */
    FindInFilesDialog.prototype._close = function (value) {
        if (this.closed) {
            return;
        }
        
        this.closed = true;
        this.dialog.remove();
        EditorManager.focusEditor();
        this.result.resolve(value);
    };
    
    /**
    * Shows the search dialog 
    * @param {?string} initialString Default text to prepopulate the search field with
    * @param {?Entry} scope Search scope, or null to search whole proj
    * @returns {$.Promise} that is resolved with the string to search for
    */
    FindInFilesDialog.prototype.showDialog = function (initialString, scope) {
        // Note the prefix label is a simple "Find:" - the "in ..." part comes after the text field
        var dialogHTML = Strings.CMD_FIND +
            ": <input type='text' id='findInFilesInput' style='width: 10em'> <span id='findInFilesScope'></span> &nbsp;" +
            "<span style='color: #888'>(" + Strings.SEARCH_REGEXP_INFO  + ")</span>";
        this.result = new $.Deferred();
        this._createDialogDiv(dialogHTML);
        var $searchField = $("input#findInFilesInput");
        var that = this;
        
        $searchField.attr("value", initialString || "");
        $searchField.get(0).select();
        
        $("#findInFilesScope").html(_labelForScope(scope));
        
        $searchField.bind("keydown", function (event) {
            if (event.keyCode === KeyEvent.DOM_VK_RETURN || event.keyCode === KeyEvent.DOM_VK_ESCAPE) {  // Enter/Return key or Esc key
                event.stopPropagation();
                event.preventDefault();
                
                var query = $searchField.val();
                
                if (event.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                    query = null;
                }
                
                that._close(query);
            }
        })
            .bind("input", function (event) {
                // Check the query expression on every input event. This way the user is alerted
                // to any RegEx syntax errors immediately.
                _getQueryRegExp($searchField.val());
            })
            .blur(function () {
                that._close(null);
            })
            .focus();
        
        return this.result.promise();
    };


    function _getSearchMatches(contents, queryExpr) {
        // Quick exit if not found
        if (contents.search(queryExpr) === -1) {
            return null;
        }
        
        var trimmedContents = contents;
        var startPos = 0;
        var matchStart;
        var matches = [];
        
        
        var match;
        var lines = StringUtils.getLines(contents);
        while ((match = queryExpr.exec(contents)) !== null) {
            var lineNum = StringUtils.offsetToLineNum(lines, match.index);
            var line = lines[lineNum];
            var ch = match.index - contents.lastIndexOf("\n", match.index) - 1;  // 0-based index
            var matchLength = match[0].length;
            
            // Don't store more than 200 chars per line
            line = line.substr(0, Math.min(200, line.length));
            
            matches.push({
                start: {line: lineNum, ch: ch},
                end: {line: lineNum, ch: ch + matchLength},
                line: line
            });

            // We have the max hits in just this 1 file. Stop searching this file.
            // This fixed issue #1829 where code hangs on too many hits.
            if (matches.length >= FIND_IN_FILES_MAX) {
                queryExpr.lastIndex = 0;
                maxHitsFoundInFile = true;
                break;
            }
        }

        return matches;
    }
        
    function _showSearchResults(searchResults, query, scope) {
        var $searchResultsDiv = $("#search-results");
        
        if (searchResults && searchResults.length) {
            var $resultTable = $("<table class='zebra-striped condensed-table' />")
                                .append("<tbody>");
            
            // Count the total number of matches
            var numMatches = 0;
            searchResults.forEach(function (item) {
                numMatches += item.matches.length;
            });
            
            // Show result summary in header
            var numMatchesStr = "";
            if (maxHitsFoundInFile) {
                numMatchesStr = Strings.FIND_IN_FILES_MORE_THAN;
            }
            numMatchesStr += String(numMatches);

            // This text contains some formatting, so all the strings are assumed to be already escaped
            var summary = StringUtils.format(
                Strings.FIND_IN_FILES_TITLE,
                numMatchesStr,
                (numMatches > 1) ? Strings.FIND_IN_FILES_MATCHES : Strings.FIND_IN_FILES_MATCH,
                searchResults.length,
                (searchResults.length > 1 ? Strings.FIND_IN_FILES_FILES : Strings.FIND_IN_FILES_FILE),
                query,
                scope ? _labelForScope(scope) : ""
            );
            
            $("#search-result-summary")
                .html(summary +
                     (numMatches > FIND_IN_FILES_MAX ? StringUtils.format(Strings.FIND_IN_FILES_MAX, FIND_IN_FILES_MAX) : ""))
                .prepend("&nbsp;"); // putting a normal space before the "-" is not enough
            
            var resultsDisplayed = 0;
            
            searchResults.forEach(function (item) {
                if (item && resultsDisplayed < FIND_IN_FILES_MAX) {
                    var makeCell = function (content) {
                        return $("<td/>").html(content);
                    };
                    
                    // shorthand function name
                    var esc = StringUtils.htmlEscape;
                    
                    var highlightMatch = function (line, start, end) {
                        return esc(line.substr(0, start)) + "<span class='highlight'>" + esc(line.substring(start, end)) + "</span>" + esc(line.substr(end));
                    };
                    
                    // Add row for file name
                    var displayFileName = StringUtils.format(Strings.FIND_IN_FILES_FILE_PATH,
                                                             StringUtils.breakableUrl(esc(item.fullPath)));
                    $("<tr class='file-section' />")
                        .append("<td colspan='3'><span class='disclosure-triangle expanded'></span>" + displayFileName + "</td>")
                        .click(function () {
                            // Clicking file section header collapses/expands result rows for that file
                            var $fileHeader = $(this);
                            $fileHeader.nextUntil(".file-section").toggle();
                            
                            var $triangle = $(".disclosure-triangle", $fileHeader);
                            $triangle.toggleClass("expanded").toggleClass("collapsed");
                        })
                        .appendTo($resultTable);
                    
                    // Add row for each match in file
                    item.matches.forEach(function (match) {
                        if (resultsDisplayed < FIND_IN_FILES_MAX) {
                            var $row = $("<tr/>")
                                .append(makeCell(" "))      // Indent
                                .append(makeCell(StringUtils.format(Strings.FIND_IN_FILES_LINE, (match.start.line + 1))))
                                .append(makeCell(highlightMatch(match.line, match.start.ch, match.end.ch)))
                                .appendTo($resultTable);
                            
                            $row.click(function () {
                                CommandManager.execute(Commands.FILE_OPEN, {fullPath: item.fullPath})
                                    .done(function (doc) {
                                        // Opened document is now the current main editor
                                        EditorManager.getCurrentFullEditor().setSelection(match.start, match.end);
                                    });
                            });
                            resultsDisplayed++;
                        }
                    });
                    
                }
            });
            
            $("#search-results .table-container")
                .empty()
                .append($resultTable)
                .scrollTop(0);  // otherwise scroll pos from previous contents is remembered
            
            $("#search-results .close")
                .one("click", function () {
                    $searchResultsDiv.hide();
                    EditorManager.resizeEditor();
                });
            
            $searchResultsDiv.show();
        } else {
            $searchResultsDiv.hide();
        }
        
        EditorManager.resizeEditor();
    }
    
    /**
     * @param {!FileInfo} fileInfo File in question
     * @param {?Entry} scope Search scope, or null if whole project
     * @return {boolean}
     */
    function inScope(fileInfo, scope) {
        if (scope) {
            if (scope.isDirectory) {
                // Dirs always have trailing slash, so we don't have to worry about being
                // a substring of another dir name
                return fileInfo.fullPath.indexOf(scope.fullPath) === 0;
            } else {
                return fileInfo.fullPath === scope.fullPath;
            }
        }
        return true;
    }
    
    /**
    * Displays a non-modal embedded dialog above the code mirror editor that allows the user to do
    * a find operation across all files in the project.
    * @param {?Entry} scope Project file/subfolder to search within; else searches whole project.
    */
    function doFindInFiles(scope) {

        var dialog = new FindInFilesDialog();
        
        // Default to searching for the current selection
        var currentEditor = EditorManager.getActiveEditor();
        var initialString = currentEditor && currentEditor.getSelectedText();
        
        searchResults = [];
        maxHitsFoundInFile = false;
                            
        dialog.showDialog(initialString, scope)
            .done(function (query) {
                if (query) {
                    var queryExpr = _getQueryRegExp(query);
                    if (!queryExpr) {
                        return;
                    }
                    StatusBar.showBusyIndicator(true);
                    FileIndexManager.getFileInfoList("all")
                        .done(function (fileListResult) {
                            Async.doInParallel(fileListResult, function (fileInfo) {
                                var result = new $.Deferred();
                                
                                if (!inScope(fileInfo, scope)) {
                                    result.resolve();
                                } else {
                                    // Search one file
                                    DocumentManager.getDocumentForPath(fileInfo.fullPath)
                                        .done(function (doc) {
                                            var matches = _getSearchMatches(doc.getText(), queryExpr);
                                            
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
                                }
                                return result.promise();
                            })
                                .done(function () {
                                    // Done searching all files: show results
                                    _showSearchResults(searchResults, query, scope);
                                    StatusBar.hideBusyIndicator();
                                })
                                .fail(function () {
                                    console.log("find in files failed.");
                                    StatusBar.hideBusyIndicator();
                                });
                        });
                }
            });
    }
    
    /** Search within the file/subtree defined by the sidebar selection */
    function doFindInSubtree() {
        // Prefer project tree selection, else use working set selection
        var selectedEntry = ProjectManager.getSelectedItem();
        if (!selectedEntry) {
            var doc = DocumentManager.getCurrentDocument();
            selectedEntry = (doc && doc.file);
        }
        
        doFindInFiles(selectedEntry);
    }
    
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        var $searchResults  = $("#search-results"),
            $searchContent  = $("#search-results .table-container");
    });

    function _fileNameChangeHandler(event, oldName, newName) {
        if ($("#search-results").is(":visible")) {
            // Update the search results
            searchResults.forEach(function (item) {
                item.fullPath = item.fullPath.replace(oldName, newName);
            });
            _showSearchResults(searchResults);
        }
    }
    
    $(DocumentManager).on("fileNameChange", _fileNameChangeHandler);
    
    CommandManager.register(Strings.CMD_FIND_IN_FILES,   Commands.EDIT_FIND_IN_FILES,   doFindInFiles);
    CommandManager.register(Strings.CMD_FIND_IN_SUBTREE, Commands.EDIT_FIND_IN_SUBTREE, doFindInSubtree);
});

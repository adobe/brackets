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
/*global define, $, PathUtils, Mustache, window */

/*
 * Adds a "find in files" command to allow the user to find all occurances of a string in all files in
 * the project.
 * 
 * The keyboard shortcut is Cmd(Ctrl)-Shift-F.
 *
 * FUTURE:
 *  - Proper UI for both dialog and results
 *  - Refactor dialog class and share with Quick File Open
 *  - Handle matches that span mulitple lines
 *  - Refactor UI from functionality to enable unit testing
 */


define(function (require, exports, module) {
    "use strict";
    
    var Async                 = require("utils/Async"),
        NativeFileSystem      = require("file/NativeFileSystem").NativeFileSystem,
        FileUtils             = require("file/FileUtils"),
        CommandManager        = require("command/CommandManager"),
        Commands              = require("command/Commands"),
        Strings               = require("strings"),
        StringUtils           = require("utils/StringUtils"),
        ProjectManager        = require("project/ProjectManager"),
        FileViewController    = require("project/FileViewController"),
        FileIndexManager      = require("project/FileIndexManager"),
        DocumentManager       = require("document/DocumentManager"),
        EditorManager         = require("editor/EditorManager"),
        KeyEvent              = require("utils/KeyEvent"),
        AppInit               = require("utils/AppInit"),
        CollectionUtils       = require("utils/CollectionUtils"),
        StatusBar             = require("widgets/StatusBar"),
        ModalBar              = require("widgets/ModalBar").ModalBar,
        SearchDialogTemplate  = require("text!htmlContent/search-dialog.html"),
        SearchResultsTemplate = require("text!htmlContent/search-results.html");
    
    var RESULTS_PER_PAGE = 100,
        FIND_IN_FILE_MAX = 300;
    
    /**
     * Map of all the last search results
     * @type {Object.<fullPath: string, {matches: Array.<Object>, collapsed: boolean}>}
     */
    var _searchResults = {};
    
    /** @type {Array.<string>} Keeps a copy of the search files sorted by name and with the selected file first */
    var _searchFiles = [];
    
    /** @type {Document} The current editor used to register the change and deleted events */
    var _currentDocument = null;
    
    /** @type {string} The current search query */
    var _currentQuery = "";
    
    /** @type {RegExp} The current regular expresion created from the search query */
    var _currentQueryExpr = "";
    
    /** @type {Array.<FileEntry>} An array of the files where it should look or null/empty to search the entire project */
    var _currentScope = null;
    
    /** @type {number} The index of the first result that is displayed */
    var _currentStart = 0;
    
    /** @type {boolean} True if the matches in a file reached FIND_IN_FILE_MAX */
    var _maxHitsFoundInFile = false;
    
    /** @type {boolean} Tracks the automatically selection of the first result after the search is complete */
    var _gotoFirstResult = false;
    
    /** @type {$.Element} jQuery elements used in the search results */
    var $searchResults,
        $searchSummary,
        $searchContent,
        $selectedRow;
    
    
    /**
     * @private
     * Returns a regular expression from the given query and shows an error in the modal-bar if it was invalid
     * @param {!string} query - The query from the modal-bar input
     * @return {RegExp}
     */
    function _getQueryRegExp(query) {
        // Clear any pending RegEx error message
        $(".modal-bar .message").css("display", "inline-block");
        $(".modal-bar .error").css("display", "none");

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
                $(".modal-bar .message").css("display", "none");
                $(".modal-bar .error")
                    .css("display", "inline-block")
                    .html("<div class='alert-message' style='margin-bottom: 0'>" + e.message + "</div>");
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
     * @param {?Array.<FileEntry>} scope
     */
    function _labelForScope(scope) {
        var projName = ProjectManager.getProjectRoot().name;
        if (scope) {
            if (scope.length === 1) {
                var displayPath = StringUtils.htmlEscape(ProjectManager.makeProjectRelativeIfPossible(scope[0].fullPath));
                return StringUtils.format(Strings.FIND_IN_FILES_SCOPED, displayPath);
            } else {
                return Strings.FIND_IN_FILES_WORKING_SET;
            }
        } else {
            return Strings.FIND_IN_FILES_PROJECT;
        }
    }
    
    
    // This dialog class was mostly copied from QuickOpen. We should have a common dialog
    // class that everyone can use.
    
    /**
     * FindInFilesDialog class
     * @constructor
     */
    function FindInFilesDialog() {
        this.closed = false;
        this.result = null; // $.Deferred
    }

    /**
     * Closes the search dialog and resolves the promise that showDialog returned
     */
    FindInFilesDialog.prototype._close = function (value) {
        if (this.closed) {
            return;
        }
        
        this.closed = true;
        this.modalBar.close();
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
        var templateVars = {
            value: initialString || "",
            label: _labelForScope(scope)
        };
        var dialogHTML = Mustache.render(SearchDialogTemplate, $.extend(templateVars, Strings));
        
        this.result   = new $.Deferred();
        this.modalBar = new ModalBar(dialogHTML, false);
        
        var $searchField = $("input#searchInput");
        var that = this;
        
        $searchField.get(0).select();
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


    /**
     * @private
     * Searches throught the contents an returns an array of matches
     * @param {!string} contents
     * @param {!RegExp} queryExpr
     * @return {Array.<{start: {line:number,ch:number}, end: {line:number,ch:number}, line: string}>}
     */
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
            var lineNum     = StringUtils.offsetToLineNum(lines, match.index);
            var line        = lines[lineNum];
            var ch          = match.index - contents.lastIndexOf("\n", match.index) - 1;  // 0-based index
            var matchLength = match[0].length;
            
            // Don't store more than 200 chars per line
            line = line.substr(0, Math.min(200, line.length));
            
            matches.push({
                start: {line: lineNum, ch: ch},
                end:   {line: lineNum, ch: ch + matchLength},
                line:  line
            });

            // We have the max hits in just this 1 file. Stop searching this file.
            // This fixed issue #1829 where code hangs on too many hits.
            if (matches.length >= FIND_IN_FILE_MAX) {
                queryExpr.lastIndex = 0;
                _maxHitsFoundInFile = true;
                break;
            }
        }

        return matches;
    }
    
    /**
     * @private
     * Searches and stores the match results for the given file, if there are matches
     * @param {!string} fullPath
     * @param {!string} contents
     * @param {!RegExp} queryExpr
     */
    function _addSearchMatches(fullPath, contents, queryExpr) {
        var matches = _getSearchMatches(contents, queryExpr);
        
        if (matches && matches.length) {
            _searchResults[fullPath] = {
                matches:   matches,
                collapsed: false
            };
        }
    }
    
    /**
     * @private
     * Sorts the file keys to show the selected result first and the rest sorted by path
     */
    function _sortResultFiles() {
        var selectedEntry = ProjectManager.getSidebarSelectedItem();
        _searchFiles = Object.keys(_searchResults);
        
        _searchFiles.sort(function (key1, key2) {
            if (selectedEntry.fullPath === key1) {
                return -1;
            } else if (selectedEntry.fullPath === key2) {
                return 1;
            } else {
                return key1.toLocaleLowerCase().localeCompare(key2.toLocaleLowerCase());
            }
        });
    }
    
    
    /**
     * @private
     * Shows the results in a table and adds the necesary event listeners
     */
    function _showSearchResults() {
        if (!$.isEmptyObject(_searchResults)) {
            
            // Count the total number of files and matches
            var numFiles = 0, numMatches = 0;
            CollectionUtils.forEach(_searchResults, function (item) {
                numFiles++;
                numMatches += item.matches.length;
            });
            
            if (_currentStart > numMatches || _currentStart < 0) {
                return;
            }
            
            // Show result summary in header
            var numMatchesStr = "";
            if (_maxHitsFoundInFile) {
                numMatchesStr = Strings.FIND_IN_FILES_MORE_THAN;
            }
            numMatchesStr += String(numMatches);

            // This text contains some formatting, so all the strings are assumed to be already escaped
            var summary = StringUtils.format(
                Strings.FIND_IN_FILES_TITLE,
                numMatchesStr,
                (numMatches > 1) ? Strings.FIND_IN_FILES_MATCHES : Strings.FIND_IN_FILES_MATCH,
                numFiles,
                (numFiles > 1 ? Strings.FIND_IN_FILES_FILES : Strings.FIND_IN_FILES_FILE),
                StringUtils.htmlEscape(_currentQuery),
                _currentScope ? _labelForScope(_currentScope) : ""
            );
            
            // The last result index displayed
            var last = _currentStart + RESULTS_PER_PAGE > numMatches ? numMatches : _currentStart + RESULTS_PER_PAGE;
            
            // Insert the search summary
            $searchSummary
                .html(summary +
                     (numMatches > RESULTS_PER_PAGE ? StringUtils.format(Strings.FIND_IN_FILES_PAGING, _currentStart + 1, last) : "") +
                     (_currentStart > 0 ? Strings.FIND_IN_FILES_LESS : "") +
                     (last < numMatches ? Strings.FIND_IN_FILES_MORE : ""))
                .prepend("&nbsp;"); // putting a normal space before the "-" is not enough
            
            // Create the results template search list
            var searchList = [];
            var resultsDisplayed = 0, i;
            var searchItems, item, match;
            
            _searchFiles.some(function (fullPath) {
                item = _searchResults[fullPath];
                
                // Skip the items that will not fit in the results page
                if (resultsDisplayed + item.matches.length < _currentStart) {
                    resultsDisplayed += item.matches.length;
                    i = -1;
                
                // Only the first matches will be displayed filling the remaining space of the table 
                } else if (resultsDisplayed < _currentStart) {
                    i = _currentStart - resultsDisplayed;
                    resultsDisplayed = _currentStart;
                    
                
                // All the matches can be displayed
                } else if (resultsDisplayed < last) {
                    i = 0;
                
                // We can't display more items by now. Break the loop
                } else {
                    return true;
                }
                
                if (i >= 0 && i < item.matches.length) {
                    // Add a row for each match in the file
                    searchItems = [];
                    while (i < item.matches.length && resultsDisplayed < last) {
                        match = item.matches[i];
                        searchItems.push({
                            file:      searchList.length,
                            item:      i,
                            line:      StringUtils.format(Strings.FIND_IN_FILES_LINE, (match.start.line + 1)),
                            pre:       match.line.substr(0, match.start.ch),
                            highlight: match.line.substring(match.start.ch, match.end.ch),
                            post:      match.line.substr(match.end.ch),
                            start:     match.start,
                            end:       match.end
                        });
                        resultsDisplayed++;
                        i++;
                    }
                    
                    // Add a row for each file
                    searchList.push({
                        file:     searchList.length,
                        filename: StringUtils.breakableUrl(StringUtils.htmlEscape(fullPath)),
                        fullPath: fullPath,
                        items:    searchItems
                    });
                }
            });
            
            // Insert the search results
            $searchContent
                .empty()
                .append(Mustache.render(SearchResultsTemplate, {searchList: searchList}))
                .scrollTop(0);  // otherwise scroll pos from previous contents is remembered
            
            $searchResults.find(".close")
                .one("click", function () {
                    $searchResults.hide();
                    EditorManager.resizeEditor();
                });
            
            // The link to go the previous page
            $searchResults.find(".find-less")
                .one("click", function () {
                    _currentStart -= RESULTS_PER_PAGE;
                    _showSearchResults();
                });
            
            // The link to go to the next page
            $searchResults.find(".find-more")
                .one("click", function () {
                    _currentStart += RESULTS_PER_PAGE;
                    _showSearchResults();
                });
            
            // Add the click and double click event directly on the table parent
            $searchContent
                .off(".searchList")  // Remove the old events. Needed for paging
                .on("click.searchList", function (e) {
                    var $row = $(e.target).closest("tr");
                    
                    if ($row.length) {
                        if ($selectedRow) {
                            $selectedRow.removeClass("selected");
                        }
                        $row.addClass("selected");
                        $selectedRow = $row;
                        
                        var searchItem = searchList[$row.data("file")];
                        var fullPath   = searchItem.fullPath;
                        
                        // This is a file title row, expand/collapse on click
                        if ($row.hasClass("file-section")) {
                            // Clicking file section header collapses/expands result rows for that file
                            $row.nextUntil(".file-section").toggle();
                            
                            var $triangle = $(".disclosure-triangle", $row);
                            $triangle.toggleClass("expanded").toggleClass("collapsed");
                            
                            _searchResults[fullPath].collapsed = !_searchResults[fullPath].collapsed;
                        
                        // This is a file row, show result click
                        } else {
                            // Grab the required item data
                            var item = searchItem.items[$row.data("item")];
                            
                            CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPath})
                                .done(function (doc) {
                                    // Opened document is now the current main editor
                                    EditorManager.getCurrentFullEditor().setSelection(item.start, item.end, true);
                                });
                        }
                    }
                
                // Add the file to the working set on double click
                }).on("dblclick.searchList", function (e) {
                    var $row = $(e.target).closest("tr");
                    if ($row.length && !$row.hasClass("file-section")) {
                        // Grab the required item data
                        var item = searchList[$row.data("file")];
                        
                        FileViewController.addToWorkingSetAndSelect(item.fullPath);
                    }
                
                // Restore the collapsed files
                }).find(".file-section").each(function () {
                    var searchItem = searchList[$(this).data("file")];
                    var fullPath   = searchItem.fullPath;
                    
                    if (_searchResults[fullPath].collapsed) {
                        _searchResults[fullPath].collapsed = false;
                        $(this).trigger("click");
                    }
                });
            
            $searchResults.show();
            EditorManager.resizeEditor();
            
            // Select the first result if the current file is the first result in the list
            if (_gotoFirstResult && _searchResults[_currentDocument.file.fullPath]) {
                $searchContent.find("tr:nth-child(2)").trigger("click");
                _gotoFirstResult = false;
            }
            
        } else {
            $searchResults.hide();
            EditorManager.resizeEditor();
        }
    }
    
    /**
     * @private
     * Returns true if there is no scope or if the file is within one of the folder or is one of the files
     * @param {!FileInfo} fileInfo - File in question
     * @param {?Array.<FileEntry>} scope - Search scope, or null/empty if whole project
     * @return {boolean}
     */
    function _inScope(fileInfo, scope) {
        if (scope && scope.length) {
            return scope.some(function (item) {
                if (item.isDirectory) {
                    // Dirs always have trailing slash, so we don't have to worry about being
                    // a substring of another dir name
                    return fileInfo.fullPath.indexOf(item.fullPath) === 0;
                } else {
                    return fileInfo.fullPath === item.fullPath;
                }
            });
        }
        return true;
    }
    
    /**
     * @private
     * Adds the files in the working set that arent in the project to the file index list
     * @param {!Array.<FileInfo>} fileListResult
     */
    function _addNonProjectFiles(fileListResult) {
        var result     = false;
        var workingSet = DocumentManager.getWorkingSet();
        
        workingSet.forEach(function (item) {
            result = fileListResult.some(function (fileInfo) {
                return fileInfo.fullPath === item.fullPath;
            });
            if (!result) {
                fileListResult.push(item);
            }
        });
    }
    
    /**
     * @private
     * Displays a non-modal embedded dialog above the code mirror editor that allows the user to do
     * a find operation across all files in the project or a given scope.
     * @param {?Array.<FileEntry>} scope - An array of file/subfolder to search within; else searches whole project.
     */
    function _handleFindInFiles(scope) {
        var dialog = new FindInFilesDialog();
        
        // Default to searching for the current selection
        var currentEditor = EditorManager.getActiveEditor();
        var initialString = currentEditor && currentEditor.getSelectedText();
        
        // Reset the private variables
        _searchResults      = {};
        _searchFiles        = [];
        _currentQuery       = "";
        _currentQueryExpr   = "";
        _currentScope       = scope;
        _currentStart       = 0;
        _maxHitsFoundInFile = false;
        _gotoFirstResult    = true;
                            
        dialog.showDialog(initialString, scope)
            .done(function (query) {
                if (query) {
                    _currentQuery     = query;
                    _currentQueryExpr = _getQueryRegExp(query);
                    
                    if (!_currentQueryExpr) {
                        return;
                    }
                    
                    StatusBar.showBusyIndicator(true);
                    FileIndexManager.getFileInfoList("all")
                        .done(function (fileListResult) {
                            _addNonProjectFiles(fileListResult);
                            
                            Async.doInParallel(fileListResult, function (fileInfo) {
                                var result = new $.Deferred();
                                
                                if (!_inScope(fileInfo, scope)) {
                                    result.resolve();
                                } else {
                                    // Search one file
                                    var file;
                                    if (DocumentManager.findInWorkingSet(fileInfo.fullPath) > -1) {
                                        file = DocumentManager.getDocumentForPath(fileInfo.fullPath);
                                    } else {
                                        var fileEntry = new NativeFileSystem.FileEntry(fileInfo.fullPath);
                                        file = FileUtils.readAsText(fileEntry);
                                    }
                                    file.done(function (doc) {
                                        var text = typeof doc === "object" ? doc.getText() : doc;
                                        _addSearchMatches(fileInfo.fullPath, text, _currentQueryExpr);
                                        result.resolve();
                                    
                                    }).fail(function (error) {
                                        // Error reading this file. This is most likely because the file isn't a text file.
                                        // Resolve here so we move on to the next file.
                                        result.resolve();
                                    });
                                }
                                return result.promise();
                            })
                                .done(function () {
                                    // Done searching all files: sort the files and show results
                                    _sortResultFiles();
                                    _showSearchResults();
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
    
    /**
     * @private
     * Search within the file/subtree inside the project defined by the sidebar selection
     */
    function _handleFindInSubtree() {
        var selectedEntry = ProjectManager.getSidebarSelectedItem();
        _handleFindInFiles(selectedEntry ? [selectedEntry] : null);
    }
    
    /**
     * @private
     * Search within all the files in the working set inside the project
     */
    function _handleFindInWorkingSet() {
        _handleFindInFiles(DocumentManager.getWorkingSet());
    }
    
    
    
    /**
     * @private
     * Triggers a click on the given row element and scrolls to it if needed
     * @param {$.Element} $row - A table row jQuery element
     */
    function _triggerClick($row) {
        // If this row is a ile header, just select it
        if ($row.hasClass("file-section")) {
            if ($selectedRow) {
                $selectedRow.removeClass("selected");
            }
            $row.addClass("selected");
            $selectedRow = $row;
        } else {
            $row.trigger("click");
        }
        
        // Scroll to show the element at the top or bottom of the results, if needed
        var tableScroll = $searchContent.scrollTop(),
            tableHeight = $searchContent.outerHeight(),
            rowTop      = $row.offset().top + tableScroll - $searchContent.offset().top,
            rowHeight   = $row.outerHeight();
        
        if (tableScroll + tableHeight - rowHeight < rowTop) {
            $searchContent.scrollTop(rowTop - tableHeight + rowHeight);
        } else if (tableScroll > rowTop) {
            $searchContent.scrollTop(rowTop);
        }
    }
    
    /**
     * @private
     * Selects the next result in the table or the first of the next page
     */
    function _handleNextResult() {
        var $row;
        if (!$selectedRow || !$selectedRow.length) {
            $row = $searchContent.find("tr").first();
        } else {
            $row = $selectedRow.next();
            if (!$row.length) {
                _currentStart += RESULTS_PER_PAGE;
                _showSearchResults();
                $row = $searchContent.find("tr").first();
            }
        }
        _triggerClick($row);
    }
    
    /**
     * @private
     * Selects the previous result in the table or the last of the previous page
     */
    function _handlePreviousResult() {
        var $row;
        if (!$selectedRow || !$selectedRow.length) {
            $row = $searchContent.find("tr").last();
        } else {
            $row = $selectedRow.prev();
            if (!$row.length) {
                _currentStart -= RESULTS_PER_PAGE;
                _showSearchResults();
                $row = $searchContent.find("tr").last();
            }
        }
        _triggerClick($row);
    }
    
    
    
    /**
     * @private
     * Shows the search results and tryes to restore the previous scroll and selection
     */
    function _restoreSearchResults() {
        var scrollTop = $searchContent.scrollTop();
        var index     = $selectedRow ? $selectedRow.index() : null;
        
        _showSearchResults();
        
        $searchContent.scrollTop(scrollTop);
        if ($selectedRow) {
            $selectedRow = $searchContent.find("tr:eq(" + index + ")");
            $selectedRow.addClass("selected");
        }
    }
    
    /**
     * @private
     * Move the search results from the previous path to the new one and update the results list
     * @param {!$.Event} event
     * @param {!string} oldName
     * @param {!string} newName
     */
    function _fileNameChangeHandler(event, oldName, newName) {
        if ($searchResults.is(":visible")) {
            var resultsChanged = false;
            
            // Update the search results
            CollectionUtils.forEach(_searchResults, function (item, key) {
                if (key.match(oldName)) {
                    _searchResults[key.replace(oldName, newName)] = item;
                    delete _searchResults[key];
                    resultsChanged = true;
                }
            });
            
            // Restore the reesults if needed
            if (resultsChanged) {
                _sortResultFiles();
                _restoreSearchResults();
            }
        }
    }
    
    /**
     * @private
     * Update the result matches every time the content of a file changes
     * @param {!$.Event} event
     * @param {!Document} doc - The Document that changed, should be the current one
     * @param {!Object} change - A linked list as described in the Document constructor
     * @param {?boolean} resultsChanged - True when search results changed from a file change
     */
    function _fileChangeHandler(event, doc, change, resultsChanged) {
        if ($searchResults.is(":visible")) {
            var fullPath = doc.file.fullPath;
            
            // There is no from or to positions, so the entire file changed, we must search all over again
            if (!change.from || !change.to) {
                _addSearchMatches(fullPath, doc.getText(), _currentQueryExpr);
                _restoreSearchResults();
            
            } else {
                // Lests get only the lines that changed
                var i, lines = [], diff;
                for (i = 0; i < change.text.length; i++) {
                    lines.push(doc.getLine(change.from.line + i));
                }
                
                // If the change is a delete, define the lines difference as a negative value
                if (change.from.line !== change.to.line && change.text.length === 1 && !change.text[0].length) {
                    diff = change.from.line - change.to.line;
                // If the change was a replacement, define the lines difference as a positive value
                } else if (change.from.line !== change.to.line) {
                    diff = change.from.line - change.to.line;
                // If the change was an addition, define the lines difference as the lines added minus 1
                } else {
                    diff = lines.length - 1;
                }
                
                var start = 0, howMany = 0;
                if (_searchResults[fullPath]) {
                    // Lets search the last match before a replacement, the amount of matches deleted and update
                    // the lines values for all the matches after the change
                    _searchResults[fullPath].matches.forEach(function (item) {
                        if (item.end.line < change.from.line) {
                            start++;
                        } else if (item.end.line <= change.to.line) {
                            howMany++;
                        } else {
                            item.start.line += diff;
                            item.end.line   += diff;
                        }
                    });
                    
                    // Delete the lines that where deleted or replaced
                    if (howMany > 0) {
                        _searchResults[fullPath].matches.splice(start, howMany);
                    }
                    resultsChanged = true;
                }
                
                // Searches only over the lines that changed
                var matches = _getSearchMatches(lines.join("\r\n"), _currentQueryExpr);
                if (matches && matches.length) {
                    // Updates the lines, since the text didnt started on the first line
                    matches.forEach(function (value, key) {
                        matches[key].start.line += change.from.line;
                        matches[key].end.line   += change.from.line;
                    });
                    
                    // If the file index exists, add the new matches to the file at the start index found before
                    if (_searchResults[fullPath]) {
                        Array.prototype.splice.apply(_searchResults[fullPath].matches, [start, 0].concat(matches));
                    // If not, add the matches to a new file index
                    } else {
                        _searchResults[fullPath] = {
                            matches:   matches,
                            collapsed: false
                        };
                    }
                    resultsChanged = true;
                }
                
                // All the matches where deleted, remove the file from the results
                if (_searchResults[fullPath] && !_searchResults[fullPath].matches.length) {
                    delete _searchResults[fullPath];
                    resultsChanged = true;
                }
                
                // This is link to the next change objet, so we need to keep searching
                if (change.next) {
                    _fileChangeHandler(event, doc, change.next, resultsChanged);
                
                // If not we can show the results, but only if something changed
                } else if (resultsChanged) {
                    _sortResultFiles();
                    _restoreSearchResults();
                }
            }
        }
    }
    
    /**
     * @private
     * Update the results to delete the results from the deleted file
     */
    function _fileDeletedHandler() {
        if ($searchResults.is(":visible")) {
            if (_searchResults[_currentDocument.file.fullPath]) {
                delete _searchResults[_currentDocument.file.fullPath];
                
                _sortResultFiles();
                _restoreSearchResults();
            }
        }
    }
    
    /**
     * @private
     * Updates the event listeners when the current document changes
     */
    function _currentDocumentChangeHandler() {
        $(_currentDocument).off(".findInFiles");
        
        _currentDocument = DocumentManager.getCurrentDocument();
        $(_currentDocument)
            .on("change.findInFiles", _fileChangeHandler)
            .on("deleted.findInFiles", _fileDeletedHandler);
    }
    
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        $searchResults = $("#search-results");
        $searchSummary = $("#search-result-summary");
        $searchContent = $("#search-results .table-container");
    });
    
    // Initialize: register listeners
    $(DocumentManager).on("fileNameChange",        _fileNameChangeHandler);
    $(DocumentManager).on("currentDocumentChange", _currentDocumentChangeHandler);
    
    // Initialize: command handlers
    CommandManager.register(Strings.CMD_FIND_IN_FILES,       Commands.SEARCH_FIND_IN_FILES,       _handleFindInFiles);
    CommandManager.register(Strings.CMD_FIND_IN_SUBTREE,     Commands.SEARCH_FIND_IN_SUBTREE,     _handleFindInSubtree);
    CommandManager.register(Strings.CMD_FIND_IN_WORKING_SET, Commands.SEARCH_FIND_IN_WORKING_SET, _handleFindInWorkingSet);
    CommandManager.register(Strings.CMD_NEXT_RESULT,         Commands.SEARCH_NEXT_RESULT,         _handleNextResult);
    CommandManager.register(Strings.CMD_PREVIOUS_RESULT,     Commands.SEARCH_PREVIOUS_RESULT,     _handlePreviousResult);
});

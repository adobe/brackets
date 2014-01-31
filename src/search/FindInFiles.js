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
/*global define, $, window, Mustache */

/*
 * Adds a "find in files" command to allow the user to find all occurrences of a string in all files in
 * the project.
 * 
 * The keyboard shortcut is Cmd(Ctrl)-Shift-F.
 *
 * FUTURE:
 *  - Proper UI for both dialog and results
 *  - Refactor dialog class and share with Quick File Open
 *  - Search files in working set that are *not* in the project
 *  - Handle matches that span multiple lines
 *  - Refactor UI from functionality to enable unit testing
 */


define(function (require, exports, module) {
    "use strict";
    
    var _ = require("thirdparty/lodash");
    
    var Async                 = require("utils/Async"),
        Resizer               = require("utils/Resizer"),
        CommandManager        = require("command/CommandManager"),
        Commands              = require("command/Commands"),
        Strings               = require("strings"),
        StringUtils           = require("utils/StringUtils"),
        ProjectManager        = require("project/ProjectManager"),
        DocumentModule        = require("document/Document"),
        DocumentManager       = require("document/DocumentManager"),
        EditorManager         = require("editor/EditorManager"),
        FileSystem            = require("filesystem/FileSystem"),
        FileUtils             = require("file/FileUtils"),
        FileViewController    = require("project/FileViewController"),
        LanguageManager       = require("language/LanguageManager"),
        FindReplace           = require("search/FindReplace"),
        PerfUtils             = require("utils/PerfUtils"),
        InMemoryFile          = require("document/InMemoryFile"),
        PanelManager          = require("view/PanelManager"),
        KeyEvent              = require("utils/KeyEvent"),
        AppInit               = require("utils/AppInit"),
        StatusBar             = require("widgets/StatusBar"),
        ModalBar              = require("widgets/ModalBar").ModalBar;
    
    var searchDialogTemplate  = require("text!htmlContent/findinfiles-bar.html"),
        searchPanelTemplate   = require("text!htmlContent/search-panel.html"),
        searchSummaryTemplate = require("text!htmlContent/search-summary.html"),
        searchResultsTemplate = require("text!htmlContent/search-results.html");
    
    /** @const Constants used to define the maximum results show per page and found in a single file */

    var RESULTS_PER_PAGE = 100,
        FIND_IN_FILE_MAX = 300,
        UPDATE_TIMEOUT   = 400;
    
    /**
     * Map of all the last search results
     * @type {Object.<fullPath: string, {matches: Array.<Object>, collapsed: boolean}>}
     */
    var searchResults = {};
    
    /** @type {Panel} Bottom panel holding the search results. Initialized in htmlReady() */
    var searchResultsPanel;
    
    /** @type {number} The index of the first result that is displayed */
    var currentStart = 0;
    
    /** @type {string} The current search query */
    var currentQuery = "";
    
    /** @type {RegExp} The current search query regular expression */
    var currentQueryExpr = null;
    
    /** @type {Array.<File>} An array of the files where it should look or null/empty to search the entire project */
    var currentScope = null;
    
    /** @type {boolean} True if the matches in a file reached FIND_IN_FILE_MAX */
    var maxHitsFoundInFile = false;
    
    /** @type {string} The setTimeout id, used to clear it if required */
    var timeoutID = null;
    
    /** @type {$.Element} jQuery elements used in the search results */
    var $searchResults,
        $searchSummary,
        $searchContent,
        $selectedRow;
    
    /** @type {FindInFilesDialog} dialog having the modalbar for search */
    var dialog = null;
    
    /**
     * FileSystem change event handler. Updates the search results based on a changed
     * entry and optionally sets of added and removed child entries.
     * 
     * @type {function(FileSystemEntry, Array.<FileSystemEntry>=, Array.<FileSystemEntry>=)}
     **/
    var _fileSystemChangeHandler;

    /**
     * @private
     * Returns a regular expression from the given query and shows an error in the modal-bar if it was invalid
     * @param {string} query  The query from the modal-bar input
     * @return {RegExp}
     */
    function _getQueryRegExp(query) {
        $(".modal-bar .error").hide();  // Clear any pending RegEx error message
        
        if (!query) {
            return null;
        }

        var caseSensitive = $("#find-case-sensitive").is(".active");
        
        // Is it a (non-blank) regex?
        if ($("#find-regexp").is(".active")) {
            try {
                return new RegExp(query, caseSensitive ? "g" : "gi");
            } catch (e) {
                $(".modal-bar .error")
                    .show()
                    .text(e.message);
                return null;
            }
        
        } else {
            // Query is a plain string. Turn it into a regexp
            return new RegExp(StringUtils.regexEscape(query), caseSensitive ? "g" : "gi");
        }
    }
    
    /**
     * @private
     * Returns label text to indicate the search scope. Already HTML-escaped.
     * @param {?Entry} scope
     */
    function _labelForScope(scope) {
        var projName = ProjectManager.getProjectRoot().name;
        if (scope) {
            return StringUtils.format(
                Strings.FIND_IN_FILES_SCOPED,
                StringUtils.breakableUrl(
                    ProjectManager.makeProjectRelativeIfPossible(scope.fullPath)
                )
            );
        } else {
            return Strings.FIND_IN_FILES_NO_SCOPE;
        }
    }
    
    /**
     * @private
     * Hides the Search Results Panel
     */
    function _hideSearchResults() {
        if (searchResultsPanel.isVisible()) {
            searchResultsPanel.hide();
            $(DocumentModule).off(".findInFiles");
        }
        
        FileSystem.off("change", _fileSystemChangeHandler);
    }
    
    /**
     * @private
     * Searches through the contents an returns an array of matches
     * @param {string} contents
     * @param {RegExp} queryExpr
     * @return {Array.<{start: {line:number,ch:number}, end: {line:number,ch:number}, line: string}>}
     */
    function _getSearchMatches(contents, queryExpr) {
        // Quick exit if not found
        if (contents.search(queryExpr) === -1) {
            return null;
        }
        
        var match, lineNum, line, ch, matchLength,
            lines   = StringUtils.getLines(contents),
            matches = [];
        
        while ((match = queryExpr.exec(contents)) !== null) {
            lineNum     = StringUtils.offsetToLineNum(lines, match.index);
            line        = lines[lineNum];
            ch          = match.index - contents.lastIndexOf("\n", match.index) - 1;  // 0-based index
            matchLength = match[0].length;
            
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
                maxHitsFoundInFile = true;
                break;
            }
        }

        return matches;
    }
    
    /**
     * @private
     * Searches and stores the match results for the given file, if there are matches
     * @param {string} fullPath
     * @param {string} contents
     * @param {RegExp} queryExpr
     * @return {boolean} True iff matches were added to the search results
     */
    function _addSearchMatches(fullPath, contents, queryExpr) {
        var matches = _getSearchMatches(contents, queryExpr);
        
        if (matches && matches.length) {
            searchResults[fullPath] = {
                matches:   matches,
                collapsed: false
            };
            return true;
        }
        return false;
    }
    
    /**
     * @private
     * Count the total number of matches and files
     * @return {{files: number, matches: number}}
     */
    function _countFilesMatches() {
        var numFiles = 0, numMatches = 0;
        _.forEach(searchResults, function (item) {
            numFiles++;
            numMatches += item.matches.length;
        });

        return {files: numFiles, matches: numMatches};
    }
    
    /**
     * @private
     * Returns the last possible current start based on the given number of matches
     * @param {number} numMatches
     * @return {number}
     */
    function _getLastCurrentStart(numMatches) {
        return Math.floor((numMatches - 1) / RESULTS_PER_PAGE) * RESULTS_PER_PAGE;
    }
    
    /**
     * @private
     * Shows the results in a table and adds the necessary event listeners
     */
    function _showSearchResults() {
        if (!$.isEmptyObject(searchResults)) {
            var count = _countFilesMatches();
            
            // Show result summary in header
            var numMatchesStr = "";
            if (maxHitsFoundInFile) {
                numMatchesStr = Strings.FIND_IN_FILES_MORE_THAN;
            }

            // This text contains some formatting, so all the strings are assumed to be already escaped
            var summary = StringUtils.format(
                Strings.FIND_IN_FILES_TITLE_PART3,
                numMatchesStr,
                String(count.matches),
                (count.matches > 1) ? Strings.FIND_IN_FILES_MATCHES : Strings.FIND_IN_FILES_MATCH,
                count.files,
                (count.files > 1 ? Strings.FIND_IN_FILES_FILES : Strings.FIND_IN_FILES_FILE)
            );
            
            // The last result index displayed
            var last = Math.min(currentStart + RESULTS_PER_PAGE, count.matches);
            
            // Insert the search summary
            $searchSummary.html(Mustache.render(searchSummaryTemplate, {
                query:    currentQuery,
                scope:    currentScope ? "&nbsp;" + _labelForScope(currentScope) + "&nbsp;" : "",
                summary:  summary,
                hasPages: count.matches > RESULTS_PER_PAGE,
                results:  StringUtils.format(Strings.FIND_IN_FILES_PAGING, currentStart + 1, last),
                hasPrev:  currentStart > 0,
                hasNext:  last < count.matches,
                Strings:  Strings
            }));
            
            // Create the results template search list
            var searchItems, match, i,
                searchList     = [],
                matchesCounter = 0,
                showMatches    = false;
            
            _.some(searchResults, function (item, fullPath) {
                showMatches = true;
                
                // Since the amount of matches on this item plus the amount of matches we skipped until
                // now is still smaller than the first match that we want to display, skip these.
                if (matchesCounter + item.matches.length < currentStart) {
                    matchesCounter += item.matches.length;
                    showMatches = false;
                
                // If we still haven't skipped enough items to get to the first match, but adding the
                // item matches to the skipped ones is greater the the first match we want to display,
                // then we can display the matches from this item skipping the first ones
                } else if (matchesCounter < currentStart) {
                    i = currentStart - matchesCounter;
                    matchesCounter = currentStart;
                
                // If we already skipped enough matches to get to the first match to display, we can start
                // displaying from the first match of this item
                } else if (matchesCounter < last) {
                    i = 0;
                
                // We can't display more items by now. Break the loop
                } else {
                    return true;
                }
                
                if (showMatches && i < item.matches.length) {
                    // Add a row for each match in the file
                    searchItems = [];
                    
                    // Add matches until we get to the last match of this item, or filling the page
                    while (i < item.matches.length && matchesCounter < last) {
                        match = item.matches[i];
                        searchItems.push({
                            file:      searchList.length,
                            item:      searchItems.length,
                            line:      match.start.line + 1,
                            pre:       match.line.substr(0, match.start.ch),
                            highlight: match.line.substring(match.start.ch, match.end.ch),
                            post:      match.line.substr(match.end.ch),
                            start:     match.start,
                            end:       match.end
                        });
                        matchesCounter++;
                        i++;
                    }
                                                            
                    // Add a row for each file
                    var relativePath = FileUtils.getDirectoryPath(ProjectManager.makeProjectRelativeIfPossible(fullPath)),
                        directoryPath = FileUtils.getDirectoryPath(relativePath),
                        displayFileName = StringUtils.format(
                            Strings.FIND_IN_FILES_FILE_PATH,
                            StringUtils.breakableUrl(FileUtils.getBaseName(fullPath)),
                            StringUtils.breakableUrl(directoryPath),
                            directoryPath ? "&mdash;" : ""
                        );

                    searchList.push({
                        file:     searchList.length,
                        filename: displayFileName,
                        fullPath: fullPath,
                        items:    searchItems
                    });
                }
            });
            
            // Add the listeners for close, prev and next
            $searchResults
                .off(".searchList")  // Remove the old events
                .one("click.searchList", ".close", function () {
                    _hideSearchResults();
                })
                // The link to go the first page
                .one("click.searchList", ".first-page:not(.disabled)", function () {
                    currentStart = 0;
                    _showSearchResults();
                })
                // The link to go the previous page
                .one("click.searchList", ".prev-page:not(.disabled)", function () {
                    currentStart -= RESULTS_PER_PAGE;
                    _showSearchResults();
                })
                // The link to go to the next page
                .one("click.searchList", ".next-page:not(.disabled)", function () {
                    currentStart += RESULTS_PER_PAGE;
                    _showSearchResults();
                })
                // The link to go to the last page
                .one("click.searchList", ".last-page:not(.disabled)", function () {
                    currentStart = _getLastCurrentStart(count.matches);
                    _showSearchResults();
                });
            
            // Insert the search results
            $searchContent
                .empty()
                .append(Mustache.render(searchResultsTemplate, {searchList: searchList, Strings: Strings}))
                .off(".searchList")  // Remove the old events
            
                // Add the click event listener directly on the table parent
                .on("click.searchList", function (e) {
                    var $row = $(e.target).closest("tr");
                    
                    if ($row.length) {
                        if ($selectedRow) {
                            $selectedRow.removeClass("selected");
                        }
                        $row.addClass("selected");
                        $selectedRow = $row;
                        
                        var searchItem = searchList[$row.data("file")],
                            fullPath   = searchItem.fullPath;
                        
                        // This is a file title row, expand/collapse on click
                        if ($row.hasClass("file-section")) {
                            var $titleRows,
                                collapsed = !searchResults[fullPath].collapsed;
                            
                            if (e.metaKey || e.ctrlKey) { //Expand all / Collapse all
                                $titleRows = $(e.target).closest("table").find(".file-section");
                            } else {
                                // Clicking the file section header collapses/expands result rows for that file
                                $titleRows = $row;
                            }
                            
                            $titleRows.each(function () {
                                fullPath   = searchList[$(this).data("file")].fullPath;
                                searchItem = searchResults[fullPath];

                                if (searchItem.collapsed !== collapsed) {
                                    searchItem.collapsed = collapsed;
                                    $(this).nextUntil(".file-section").toggle();
                                    $(this).find(".disclosure-triangle").toggleClass("expanded").toggleClass("collapsed");
                                }
                            });
                            
                            //In Expand/Collapse all, reset all search results 'collapsed' flag to same value(true/false).
                            if (e.metaKey || e.ctrlKey) {
                                _.forEach(searchResults, function (item) {
                                    item.collapsed = collapsed;
                                });
                            }
                        // This is a file row, show the result on click
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
                })
                // Add the file to the working set on double click
                .on("dblclick.searchList", "tr:not(.file-section)", function (e) {
                    var item = searchList[$(this).data("file")];
                    FileViewController.addToWorkingSetAndSelect(item.fullPath);
                })
                // Restore the collapsed files
                .find(".file-section").each(function () {
                    var fullPath = searchList[$(this).data("file")].fullPath;
                    
                    if (searchResults[fullPath].collapsed) {
                        searchResults[fullPath].collapsed = false;
                        $(this).trigger("click");
                    }
                });
            
            if ($selectedRow) {
                $selectedRow.removeClass("selected");
                $selectedRow = null;
            }
            searchResultsPanel.show();
            $searchContent.scrollTop(0); // Otherwise scroll pos from previous contents is remembered

            if (dialog) {
                dialog._close();
            }
            
            FileSystem.on("change", _fileSystemChangeHandler);
        } else {

            _hideSearchResults();

            if (dialog) {
                dialog.getDialogTextField().addClass("no-results")
                                            .removeAttr("disabled")
                                            .get(0).select();
                $(".modal-bar .no-results-message").show();
            }
        }
    }
    
    /**
     * @private
     * Shows the search results and tries to restore the previous scroll and selection
     */
    function _restoreSearchResults() {
        if (searchResultsPanel.isVisible()) {
            var scrollTop  = $searchContent.scrollTop(),
                index      = $selectedRow ? $selectedRow.index() : null,
                numMatches = _countFilesMatches().matches;
            
            if (currentStart > numMatches) {
                currentStart = _getLastCurrentStart(numMatches);
            }
            _showSearchResults();
            
            $searchContent.scrollTop(scrollTop);
            if (index) {
                $selectedRow = $searchContent.find("tr:eq(" + index + ")");
                $selectedRow.addClass("selected");
            }
        }
    }
    
    /**
     * @private
     * Update the search results using the given list of changes fr the given document
     * @param {Document} doc  The Document that changed, should be the current one
     * @param {{from: {line:number,ch:number}, to: {line:number,ch:number}, text: string, next: change}} change
     *      A linked list as described in the Document constructor
     * @param {boolean} resultsChanged  True when the search results changed from a file change
     */
    function _updateSearchResults(doc, change, resultsChanged) {
        var i, diff, matches,
            fullPath = doc.file.fullPath,
            lines    = [],
            start    = 0,
            howMany  = 0;
            
        // There is no from or to positions, so the entire file changed, we must search all over again
        if (!change.from || !change.to) {
            _addSearchMatches(fullPath, doc.getText(), currentQueryExpr);
            resultsChanged = true;
        
        } else {
            // Get only the lines that changed
            for (i = 0; i < change.text.length; i++) {
                lines.push(doc.getLine(change.from.line + i));
            }
            
            // We need to know how many lines changed to update the rest of the lines
            if (change.from.line !== change.to.line) {
                diff = change.from.line - change.to.line;
            } else {
                diff = lines.length - 1;
            }
            
            if (searchResults[fullPath]) {
                // Search the last match before a replacement, the amount of matches deleted and update
                // the lines values for all the matches after the change
                searchResults[fullPath].matches.forEach(function (item) {
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
                    searchResults[fullPath].matches.splice(start, howMany);
                }
                resultsChanged = true;
            }
            
            // Searches only over the lines that changed
            matches = _getSearchMatches(lines.join("\r\n"), currentQueryExpr);
            if (matches && matches.length) {
                // Updates the line numbers, since we only searched part of the file
                matches.forEach(function (value, key) {
                    matches[key].start.line += change.from.line;
                    matches[key].end.line   += change.from.line;
                });
                
                // If the file index exists, add the new matches to the file at the start index found before
                if (searchResults[fullPath]) {
                    Array.prototype.splice.apply(searchResults[fullPath].matches, [start, 0].concat(matches));
                // If not, add the matches to a new file index
                } else {
                    searchResults[fullPath] = {
                        matches:   matches,
                        collapsed: false
                    };
                }
                resultsChanged = true;
            }
            
            // All the matches where deleted, remove the file from the results
            if (searchResults[fullPath] && !searchResults[fullPath].matches.length) {
                delete searchResults[fullPath];
                resultsChanged = true;
            }
            
            // This is link to the next change object, so we need to keep searching
            if (change.next) {
                return _updateSearchResults(doc, change.next, resultsChanged);
            }
        }
        return resultsChanged;
    }

    /**
     * @private
     * @param {!File} file File in question
     * @param {?Entry} scope Search scope, or null if whole project
     * @return {boolean}
     */
    function _inScope(file, scope) {
        if (scope) {
            if (scope.isDirectory) {
                // Dirs always have trailing slash, so we don't have to worry about being
                // a substring of another dir name
                return file.fullPath.indexOf(scope.fullPath) === 0;
            } else {
                return file.fullPath === scope.fullPath;
            }
        }
        return true;
    }

    /**
     * @private
     * Tries to update the search result on document changes
     * @param {$.Event} event
     * @param {Document} document
     * @param {{from: {line:number,ch:number}, to: {line:number,ch:number}, text: string, next: change}} change
     *      A linked list as described in the Document constructor
     */
    function _documentChangeHandler(event, document, change) {
        if (searchResultsPanel.isVisible() && _inScope(document.file, currentScope)) {
            var updateResults = _updateSearchResults(document, change, false);
            
            if (timeoutID) {
                window.clearTimeout(timeoutID);
                updateResults = true;
            }
            if (updateResults) {
                timeoutID = window.setTimeout(function () {
                    _restoreSearchResults();
                    timeoutID = null;
                }, UPDATE_TIMEOUT);
            }
        }
    }
    
    function _doSearchInOneFile(addMatches, file) {
        var result = new $.Deferred();
                    
        if (!_inScope(file, currentScope)) {
            result.resolve();
        } else {
            DocumentManager.getDocumentText(file)
                .done(function (text) {
                    addMatches(file.fullPath, text, currentQueryExpr);
                })
                .always(function () {
                    // Always resolve. If there is an error, this file
                    // is skipped and we move on to the next file.
                    result.resolve();
                });
        }
        return result.promise();
    }

    /**
     * Used to filter out image files when building a list of file in which to
     * search. Ideally this would filter out ALL binary files.
     * @private
     * @param {FileSystemEntry} entry The entry to test
     * @return {boolean} Whether or not the entry's contents should be searched
     */
    function _findInFilesFilter(entry) {
        var language = LanguageManager.getLanguageForPath(entry.fullPath);
        return !language.isBinary();
    }
    
    /**
     * @private
     * Executes the Find in Files search inside the 'currentScope'
     * @param {string} query String to be searched
     */
    function _doSearch(query) {
        currentQuery     = query;
        currentQueryExpr = _getQueryRegExp(query);
        
        if (!currentQueryExpr) {
            StatusBar.hideBusyIndicator();
            dialog._close();
            return;
        }
        
        var scopeName = currentScope ? currentScope.fullPath : ProjectManager.getProjectRoot().fullPath,
            perfTimer = PerfUtils.markStart("FindIn: " + scopeName + " - " + query);
        
        ProjectManager.getAllFiles(_findInFilesFilter, true)
            .then(function (fileListResult) {
                var doSearch = _doSearchInOneFile.bind(undefined, _addSearchMatches);
                return Async.doInParallel(fileListResult, doSearch);
            })
            .done(function () {
                // Done searching all files: show results
                _showSearchResults();
                StatusBar.hideBusyIndicator();
                PerfUtils.addMeasurement(perfTimer);
                $(DocumentModule).on("documentChange.findInFiles", _documentChangeHandler);
            })
            .fail(function (err) {
                console.log("find in files failed: ", err);
                StatusBar.hideBusyIndicator();
                PerfUtils.finalizeMeasurement(perfTimer);
            });
    }
    
    
    // This dialog class was mostly copied from QuickOpen. We should have a common dialog
    // class that everyone can use.
    
    /**
     * FindInFilesDialog class
     * @constructor
     */
    function FindInFilesDialog() {
        this.closed = false;
    }

    /**
     * Returns the input text field of the modalbar in the dialog
     * @return jQuery Object pointing to input text field
     */
    FindInFilesDialog.prototype.getDialogTextField = function () {
        return $("input[type='text']", this.modalBar.getRoot());
    };


    /**
     * Closes the search dialog and resolves the promise that showDialog returned.
     * @param {boolean=} suppressAnimation Used to hide the search bar immediately, when another
     *      one is synchronously about to be shown.
     */
    FindInFilesDialog.prototype._close = function (suppressAnimation) {
        if (this.closed) {
            return;
        }
        
        // Hide error popup, since it hangs down low enough to make the slide-out look awkward
        $(".modal-bar .error").hide();
        
        this.closed = true;
        this.modalBar.close(true, !suppressAnimation);
        EditorManager.focusEditor();
        dialog = null;
    };
    
    /**
     * Shows the search dialog
     * @param {string=} initialString  Default text to prepopulate the search field with
     * @param {Entry=} scope  Search scope, or null to search whole project
     * @returns {$.Promise} that is resolved with the string to search for
     */
    FindInFilesDialog.prototype.showDialog = function (initialString, scope) {
        // Note the prefix label is a simple "Find:" - the "in ..." part comes after the text field
        var templateVars = {
                value: initialString || "",
                label: _labelForScope(scope)
            },
            dialogHTML = Mustache.render(searchDialogTemplate, $.extend(templateVars, Strings)),
            that       = this;
        
        // Synchronously close Find/Replace bar first, if open (TODO: remove once #6203 fixed)
        // (Any previous open FindInFiles bar instance was already handled by our caller)
        FindReplace._closeFindBar();
        
        this.modalBar    = new ModalBar(dialogHTML, false);
        
        var $searchField = $("input#find-what");
        
        function handleQueryChange() {
            // Check the query expression on every input event. This way the user is alerted
            // to any RegEx syntax errors immediately.
            var query = _getQueryRegExp($searchField.val());
            
            // Clear any no-results indicator since query has changed
            // But input field may still have error style if its content is an invalid regexp
            that.getDialogTextField().toggleClass("no-results", Boolean($searchField.val() && query === null));
            $(".modal-bar .no-results-message").hide();
        }
        
        $searchField.get(0).select();
        $searchField
            .bind("keydown", function (event) {
                if (event.keyCode === KeyEvent.DOM_VK_RETURN || event.keyCode === KeyEvent.DOM_VK_ESCAPE) {  // Enter/Return key or Esc key
                    event.stopPropagation();
                    event.preventDefault();
                    
                    var query = $searchField.val();
                    
                    if (event.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                        that._close();
                    } else if (event.keyCode === KeyEvent.DOM_VK_RETURN) {
                        StatusBar.showBusyIndicator(true);
                        that.getDialogTextField().attr("disabled", "disabled");
                        _doSearch(query);
                    }
                }
            })
            .bind("input", handleQueryChange)
            .blur(function () {
                if (that.getDialogTextField().attr("disabled")) {
                    return;
                }
                that._close();
            })
            .focus();
        
        this.modalBar.getRoot().on("click", "#find-case-sensitive, #find-regexp", function (e) {
            $(e.currentTarget).toggleClass('active');
            FindReplace._updatePrefsFromSearchBar();
            
            handleQueryChange();  // re-validate regexp if needed
        });
        
        // Initial UI state (including prepopulated initialString passed into template)
        FindReplace._updateSearchBarFromPrefs();
        handleQueryChange();
    };

    /**
     * @private
     * Displays a non-modal embedded dialog above the code mirror editor that allows the user to do
     * a find operation across all files in the project.
     * @param {?Entry} scope  Project file/subfolder to search within; else searches whole project.
     */
    function _doFindInFiles(scope) {
        // If the scope is a file with a custom viewer, then we
        // don't show find in files dialog.
        if (scope && EditorManager.getCustomViewerForPath(scope.fullPath)) {
            return;
        }
        
        if (scope instanceof InMemoryFile) {
            CommandManager.execute(Commands.FILE_OPEN, { fullPath: scope.fullPath }).done(function () {
                CommandManager.execute(Commands.EDIT_FIND);
            });
            return;
        }
        
        // Default to searching for the current selection
        var currentEditor = EditorManager.getActiveEditor(),
            initialString = currentEditor && currentEditor.getSelectedText();

        if (dialog && !dialog.closed && dialog.hasOwnProperty("modalBar") && dialog.modalBar) {
            // The modalBar was already up. When creating the new modalBar, copy the
            // current query instead of using the passed-in selected text.
            initialString = dialog.getDialogTextField().val();
            dialog._close(true);
        }

        dialog             = new FindInFilesDialog();
        searchResults      = {};
        currentStart       = 0;
        currentQuery       = "";
        currentQueryExpr   = null;
        currentScope       = scope;
        maxHitsFoundInFile = false;
                            
        dialog.showDialog(initialString, scope);
    }
    
    /**
     * @private
     * Search within the file/subtree defined by the sidebar selection
     */
    function _doFindInSubtree() {
        var selectedEntry = ProjectManager.getSelectedItem();
        _doFindInFiles(selectedEntry);
    }
    
    
    /**
     * @private
     * Moves the search results from the previous path to the new one and updates the results list, if required
     * @param {$.Event} event
     * @param {string} oldName
     * @param {string} newName
     */
    function _fileNameChangeHandler(event, oldName, newName) {
        var resultsChanged = false;
        
        if (searchResultsPanel.isVisible()) {
            // Update the search results
            _.forEach(searchResults, function (item, fullPath) {
                if (fullPath.match(oldName)) {
                    searchResults[fullPath.replace(oldName, newName)] = item;
                    delete searchResults[fullPath];
                    resultsChanged = true;
                }
            });
            
            // Restore the results if needed
            if (resultsChanged) {
                _restoreSearchResults();
            }
        }
    }
    
    /**
     * @private
     * Handle a FileSystem "change" event
     * @param {$.Event} event
     * @param {FileSystemEntry} entry
     * @param {Array.<FileSystemEntry>=} added Added children
     * @param {Array.<FileSystemEntry>=} removed Removed children
     */
    _fileSystemChangeHandler = function (event, entry, added, removed) {
        var resultsChanged = false;

        /*
         * Remove existing search results that match the given entry's path
         * @param {File|Directory}
         */
        function _removeSearchResultsForEntry(entry) {
            Object.keys(searchResults).forEach(function (fullPath) {
                if (fullPath.indexOf(entry.fullPath) === 0) {
                    delete searchResults[fullPath];
                    resultsChanged = true;
                }
            });
        }
    
        /*
         * Add new search results for this entry and all of its children
         * @param {File|Directory}
         * @param {jQuery.Promise} Resolves when the results have been added
         */
        function _addSearchResultsForEntry(entry) {
            var addedFiles = [],
                deferred = new $.Deferred();
            
            var doSearch = _doSearchInOneFile.bind(undefined, function () {
                if (_addSearchMatches.apply(undefined, arguments)) {
                    resultsChanged = true;
                }
            });
            
            // gather up added files
            var visitor = function (child) {
                if (ProjectManager.shouldShow(child)) {
                    if (child.isFile) {
                        addedFiles.push(child);
                    }
                    return true;
                }
                return false;
            };
    
            entry.visit(visitor, function (err) {
                if (err) {
                    deferred.reject(err);
                    return;
                }
                
                // find additional matches in all added files
                Async.doInParallel(addedFiles, doSearch).always(deferred.resolve);
            });
    
            return deferred.promise();
        }
        
        if (!entry) {
            // TODO: re-execute the search completely?
            return;
        }
        
        var addPromise;
        if (entry.isDirectory) {
            if (!added || !removed) {
                // If the added or removed sets are null, we should redo the
                // search for the entire directory
                _removeSearchResultsForEntry(entry);
                
                var deferred = $.Deferred();
                addPromise = deferred.promise();
                entry.getContents(function (err, entries) {
                    Async.doInParallel(entries, _addSearchResultsForEntry).always(deferred.resolve);
                });
            } else {
                removed.forEach(_removeSearchResultsForEntry);
                addPromise = Async.doInParallel(added, _addSearchResultsForEntry);
            }
        } else { // entry.isFile
            _removeSearchResultsForEntry(entry);
            addPromise = _addSearchResultsForEntry(entry);
        }
        
        addPromise.always(function () {
            // Restore the results if needed
            if (resultsChanged) {
                _restoreSearchResults();
            }
        });

    };
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        var panelHtml = Mustache.render(searchPanelTemplate, Strings);
        searchResultsPanel = PanelManager.createBottomPanel("find-in-files.results", $(panelHtml), 100);
        
        $searchResults = $("#search-results");
        $searchSummary = $searchResults.find(".title");
        $searchContent = $("#search-results .table-container");
    });
    
    // Initialize: register listeners
    $(DocumentManager).on("fileNameChange",    _fileNameChangeHandler);
    $(ProjectManager).on("beforeProjectClose", _hideSearchResults);
    
    FindReplace._registerFindInFilesCloser(function () {
        if (dialog) {
            dialog._close(true);
        }
    });
    
    // Initialize: command handlers
    CommandManager.register(Strings.CMD_FIND_IN_FILES,   Commands.EDIT_FIND_IN_FILES,   _doFindInFiles);
    CommandManager.register(Strings.CMD_FIND_IN_SUBTREE, Commands.EDIT_FIND_IN_SUBTREE, _doFindInSubtree);
});

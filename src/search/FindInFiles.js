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
        LanguageManager       = require("language/LanguageManager"),
        FindReplace           = require("search/FindReplace"),
        SearchResults         = require("search/SearchResults").SearchResults,
        PerfUtils             = require("utils/PerfUtils"),
        InMemoryFile          = require("document/InMemoryFile"),
        KeyEvent              = require("utils/KeyEvent"),
        AppInit               = require("utils/AppInit"),
        StatusBar             = require("widgets/StatusBar"),
        ModalBar              = require("widgets/ModalBar").ModalBar,
        _                     = require("thirdparty/lodash");
    
    var searchDialogTemplate  = require("text!htmlContent/findinfiles-bar.html"),
        searchSummaryTemplate = require("text!htmlContent/search-summary-find.html");
    
    
    /** @const Constants used to define the maximum results show per page and found in a single file */
    var FIND_IN_FILE_MAX = 300,
        UPDATE_TIMEOUT   = 400;
    
    /** @type {FindInFilesResults} The find in files results. Initialized in htmlReady() */
    var findInFilesResults;
    
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
    
    /** @type {FindInFilesDialog} dialog having the modalbar for search */
    var dialog = null;
    
    
    
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
     * @return {string}
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
     * @private
     * Used to filter out image files when building a list of file in which to
     * search. Ideally this would filter out ALL binary files.
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
                var doSearch = _doSearchInOneFile.bind(undefined, findInFilesResults._addSearchMatches.bind(findInFilesResults));
                return Async.doInParallel(fileListResult, doSearch);
            })
            .done(function () {
                // Done searching all files: show results
                findInFilesResults.showResults();
                StatusBar.hideBusyIndicator();
                PerfUtils.addMeasurement(perfTimer);
                $(DocumentModule).on("documentChange.findInFiles", findInFilesResults._documentChangeHandler.bind(findInFilesResults));
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
        currentQuery       = "";
        currentQueryExpr   = null;
        currentScope       = scope;
        maxHitsFoundInFile = false;
        
        findInFilesResults.initializeResults();
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
     * @constructor
     * @extends {SearchResults}
     * Handles the Find in Files Results and the Results Panel
     */
    function FindInFilesResults() {
        this.summaryTemplate = searchSummaryTemplate;
        this.createPanel("findInFilesResults", "find-in-files.results");
    }
    
    FindInFilesResults.prototype = Object.create(SearchResults.prototype);
    FindInFilesResults.prototype.constructor = FindInFilesResults;
    FindInFilesResults.prototype.parentClass = SearchResults.prototype;
    
    /**
     * Hides the Search Results Panel
     */
    FindInFilesResults.prototype.hideResults = function () {
        var self = this;
        if (this.panel.isVisible()) {
            this.panel.hide();
            $(DocumentModule).off(".findInFiles");
        }
        
        FileSystem.off("change", function () { self._fileSystemChangeHandler(); });
    };
    
    /**
     * @private
     * Shows the results in a table and adds the necessary event listeners
     */
    FindInFilesResults.prototype.showResults = function () {
        if (!$.isEmptyObject(this.searchResults)) {
            var count = this._countFilesMatches(),
                self  = this;
            
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
            
            // Insert the search summary
            this._showSummary({
                query:   currentQuery,
                scope:   currentScope ? "&nbsp;" + _labelForScope(currentScope) + "&nbsp;" : "",
                summary: summary
            });
            
            // Create the results template search list
            this._showResultsList();
            
            if (dialog) {
                dialog._close();
            }
            
            FileSystem.on("change", function () { self._fileSystemChangeHandler(); });
        
        } else {
            this.hideResults();

            if (dialog) {
                dialog.getDialogTextField()
                    .addClass("no-results")
                    .removeAttr("disabled")
                    .get(0).select();
                $(".modal-bar .no-results-message").show();
            }
        }
    };
    
    /**
     * @private
     * Searches through the contents an returns an array of matches
     * @param {string} contents
     * @param {RegExp} queryExpr
     * @return {Array.<{start: {line:number,ch:number}, end: {line:number,ch:number}, line: string}>}
     */
    FindInFilesResults.prototype._getSearchMatches = function (contents, queryExpr) {
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
    };
    
    /**
     * @private
     * Searches and stores the match results for the given file, if there are matches
     * @param {string} fullPath
     * @param {string} contents
     * @param {RegExp} queryExpr
     * @return {boolean} True iff the matches were added to the search results
     */
    FindInFilesResults.prototype._addSearchMatches = function (fullPath, contents, queryExpr) {
        var matches = this._getSearchMatches(contents, queryExpr);
        
        if (matches && matches.length) {
            this.addResultMatches(fullPath, matches);
            return true;
        }
        return false;
    };
    
    
    
    /**
     * @private
     * Tries to update the search result on document changes
     * @param {$.Event} event
     * @param {Document} document
     * @param {{from: {line:number,ch:number}, to: {line:number,ch:number}, text: string, next: change}} change
     *      A linked list as described in the Document constructor
     */
    FindInFilesResults.prototype._documentChangeHandler = function (event, document, change) {
        var self = this;
        if (this.panel.isVisible() && _inScope(document.file, currentScope)) {
            var updateResults = this._updateResults(document, change, false);
            
            if (timeoutID) {
                window.clearTimeout(timeoutID);
                updateResults = true;
            }
            if (updateResults) {
                timeoutID = window.setTimeout(function () {
                    self.restoreResults();
                    timeoutID = null;
                }, UPDATE_TIMEOUT);
            }
        }
    };
    
    /**
     * @private
     * Update the search results using the given list of changes fr the given document
     * @param {Document} doc  The Document that changed, should be the current one
     * @param {{from: {line:number,ch:number}, to: {line:number,ch:number}, text: string, next: change}} change
     *      A linked list as described in the Document constructor
     * @param {boolean} resultsChanged  True when the search results changed from a file change
     */
    FindInFilesResults.prototype._updateResults = function (doc, change, resultsChanged) {
        var i, diff, matches,
            fullPath = doc.file.fullPath,
            lines    = [],
            start    = 0,
            howMany  = 0;
            
        // There is no from or to positions, so the entire file changed, we must search all over again
        if (!change.from || !change.to) {
            this._addSearchMatches(fullPath, doc.getText(), currentQueryExpr);
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
            
            if (this.searchResults[fullPath]) {
                // Search the last match before a replacement, the amount of matches deleted and update
                // the lines values for all the matches after the change
                this.searchResults[fullPath].matches.forEach(function (item) {
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
                    this.searchResults[fullPath].matches.splice(start, howMany);
                }
                resultsChanged = true;
            }
            
            // Searches only over the lines that changed
            matches = this._getSearchMatches(lines.join("\r\n"), currentQueryExpr);
            if (matches && matches.length) {
                // Updates the line numbers, since we only searched part of the file
                matches.forEach(function (value, key) {
                    matches[key].start.line += change.from.line;
                    matches[key].end.line   += change.from.line;
                });
                
                // If the file index exists, add the new matches to the file at the start index found before
                if (this.searchResults[fullPath]) {
                    Array.prototype.splice.apply(this.searchResults[fullPath].matches, [start, 0].concat(matches));
                // If not, add the matches to a new file index
                } else {
                    this.addResultMatches(fullPath, matches);
                }
                resultsChanged = true;
            }
            
            // All the matches where deleted, remove the file from the results
            if (this.searchResults[fullPath] && !this.searchResults[fullPath].matches.length) {
                delete this.searchResults[fullPath];
                resultsChanged = true;
            }
            
            // This is link to the next change object, so we need to keep searching
            if (change.next) {
                return this._updateResults(doc, change.next, resultsChanged);
            }
        }
        return resultsChanged;
    };
    
    
    /**
     * @private
     * Moves the search results from the previous path to the new one and updates the results list, if required
     * @param {$.Event} event
     * @param {string} oldName
     * @param {string} newName
     */
    FindInFilesResults.prototype._fileNameChangeHandler = function (event, oldName, newName) {
        var resultsChanged = false,
            self           = this;
        
        if (this.panel.isVisible()) {
            // Update the search results
            _.forEach(this.searchResults, function (item, fullPath) {
                if (fullPath.match(oldName)) {
                    self.searchResults[fullPath.replace(oldName, newName)] = item;
                    delete self.searchResults[fullPath];
                    resultsChanged = true;
                }
            });
            
            // Restore the results if needed
            if (resultsChanged) {
                this.restoreResults();
            }
        }
    };
    
    /**
     * @private
     * Handle a FileSystem "change" event
     * @param {$.Event} event
     * @param {FileSystemEntry} entry
     * @param {Array.<FileSystemEntry>=} added Added children
     * @param {Array.<FileSystemEntry>=} removed Removed children
     */
    FindInFilesResults.prototype._fileSystemChangeHandler = function (event, entry, added, removed) {
        var resultsChanged = false,
            self           = this;

        /*
         * Remove existing search results that match the given entry's path
         * @param {(File|Directory)} entry
         */
        function _removeSearchResultsForEntry(entry) {
            Object.keys(self.searchResults).forEach(function (fullPath) {
                if (fullPath.indexOf(entry.fullPath) === 0) {
                    delete self.searchResults[fullPath];
                    resultsChanged = true;
                }
            });
        }
    
        /*
         * Add new search results for this entry and all of its children
         * @param {(File|Directory)} entry
         * @return {jQuery.Promise} Resolves when the results have been added
         */
        function _addSearchResultsForEntry(entry) {
            var addedFiles = [],
                deferred = new $.Deferred();
            
            var doSearch = _doSearchInOneFile.bind(undefined, function () {
                if (self._addSearchMatches(entry)) {
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
                self.restoreResults();
            }
        });
    };
    
    
    
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        findInFilesResults = new FindInFilesResults();
    });
    
    // Initialize: register listeners
    $(DocumentManager).on("fileNameChange",    function () { findInFilesResults._fileNameChangeHandler(); });
    $(ProjectManager).on("beforeProjectClose", function () { findInFilesResults.hideResults(); });
    
    FindReplace._registerFindInFilesCloser(function () {
        if (dialog) {
            dialog._close(true);
        }
    });
    
    // Initialize: command handlers
    CommandManager.register(Strings.CMD_FIND_IN_FILES,   Commands.EDIT_FIND_IN_FILES,   _doFindInFiles);
    CommandManager.register(Strings.CMD_FIND_IN_SUBTREE, Commands.EDIT_FIND_IN_SUBTREE, _doFindInSubtree);
});

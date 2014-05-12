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
    
    var _                     = require("thirdparty/lodash"),
        FileFilters           = require("search/FileFilters"),
        Async                 = require("utils/Async"),
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
        LanguageManager       = require("language/LanguageManager"),
        SearchResultsView     = require("search/SearchResultsView").SearchResultsView,
        SearchModel           = require("search/SearchModel").SearchModel,
        PerfUtils             = require("utils/PerfUtils"),
        InMemoryFile          = require("document/InMemoryFile"),
        AppInit               = require("utils/AppInit"),
        StatusBar             = require("widgets/StatusBar"),
        FindBar               = require("search/FindBar").FindBar,
        FindUtils             = require("search/FindUtils"),
        CodeMirror            = require("thirdparty/CodeMirror2/lib/codemirror"),
        Dialogs               = require("widgets/Dialogs"),
        DefaultDialogs        = require("widgets/DefaultDialogs");
    
    /** @const Constants used to define the maximum results show per page and found in a single file */
    var FIND_IN_FILE_MAX = 300,
        MAX_IN_MEMORY    = 20; // maximum number of files to do replacements in-memory instead of on disk
    
    /** @const @type {!Object} Token used to indicate a specific reason for zero search results */
    var ZERO_FILES_TO_SEARCH = {};
    
    /** @type {SearchModel} The search query and results model. */
    var searchModel;
    
    /** @type {FindInFilesResults} The find in files results. Initialized in htmlReady() */
    var findInFilesResults;
    
    /** @type {FindBar} Find bar containing the search UI. */
    var findBar = null;
    
    /**
     * Checks that the file matches the given subtree scope. To fully check whether the file
     * should be in the search set, use _inSearchScope() instead - a supserset of this.
     * 
     * @param {!File} file
     * @param {?FileSystemEntry} scope Search scope, or null if whole project
     * @return {boolean}
     */
    function _subtreeFilter(file, scope) {
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
     * Filters out files that are known binary types.
     * @param {string} fullPath
     * @return {boolean} True if the file's contents can be read as text
     */
    function _isReadableText(fullPath) {
        return !LanguageManager.getLanguageForPath(fullPath).isBinary();
    }
    
    /**
     * Finds all candidate files to search in the given scope's subtree that are not binary content. Does NOT apply
     * the current filter yet.
     */
    function getCandidateFiles(scope) {
        function filter(file) {
            return _subtreeFilter(file, scope) && _isReadableText(file.fullPath);
        }
        
        // If the scope is a single file, just check if the file passes the filter directly rather than
        // trying to use ProjectManager.getAllFiles(), both for performance and because an individual
        // in-memory file might be an untitled document or external file that doesn't show up in
        // getAllFiles().
        if (scope && scope.isFile) {
            return new $.Deferred().resolve(filter(scope) ? [scope] : []).promise();
        } else {
            return ProjectManager.getAllFiles(filter, true);
        }
    }
    
    /**
     * Checks that the file is eligible for inclusion in the search (matches the user's subtree scope and
     * file exclusion filters, and isn't binary). Used when updating results incrementally - during the
     * initial search, these checks are done in bulk via getCandidateFiles() and the filterFileList() call
     * after it.
     * @param {!File} file
     * @return {boolean}
     */
    function _inSearchScope(file) {
        // Replicate the checks getCandidateFiles() does
        if (searchModel && searchModel.scope) {
            if (!_subtreeFilter(file, searchModel.scope)) {
                return false;
            }
        } else {
            // Still need to make sure it's within project or working set
            // In getCandidateFiles(), this is covered by the baseline getAllFiles() itself
            if (file.fullPath.indexOf(ProjectManager.getProjectRoot().fullPath) !== 0) {
                var inWorkingSet = DocumentManager.getWorkingSet().some(function (wsFile) {
                    return wsFile.fullPath === file.fullPath;
                });
                if (!inWorkingSet) {
                    return false;
                }
            }
        }

        if (!_isReadableText(file.fullPath)) {
            return false;
        }
        
        // Replicate the filtering filterFileList() does
        return FileFilters.filterPath(searchModel.filter, file.fullPath);
    }

    
    /**
     * @private
     * Finds search results in the given file and adds them to 'searchResults.' Resolves with
     * true if any matches found, false if none found. Errors reading the file are treated the
     * same as if no results found.
     * 
     * Does not perform any filtering - assumes caller has already vetted this file as a search
     * candidate.
     * 
     * @param {!File} file
     * @return {$.Promise}
     */
    function _doSearchInOneFile(file) {
        var result = new $.Deferred();
        
        DocumentManager.getDocumentText(file)
            .done(function (text, timestamp) {
                // Note that we don't fire a model change here, since this is always called by some outer batch
                // operation that will fire it once it's done.
                var foundMatches = findInFilesResults._addSearchMatches(file.fullPath, text, searchModel.queryExpr, timestamp);
                result.resolve(foundMatches);
            })
            .fail(function () {
                // Always resolve. If there is an error, this file
                // is skipped and we move on to the next file.
                result.resolve();
            });
        
        return result.promise();
    }
    
    /**
     * @private
     * Executes the Find in Files search inside the current scope.
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo Query info object, as returned by FindBar.getQueryInfo()
     * @param {!$.Promise} candidateFilesPromise Promise from getCandidateFiles(), which was called earlier
     * @param {?string} filter A "compiled" filter as returned by FileFilters.compile(), or null for no filter
     * @return {?$.Promise} A promise that's resolved with the search results or rejected when the find competes. Will be null if the query
     *      is invalid.
     */
    function _doSearch(queryInfo, candidateFilesPromise, filter) {
        searchModel.filter = filter;

        var queryResult = searchModel.setQueryInfo(queryInfo);
        if (!queryResult.valid) {
            StatusBar.hideBusyIndicator();
            if (findBar && !queryResult.empty) {
                findBar.close();
            }
            return null;
        }
        
        var scopeName = searchModel.scope ? searchModel.scope.fullPath : ProjectManager.getProjectRoot().fullPath,
            perfTimer = PerfUtils.markStart("FindIn: " + scopeName + " - " + queryInfo.query),
            deferred = new $.Deferred();
        
        candidateFilesPromise
            .then(function (fileListResult) {
                // Filter out files/folders that match user's current exclusion filter
                fileListResult = FileFilters.filterFileList(filter, fileListResult);
                
                if (fileListResult.length) {
                    return Async.doInParallel(fileListResult, _doSearchInOneFile);
                } else {
                    return ZERO_FILES_TO_SEARCH;
                }
            })
            .done(function (zeroFilesToken) {
                // Done searching all files: show results
                exports._searchDone = true; // for unit tests
                
                if (searchModel.hasResults()) {
                    findInFilesResults.showResults();

                    if (findBar) {
                        findBar.close();
                    }

                } else {
                    findInFilesResults.hideResults();

                    if (findBar) {
                        var showMessage = false;
                        findBar.enable(true);
                        findBar.focusQuery();
                        if (zeroFilesToken === ZERO_FILES_TO_SEARCH) {
                            findBar.showError(StringUtils.format(Strings.FIND_IN_FILES_ZERO_FILES, FindUtils.labelForScope(searchModel.scope)), true);
                        } else {
                            showMessage = true;
                        }
                        findBar.showNoResults(true, showMessage);
                    }
                }

                StatusBar.hideBusyIndicator();
                PerfUtils.addMeasurement(perfTimer);
                
                // Listen for FS & Document changes to keep results up to date
                findInFilesResults.addListeners();
                
                deferred.resolve(searchModel.results);
            })
            .fail(function (err) {
                console.log("find in files failed: ", err);
                StatusBar.hideBusyIndicator();
                PerfUtils.finalizeMeasurement(perfTimer);
                deferred.reject();
            });
        
        return deferred.promise();
    }
    
    /**
     * @private
     * Clears any previous search information in preparation for starting a new search in the given scope.
     * @param {?Entry} scope Project file/subfolder to search within; else searches whole project.
     */
    function _resetSearch(scope) {
        searchModel.clear();
        searchModel.scope = scope;
        findInFilesResults.initializeResults();
    }
    
    /**
     * Does a search in the given scope with the given filter. Used when you want to start a search
     * programmatically. Shows the result list once the search is complete.
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo Query info object, as returned by FindBar.getQueryInfo()
     * @param {?Entry} scope Project file/subfolder to search within; else searches whole project.
     * @param {?string} filter A "compiled" filter as returned by FileFilters.compile(), or null for no filter
     * @param {?string} replaceText If this is a replacement, the text to replace matches with.
     * @return {$.Promise} A promise that's resolved with the search results or rejected when the find competes.
     */
    function doSearchInScope(queryInfo, scope, filter, replaceText) {
        _resetSearch(scope);
        if (replaceText !== undefined) {
            searchModel.isReplace = true;
            searchModel.replaceText = replaceText;
        }
        var candidateFilesPromise = getCandidateFiles(scope);
        return _doSearch(queryInfo, candidateFilesPromise, filter);
    }
    
    /**
     * Given a set of search results, replaces them with the given replaceText, either on disk or in memory.
     * @param {Object.<fullPath: string, {matches: Array.<{start: {line:number,ch:number}, end: {line:number,ch:number}, startOffset: number, endOffset: number, line: string}>, collapsed: boolean}>} results
     *      The list of results to replace, as returned from _doSearch..
     * @param {string} replaceText The text to replace each result with.
     * @param {?Object} options An options object:
     *      forceFilesOpen: boolean - Whether to open all files in editors and do replacements there rather than doing the 
     *          replacements on disk. Note that even if this is false, files that are already open in editors will have replacements
     *          done in memory.
     *      isRegexp: boolean - Whether the original query was a regexp. If true, $-substitution is performed on the replaceText.
     * @return {$.Promise} A promise that's resolved when the replacement is finished or rejected with an array of errors
     *      if there were one or more errors. Each individual item in the array will be a {item: string, error: string} object,
     *      where item is the full path to the file that could not be updated, and error is either a FileSystem error or one 
     *      of the `FindInFiles.ERROR_*` constants.
     */
    function doReplace(results, replaceText, options) {
        return FindUtils.performReplacements(results, replaceText, options).then(function () {
            // For UI integration testing only
            exports._replaceDone = true;
        });
    }
    
    /**
     * @private
     * Finish a replace across files operation when the user clicks "Replace" on the results panel.
     */
    function _finishReplaceAll() {
        if (searchModel.replaceText === null) {
            return;
        }
        
        // Clone the search results so that they don't get updated in the middle of the replacement.
        var resultsClone = _.cloneDeep(searchModel.results),
            replacedFiles = _.filter(Object.keys(resultsClone), function (path) {
                return FindUtils.hasCheckedMatches(resultsClone[path]);
            }),
            isRegexp = searchModel.queryInfo.isRegexp;
                
        if (replacedFiles.length <= MAX_IN_MEMORY) {
            // Just do the replacements in memory.
            findInFilesResults.hideResults();
            doReplace(resultsClone, searchModel.replaceText, { forceFilesOpen: true, isRegexp: isRegexp });
        } else {
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_INFO,
                Strings.REPLACE_WITHOUT_UNDO_WARNING_TITLE,
                StringUtils.format(Strings.REPLACE_WITHOUT_UNDO_WARNING, MAX_IN_MEMORY),
                [
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_NORMAL,
                        id        : Dialogs.DIALOG_BTN_CANCEL,
                        text      : Strings.CANCEL
                    },
                    {
                        className : Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id        : Dialogs.DIALOG_BTN_OK,
                        text      : Strings.BUTTON_REPLACE_WITHOUT_UNDO
                    }
                ]
            ).done(function (id) {
                if (id === Dialogs.DIALOG_BTN_OK) {
                    findInFilesResults.hideResults();
                    doReplace(resultsClone, searchModel.replaceText, { isRegexp: isRegexp });
                }
            });
        }
    }
    
    /**
     * @private
     * Displays a non-modal embedded dialog above the code mirror editor that allows the user to do
     * a find operation across all files in the project.
     * @param {?Entry} scope  Project file/subfolder to search within; else searches whole project.
     * @param {boolean=} showReplace If true, show the Replace controls.
     */
    function _doFindInFiles(scope, showReplace) {
        // If the scope is a file with a custom viewer, then we
        // don't show find in files dialog.
        if (scope && EditorManager.getCustomViewerForPath(scope.fullPath)) {
            return;
        }
        
        if (scope instanceof InMemoryFile) {
            CommandManager.execute(Commands.FILE_OPEN, { fullPath: scope.fullPath }).done(function () {
                CommandManager.execute(Commands.CMD_FIND);
            });
            return;
        }
        
        // Default to searching for the current selection
        var currentEditor = EditorManager.getActiveEditor(),
            initialString = currentEditor && currentEditor.getSelectedText();

        if (findBar && !findBar.isClosed()) {
            // The modalBar was already up. When creating the new modalBar, copy the
            // current query instead of using the passed-in selected text.
            initialString = findBar.getQueryInfo().query;
        }
        
        _resetSearch(scope);
        
        // Close our previous find bar, if any. (The open() of the new findBar will
        // take care of closing any other find bar instances.)
        if (findBar) {
            findBar.close();
        }
        
        findBar = new FindBar({
            navigator: false,
            replace: showReplace,
            replaceAllOnly: showReplace,
            scope: true,
            initialQuery: initialString,
            queryPlaceholder: Strings.CMD_FIND_IN_SUBTREE,
            scopeLabel: FindUtils.labelForScope(scope)
        });
        findBar.open();

        // TODO Should push this state into ModalBar (via a FindBar API) instead of installing a callback like this.
        // Custom closing behavior: if in the middle of executing search, blur shouldn't close ModalBar yet. And
        // don't close bar when opening Edit Filter dialog either.
        findBar._modalBar.isLockedOpen = function () {
            // TODO: should have state for whether the search is executing instead of looking at find bar state
            // TODO: should have API on filterPicker to figure out if dialog is open
            return !findBar.isEnabled() || $(".modal.instance .exclusions-editor").length > 0;
        };
        
        var candidateFilesPromise = getCandidateFiles(scope),  // used for eventual search, and in exclusions editor UI
            filterPicker;
        
        function handleQueryChange() {
            // Check the query expression on every input event. This way the user is alerted
            // to any RegEx syntax errors immediately.
            if (findBar) {
                var queryInfo = findBar.getQueryInfo(),
                    queryResult = searchModel.setQueryInfo(queryInfo);

                // Enable the replace button appropriately.
                findBar.enableReplace(queryResult.valid);
                
                if (queryResult.valid || queryResult.empty) {
                    findBar.showNoResults(false);
                    findBar.showError(null);
                } else {
                    findBar.showNoResults(true, false);
                    findBar.showError(queryResult.error);
                }
            }
        }
        
        function startSearch() {
            var queryInfo = findBar && findBar.getQueryInfo();
            if (queryInfo && queryInfo.query) {
                findBar.enable(false);
                StatusBar.showBusyIndicator(true);

                var filter;
                if (filterPicker) {
                    filter = FileFilters.commitPicker(filterPicker);
                } else {
                    // Single-file scope: don't use any file filters
                    filter = null;
                }
                return _doSearch(queryInfo, candidateFilesPromise, filter);
            }
            return null;
        }
        
        function startReplace() {
            searchModel.isReplace = true;
            searchModel.replaceText = findBar.getReplaceText();
            startSearch();
        }
        
        $(findBar)
            .on("doFind.FindInFiles", function (e, shiftKey, replace) {
                // If in Replace mode, just set focus to the Replace field.
                if (replace) {
                    startReplace();
                } else if (showReplace) {
                    findBar.focusReplace();
                } else {
                    startSearch();
                }
            })
            .on("queryChange.FindInFiles", handleQueryChange)
            .on("close.FindInFiles", function (e) {
                $(findBar).off(".FindInFiles");
                findBar = null;
            });
        
        if (showReplace) {
            $(findBar).on("doReplace.FindInFiles", function (e, all) {
                startReplace();
            });
        }
                
        // Show file-exclusion UI *unless* search scope is just a single file
        if (!scope || scope.isDirectory) {
            var exclusionsContext = {
                label: FindUtils.labelForScope(scope),
                promise: candidateFilesPromise
            };

            filterPicker = FileFilters.createFilterPicker(exclusionsContext);
            // TODO: include in FindBar? (and disable it when FindBar is disabled)
            findBar._modalBar.getRoot().find(".scope-group").append(filterPicker);
        }
        
        handleQueryChange();
    }
    
    /**
     * @private
     * Bring up the Find in Files UI with the replace options.
     */
    function _doReplaceInFiles() {
        _doFindInFiles(null, true);
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
     * Close the open search bar, if any. For unit tests.
     */
    function _closeFindBar() {
        if (findBar) {
            findBar.close();
        }
    }
    
    
    
    /**
     * @private
     * @constructor
     * @extends {SearchResultsView}
     * Handles the Find in Files Results and the Results Panel
     * @param {SearchModel} model The model this panel is viewing.
     */
    function FindInFilesResults(model, panelID, panelName) {
        SearchResultsView.apply(this, arguments);
    }
    
    FindInFilesResults.prototype = Object.create(SearchResultsView.prototype);
    FindInFilesResults.prototype.constructor = FindInFilesResults;
    FindInFilesResults.prototype.parentClass = SearchResultsView.prototype;
    
    /**
     * Hides the Search Results Panel
     */
    FindInFilesResults.prototype.hideResults = function () {
        this.parentClass.hideResults.apply(this);
        this.removeListeners();
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
                start:       {line: lineNum, ch: ch},
                end:         {line: lineNum, ch: ch + matchLength},
                startOffset: match.index,
                endOffset:   match.index + matchLength,
                line:        line,
                result:      match,
                isChecked:   true
            });

            // We have the max hits in just this 1 file. Stop searching this file.
            // This fixed issue #1829 where code hangs on too many hits.
            if (matches.length >= FIND_IN_FILE_MAX) {
                queryExpr.lastIndex = 0;
                searchModel.foundMaximum = true;
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
    FindInFilesResults.prototype._addSearchMatches = function (fullPath, contents, queryExpr, timestamp) {
        var matches = this._getSearchMatches(contents, queryExpr);
        
        if (matches && matches.length) {
            this._model.addResultMatches(fullPath, matches, timestamp);
            return true;
        }
        return false;
    };
    
    
    /**
     * Remove the listeners that were tracking potential search result changes
     */
    FindInFilesResults.prototype.removeListeners = function () {
        $(DocumentModule).off(".findInFiles");
        FileSystem.off("change", this._fileSystemChangeHandler.bind(this));
    };
    
    /**
     * Add listeners to track events that might change the search result set
     */
    FindInFilesResults.prototype.addListeners = function () {
        if (this._model.hasResults()) {
            // Avoid adding duplicate listeners - e.g. if a 2nd search is run without closing the old results panel first
            this.removeListeners();

            $(DocumentModule).on("documentChange.findInFiles", this._documentChangeHandler.bind(this));
            FileSystem.on("change", this._fileSystemChangeHandler.bind(this));
        }
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
        if (_inSearchScope(document.file)) {
            // For now, if this is a replace, just clear the results and abort the replace.
            if (this._model.isReplace) {
                this._model.clear();
                return;
            }

            this._updateResults(document, change, false);
        }
    };
    
    /**
     * @private
     * Update the search results using the given list of changes for the given document
     * @param {Document} doc  The Document that changed, should be the current one
     * @param {Array.<{from: {line:number,ch:number}, to: {line:number,ch:number}, text: string, next: change}>} changeList
     *      An array of changes as described in the Document constructor
     */
    FindInFilesResults.prototype._updateResults = function (doc, changeList) {
        var i, diff, matches, lines, start, howMany,
            resultsChanged = false,
            fullPath       = doc.file.fullPath,
            self           = this;
        
        changeList.forEach(function (change) {
            lines = [];
            start = 0;
            howMany = 0;

            // There is no from or to positions, so the entire file changed, we must search all over again
            if (!change.from || !change.to) {
                // TODO: add unit test exercising timestamp logic in this case
                self._addSearchMatches(fullPath, doc.getText(), searchModel.queryExpr, doc.diskTimestamp);
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

                if (self._model.results[fullPath]) {
                    // Search the last match before a replacement, the amount of matches deleted and update
                    // the lines values for all the matches after the change
                    self._model.results[fullPath].matches.forEach(function (item) {
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
                        self._model.results[fullPath].matches.splice(start, howMany);
                    }
                    resultsChanged = true;
                }

                // Searches only over the lines that changed
                matches = self._getSearchMatches(lines.join("\r\n"), searchModel.queryExpr);
                if (matches && matches.length) {
                    // Updates the line numbers, since we only searched part of the file
                    matches.forEach(function (value, key) {
                        matches[key].start.line += change.from.line;
                        matches[key].end.line   += change.from.line;
                    });

                    // If the file index exists, add the new matches to the file at the start index found before
                    if (self._model.results[fullPath]) {
                        Array.prototype.splice.apply(self._model.results[fullPath].matches, [start, 0].concat(matches));
                    // If not, add the matches to a new file index
                    } else {
                        // TODO: add unit test exercising timestamp logic in self case
                        self._model.results[fullPath] = {
                            matches:   matches,
                            collapsed: false,
                            timestamp: doc.diskTimestamp
                        };
                    }
                    resultsChanged = true;
                }

                // All the matches where deleted, remove the file from the results
                if (self._model.results[fullPath] && !self._model.results[fullPath].matches.length) {
                    delete self._model.results[fullPath];
                    resultsChanged = true;
                }
            }
        });
        
        if (resultsChanged) {
            this._model.fireChanged();
        }
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
        
        if (this._panel.isVisible()) {
            // Update the search results
            _.forEach(this._model.results, function (item, fullPath) {
                if (fullPath.match(oldName)) {
                    self._model.results[fullPath.replace(oldName, newName)] = item;
                    delete self._model.results[fullPath];
                    resultsChanged = true;
                }
            });

            // Restore the results if needed
            if (resultsChanged) {
                // For now, if this is a replace, just clear the results and abort the replace.
                // (We do this check here so we know whether the change was actually relevant to the search results.)
                if (this._model.isReplace) {
                    this._model.clear();
                } else {
                    this._model.fireChanged();
                }
            }
        }
    };
    
    /**
     * @private
     * Updates search results in response to FileSystem "change" event
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
            Object.keys(self._model.results).forEach(function (fullPath) {
                if (fullPath.indexOf(entry.fullPath) === 0) {
                    delete self._model.results[fullPath];
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
            
            // gather up added files
            var visitor = function (child) {
                // Replicate filtering that getAllFiles() does
                if (ProjectManager.shouldShow(child)) {
                    if (child.isFile && _isReadableText(child.name)) {
                        // Re-check the filtering that the initial search applied
                        if (_inSearchScope(child)) {
                            addedFiles.push(child);
                        }
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
                Async.doInParallel(addedFiles, function (file) {
                    return _doSearchInOneFile(file)
                        .done(function (foundMatches) {
                            resultsChanged = resultsChanged || foundMatches;
                        });
                }).always(deferred.resolve);
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
                // If the added or removed sets are null, must redo the search for the entire subtree - we
                // don't know which child files/folders may have been added or removed.
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
                // For now, if this is a replace, just clear the results and abort the replace.
                // (We do this check here so we know whether the change was actually relevant to the search results.)
                if (self._model.isReplace) {
                    self._model.clear();
                } else {
                    self._model.fireChanged();
                }
            }
        });
    };
    
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        searchModel = new SearchModel();
        findInFilesResults = new FindInFilesResults(searchModel, "find-in-files-results", "find-in-files-results.panel");
        $(findInFilesResults).on("doReplaceAll", _finishReplaceAll);

        exports._searchModel = searchModel; // for UI integration tests
    });
    
    // Initialize: register listeners
    $(DocumentManager).on("fileNameChange",    function () { findInFilesResults._fileNameChangeHandler(); });
    $(ProjectManager).on("beforeProjectClose", function () { findInFilesResults.hideResults(); });
    
    // Initialize: command handlers
    CommandManager.register(Strings.CMD_FIND_IN_FILES,      Commands.CMD_FIND_IN_FILES,     _doFindInFiles);
    CommandManager.register(Strings.CMD_REPLACE_IN_FILES,   Commands.CMD_REPLACE_IN_FILES,  _doReplaceInFiles);
    CommandManager.register(Strings.CMD_FIND_IN_SELECTED,   Commands.CMD_FIND_IN_SELECTED,  _doFindInSubtree);
    CommandManager.register(Strings.CMD_FIND_IN_SUBTREE,    Commands.CMD_FIND_IN_SUBTREE,   _doFindInSubtree);
    
    // Public exports
    exports.doSearchInScope     = doSearchInScope;
    exports.doReplace           = doReplace;
    
    // For unit testing
    exports._doFindInFiles = _doFindInFiles;
    exports._closeFindBar  = _closeFindBar;
});

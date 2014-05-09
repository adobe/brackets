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
        SearchResults         = require("search/SearchResults").SearchResults,
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
        UPDATE_TIMEOUT   = 400,
        MAX_IN_MEMORY    = 10; // maximum number of files to do replacements in-memory instead of on disk
    
    /** @const @type {!Object} Token used to indicate a specific reason for zero search results */
    var ZERO_FILES_TO_SEARCH = {};
    
    /** @type {FindInFilesResults} The find in files results. Initialized in htmlReady() */
    var findInFilesResults;
    
    /** @type {{query: string, caseSensitive: boolean, isRegexp: boolean}} The current search query */
    var currentQuery = null;
    
    /** @type {RegExp} The current search query regular expression */
    var currentQueryExpr = null;
    
    /** @type {string} The current replacement text. */
    var currentReplaceText = null;
    
    /** @type {?FileSystemEntry} Root of subtree to search in, or single file to search in, or null to search entire project */
    var currentScope = null;
    
    /** @type {string} Compiled filter from FileFilters */
    var currentFilter = null;
    
    /** @type {boolean} True if the matches in a file reached FIND_IN_FILE_MAX */
    var maxHitsFoundInFile = false;
    
    /** @type {FindBar} Find bar containing the search UI. */
    var findBar = null;
    
    /**
     * @private
     * Returns a regular expression from the given query and shows an error in the modal-bar if it was invalid
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo  The query info from the find bar
     * @return {RegExp}
     */
    function _getQueryRegExp(queryInfo) {
        if (findBar) {
            findBar.showError(null);
        }
        
        // TODO: only apparent difference between this one and the one in FindReplace is that this one returns
        // null instead of "" for a bad query, and this always returns a regexp even for simple strings. Reconcile.
        if (!queryInfo || !queryInfo.query) {
            return null;
        }

        // For now, treat all matches as multiline (i.e. ^/$ match on every line, not the whole
        // document). This is consistent with how single-file find works. Eventually we should add
        // an option for this.
        var flags = "gm";
        if (!queryInfo.isCaseSensitive) {
            flags += "i";
        }
        
        // Is it a (non-blank) regex?
        if (queryInfo.isRegexp) {
            try {
                return new RegExp(queryInfo.query, flags);
            } catch (e) {
                if (findBar) {
                    findBar.showError(e.message);
                }
                return null;
            }
        } else {
            // Query is a plain string. Turn it into a regexp
            return new RegExp(StringUtils.regexEscape(queryInfo.query), flags);
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
     * Finds all candidate files to search in currentScope's subtree that are not binary content. Does NOT apply
     * currentFilter yet.
     */
    function getCandidateFiles() {
        function filter(file) {
            return _subtreeFilter(file, currentScope) && _isReadableText(file.fullPath);
        }
        
        return ProjectManager.getAllFiles(filter, true);
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
        if (currentScope) {
            if (!_subtreeFilter(file, currentScope)) {
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
        return FileFilters.filterPath(currentFilter, file.fullPath);
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
                var foundMatches = findInFilesResults._addSearchMatches(file.fullPath, text, currentQueryExpr, timestamp);
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
     * Executes the Find in Files search inside the 'currentScope'
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo Query info object, as returned by FindBar.getQueryInfo()
     * @param {!$.Promise} candidateFilesPromise Promise from getCandidateFiles(), which was called earlier
     * @param {?string} filter A "compiled" filter as returned by FileFilters.compile(), or null for no filter
     * @param {boolean=} allowReplace Whether we intend to do a replace operation on the results of the search.
     * @param {?string} replaceText If replacing, the text the user has specified for replacement.
     * @return {$.Promise} A promise that's resolved with the search results or rejected when the find competes.
     */
    function _doSearch(queryInfo, candidateFilesPromise, filter, allowReplace, replaceText) {
        currentQuery     = queryInfo;
        currentQueryExpr = _getQueryRegExp(queryInfo);
        currentFilter    = filter;
        
        if (!currentQueryExpr) {
            StatusBar.hideBusyIndicator();
            if (findBar) {
                findBar.close();
            }
            return;
        }
        
        var scopeName = currentScope ? currentScope.fullPath : ProjectManager.getProjectRoot().fullPath,
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
                // TODO: this should probably be in a separate method
                findInFilesResults.setAllowReplace(allowReplace);
                findInFilesResults.showResults(zeroFilesToken, replaceText);
                StatusBar.hideBusyIndicator();
                PerfUtils.addMeasurement(perfTimer);
                
                // Listen for FS & Document changes to keep results up to date
                findInFilesResults.addListeners();
                
                // TODO: might be better to still keep the search results data here (as a model),
                // and then pass a reference to it into FindInFilesResults
                exports._searchResults = findInFilesResults._searchResults;  // for UI integration tests that don't call doSearchInScope() directly
                deferred.resolve(findInFilesResults._searchResults);
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
        currentQuery       = null;
        currentQueryExpr   = null;
        currentReplaceText = null;
        currentScope       = scope;
        maxHitsFoundInFile = false;
        exports._searchResults = null;  // for unit tests        
        findInFilesResults.initializeResults();
    }
    
    /**
     * Does a search in the given scope with the given filter. Used when you want to start a search
     * programmatically.
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo Query info object, as returned by FindBar.getQueryInfo()
     * @param {?Entry} scope Project file/subfolder to search within; else searches whole project.
     * @param {?string} filter A "compiled" filter as returned by FileFilters.compile(), or null for no filter
     * @return {$.Promise} A promise that's resolved with the search results or rejected when the find competes.
     */
    function doSearchInScope(queryInfo, scope, filter) {
        _resetSearch(scope);
        var candidateFilesPromise = getCandidateFiles();
        return _doSearch(queryInfo, candidateFilesPromise, filter);
    }
    
    /**
     * Does a set of replacements in a single document in memory.
     * @param {!Document} doc The document to do the replacements in.
     * @param {Object} matchInfo The match info for this file, as returned by `_addSearchMatches()`. Might be mutated.
     * @param {string} replaceText The text to replace each result with.
     * @param {boolean=} isRegexp Whether the original query was a regexp.
     * @return {$.Promise} A promise that's resolved when the replacement is finished or rejected with an error if there were one or more errors.
     */
    function _doReplaceInDocument(doc, matchInfo, replaceText, isRegexp) {
        // TODO: if doc has changed since query was run, don't do replacement
        
        // Do the replacements in reverse document order so the offsets continue to be correct.
        matchInfo.matches.sort(function (match1, match2) {
            return CodeMirror.cmpPos(match2.start, match1.start);
        });
        doc.batchOperation(function () {
            matchInfo.matches.forEach(function (match) {
                if (match.isChecked) {
                    doc.replaceRange(isRegexp ? FindUtils.parseDollars(replaceText, match.result) : replaceText, match.start, match.end);
                }
            });
        });
        
        return new $.Deferred().resolve().promise();
    }
    
    /**
     * Does a set of replacements in a single file on disk.
     * @param {string} fullPath The full path to the file.
     * @param {Object} matchInfo The match info for this file, as returned by `_addSearchMatches()`.
     * @param {string} replaceText The text to replace each result with.
     * @param {boolean=} isRegexp Whether the original query was a regexp.
     * @return {$.Promise} A promise that's resolved when the replacement is finished or rejected with an error if there were one or more errors.
     */
    function _doReplaceOnDisk(fullPath, matchInfo, replaceText, isRegexp) {
        var file = FileSystem.getFileForPath(fullPath);
        return DocumentManager.getDocumentText(file, true).then(function (contents, timestamp, lineEndings) {
            if (timestamp.getTime() !== matchInfo.timestamp.getTime()) {
                // Return a promise that we'll reject immediately. (We can't just return the
                // error since this is the success handler.)
                return new $.Deferred().reject(exports.ERROR_FILE_CHANGED).promise();
            }

            // Note that this assumes that the matches are sorted.
            // TODO: is there a more efficient way to do this in a large string?
            var result = [],
                lastIndex = 0;
            matchInfo.matches.forEach(function (match) {
                if (match.isChecked) {
                    result.push(contents.slice(lastIndex, match.startOffset));
                    result.push(isRegexp ? FindUtils.parseDollars(replaceText, match.result) : replaceText);
                    lastIndex = match.endOffset;
                }
            });
            result.push(contents.slice(lastIndex));

            var newContents = result.join("");
            // TODO: duplicated logic from Document - should refactor this?
            if (lineEndings === FileUtils.LINE_ENDINGS_CRLF) {
                newContents = newContents.replace(/\n/g, "\r\n");
            }

            return Async.promisify(file, "write", newContents);
        });
    }
    
    /**
     * Does a set of replacements in a single file. If the file is already open in a Document in memory,
     * will do the replacement there, otherwise does it directly on disk.
     * @param {string} fullPath The full path to the file.
     * @param {Object} matchInfo The match info for this file, as returned by `_addSearchMatches()`.
     * @param {string} replaceText The text to replace each result with.
     * @param {Object=} options An options object:
     *      forceFilesOpen: boolean - Whether to open the file in an editor and do replacements there rather than doing the 
     *          replacements on disk. Note that even if this is false, files that are already open in editors will have replacements
     *          done in memory.
     *      isRegexp: boolean - Whether the original query was a regexp. If true, $-substitution is performed on the replaceText.
     * @return {$.Promise} A promise that's resolved when the replacement is finished or rejected with an error if there were one or more errors.
     */
    function _doReplaceInOneFile(fullPath, matchInfo, replaceText, options) {
        var doc = DocumentManager.getOpenDocumentForPath(fullPath);
        options = options || {};
        if (options.forceFilesOpen && !doc) {
            return DocumentManager.getDocumentForPath(fullPath).then(function (newDoc) {
                return _doReplaceInDocument(newDoc, matchInfo, replaceText, options.isRegexp);
            });
        } else if (doc) {
            return _doReplaceInDocument(doc, matchInfo, replaceText, options.isRegexp);
        } else {
            return _doReplaceOnDisk(fullPath, matchInfo, replaceText, options.isRegexp);
        }
    }
    
    /**
     * Given a set of search results as returned from _doSearch, replaces them with the given replaceText, either on
     * disk or in memory.
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
        return Async.doInParallel_aggregateErrors(Object.keys(results), function (fullPath) {
            return _doReplaceInOneFile(fullPath, results[fullPath], replaceText, options);
        }).done(function () {
            // For integration tests only.
            exports._replaceDone = true;
        });
    }
    
    /**
     * @private
     * Finish a replace across files operation when the user clicks "Replace" on the results panel.
     */
    function _finishReplaceAll() {
        if (currentReplaceText === null) {
            return;
        }
        
        var fewReplacements = Object.keys(findInFilesResults._searchResults).length <= MAX_IN_MEMORY;
        if (fewReplacements) {
            // Just do the replacements in memory.
            doReplace(findInFilesResults._searchResults, currentReplaceText, { forceFilesOpen: true });
        } else {
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_INFO,
                Strings.REPLACE_WITHOUT_UNDO_WARNING_TITLE,
                Strings.REPLACE_WITHOUT_UNDO_WARNING,
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
                    doReplace(findInFilesResults._searchResults, currentReplaceText);
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
            scopeLabel: _labelForScope(scope)
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
        
        var candidateFilesPromise = getCandidateFiles(),  // used for eventual search, and in exclusions editor UI
            filterPicker;
        
        function handleQueryChange() {
            // Check the query expression on every input event. This way the user is alerted
            // to any RegEx syntax errors immediately.
            var queryInfo = findBar && findBar.getQueryInfo(),
                query = _getQueryRegExp(queryInfo);
            
            // Indicate that there's an error if the query isn't blank and it's an invalid regexp.
            findBar.showNoResults(queryInfo.query && query === null, false);
        }
        
        function startSearch(replaceText) {
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
                return _doSearch(queryInfo, candidateFilesPromise, filter, showReplace, replaceText);
            }
            return null;
        }
        
        function startReplace() {
            currentReplaceText = findBar.getReplaceText();
            startSearch(currentReplaceText);
        }
        
        $(findBar)
            .on("doFind.FindInFiles", function (e) {
                // TODO: if in Replace mode, treat Enter like Replace - show an error if no replace string?
                startSearch();
            })
            .on("queryChange.FindInFiles", handleQueryChange)
            .on("close.FindInFiles", function (e) {
                $(findBar).off(".FindInFiles");
                findBar = null;
            });
        
        if (showReplace) {
            $(findBar).on("doReplace.FindInFiles", function (e, all) {
                // TODO: handle regexp
                if (all) {
                    startReplace();
                } else {
                    console.warn("FindInFiles: got spurious 'Replace' click");
                }
            });
        }
                
        // Show file-exclusion UI *unless* search scope is just a single file
        if (!scope || scope.isDirectory) {
            var exclusionsContext = {
                label: _labelForScope(scope),
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
     * @extends {SearchResults}
     * Handles the Find in Files Results and the Results Panel
     */
    function FindInFilesResults() {
        this._timeoutID       = null;
        
        this.createPanel("find-in-files-results", "find-in-files.results");
    }
    
    FindInFilesResults.prototype = Object.create(SearchResults.prototype);
    FindInFilesResults.prototype.constructor = FindInFilesResults;
    FindInFilesResults.prototype.parentClass = SearchResults.prototype;
    
    /** @type {string} The setTimeout id, used to clear it if required */
    FindInFilesResults.prototype._timeoutID = null;
    
    /**
     * Turns the replace functionality on or off.
     * @param {boolean} allowReplace Whether to allow replacements.
     */
    FindInFilesResults.prototype.setAllowReplace = function (allowReplace) {
        this._replace = allowReplace;
    };
    
    /**
     * Hides the Search Results Panel
     */
    FindInFilesResults.prototype.hideResults = function () {
        this.parentClass.hideResults.apply(this);
        this.removeListeners();
    };
    
    /**
     * @private
     * Shows the results in a table and adds the necessary event listeners
     * @param {?Object} zeroFilesToken The 'ZERO_FILES_TO_SEARCH' token, if no results found for this reason
     * @param {?string} replaceText If in replace mode, the text the user wants to replace with.
     */
    FindInFilesResults.prototype.showResults = function (zeroFilesToken, replaceText) {
        if (!$.isEmptyObject(this._searchResults)) {
            var count = this._countFilesMatches(),
                self  = this;
            
            // Show result summary in header
            var numMatchesStr = "";
            if (maxHitsFoundInFile) {
                numMatchesStr = Strings.FIND_IN_FILES_MORE_THAN;
            }

            // This text contains some formatting, so all the strings are assumed to be already escaped
            var summary = StringUtils.format(
                replaceText ? Strings.FIND_IN_FILES_REPLACE_TITLE_PART3 : Strings.FIND_IN_FILES_TITLE_PART3,
                numMatchesStr,
                String(count.matches),
                (count.matches > 1) ? Strings.FIND_IN_FILES_MATCHES : Strings.FIND_IN_FILES_MATCH,
                count.files,
                (count.files > 1 ? Strings.FIND_IN_FILES_FILES : Strings.FIND_IN_FILES_FILE)
            );
            
            // Insert the search summary
            this._showSummary({
                query:   (currentQuery && currentQuery.query) || "",
                replaceWith: replaceText,
                title1:  replaceText ? Strings.FIND_REPLACE_TITLE_PART1 : Strings.FIND_IN_FILES_TITLE_PART1,
                title2:  replaceText ? Strings.FIND_REPLACE_TITLE_PART2 : Strings.FIND_IN_FILES_TITLE_PART2,
                scope:   currentScope ? "&nbsp;" + _labelForScope(currentScope) + "&nbsp;" : "",
                summary: summary
            });
            
            // Create the results template search list
            this._showResultsList();
            
            if (findBar) {
                findBar.close();
            }
        
        } else {
            this.hideResults();

            if (findBar) {
                var showMessage = false;
                findBar.enable(true);
                findBar.focusQuery();
                if (zeroFilesToken === ZERO_FILES_TO_SEARCH) {
                    findBar.showError(StringUtils.format(Strings.FIND_IN_FILES_ZERO_FILES, _labelForScope(currentScope)), true);
                } else {
                    showMessage = true;
                }
                findBar.showNoResults(true, showMessage);
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
    FindInFilesResults.prototype._addSearchMatches = function (fullPath, contents, queryExpr, timestamp) {
        var matches = this._getSearchMatches(contents, queryExpr);
        
        if (matches && matches.length) {
            this.addResultMatches(fullPath, matches, timestamp);
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
        if (!$.isEmptyObject(this._searchResults)) {
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
        var self = this, updateResults;
        if (_inSearchScope(document.file)) {
            updateResults = this._updateResults(document, change, false);
            
            if (this._timeoutID) {
                window.clearTimeout(this._timeoutID);
                updateResults = true;
            }
            if (updateResults) {
                this._timeoutID = window.setTimeout(function () {
                    self.restoreResults();
                    self._timeoutID = null;
                }, UPDATE_TIMEOUT);
            }
        }
    };
    
    /**
     * @private
     * Update the search results using the given list of changes for the given document
     * @param {Document} doc  The Document that changed, should be the current one
     * @param {Array.<{from: {line:number,ch:number}, to: {line:number,ch:number}, text: string, next: change}>} changeList
     *      An array of changes as described in the Document constructor
     * @return {boolean}  True when the search results changed from a file change
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
                self._addSearchMatches(fullPath, doc.getText(), currentQueryExpr, doc.diskTimestamp);
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

                if (self._searchResults[fullPath]) {
                    // Search the last match before a replacement, the amount of matches deleted and update
                    // the lines values for all the matches after the change
                    self._searchResults[fullPath].matches.forEach(function (item) {
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
                        self._searchResults[fullPath].matches.splice(start, howMany);
                    }
                    resultsChanged = true;
                }

                // Searches only over the lines that changed
                matches = self._getSearchMatches(lines.join("\r\n"), currentQueryExpr);
                if (matches && matches.length) {
                    // Updates the line numbers, since we only searched part of the file
                    matches.forEach(function (value, key) {
                        matches[key].start.line += change.from.line;
                        matches[key].end.line   += change.from.line;
                    });

                    // If the file index exists, add the new matches to the file at the start index found before
                    if (self._searchResults[fullPath]) {
                        Array.prototype.splice.apply(self._searchResults[fullPath].matches, [start, 0].concat(matches));
                    // If not, add the matches to a new file index
                    } else {
                        // TODO: add unit test exercising timestamp logic in this case
                        self._searchResults[fullPath] = {
                            matches:   matches,
                            collapsed: false,
                            timestamp: doc.diskTimestamp
                        };
                    }
                    resultsChanged = true;
                }

                // All the matches where deleted, remove the file from the results
                if (self._searchResults[fullPath] && !self._searchResults[fullPath].matches.length) {
                    delete self._searchResults[fullPath];
                    resultsChanged = true;
                }
            }
        });
        
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
        
        if (this._panel.isVisible()) {
            // Update the search results
            _.forEach(this._searchResults, function (item, fullPath) {
                if (fullPath.match(oldName)) {
                    self._searchResults[fullPath.replace(oldName, newName)] = item;
                    delete self._searchResults[fullPath];
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
            Object.keys(self._searchResults).forEach(function (fullPath) {
                if (fullPath.indexOf(entry.fullPath) === 0) {
                    delete self._searchResults[fullPath];
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
                self.restoreResults();
            }
        });
    };
    
    
    // Initialize items dependent on HTML DOM
    AppInit.htmlReady(function () {
        findInFilesResults = new FindInFilesResults();
        $(findInFilesResults).on("doReplaceAll", _finishReplaceAll);
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
    exports.ERROR_FILE_CHANGED  = "fileChanged";
    
    // For unit testing
    exports._doFindInFiles = _doFindInFiles;
    exports._closeFindBar = _closeFindBar;
    exports._searchResults = null;
});

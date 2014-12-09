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
/*global define, $, Promise */

/*
 * The core search functionality used by Find in Files and single-file Replace Batch.
 */
define(function (require, exports, module) {
    "use strict";
    
    var _                     = require("thirdparty/lodash"),
        FileFilters           = require("search/FileFilters"),
        Async                 = require("utils/Async"),
        StringUtils           = require("utils/StringUtils"),
        ProjectManager        = require("project/ProjectManager"),
        DocumentModule        = require("document/Document"),
        DocumentManager       = require("document/DocumentManager"),
        MainViewManager       = require("view/MainViewManager"),
        FileSystem            = require("filesystem/FileSystem"),
        LanguageManager       = require("language/LanguageManager"),
        SearchModel           = require("search/SearchModel").SearchModel,
        PerfUtils             = require("utils/PerfUtils"),
        FindUtils             = require("search/FindUtils");
    
    /**
     * Token used to indicate a specific reason for zero search results
     * @const @type {!Object}
     */
    var ZERO_FILES_TO_SEARCH = {};
    
    /**
     * The search query and results model.
     * @type {SearchModel} 
     */
    var searchModel = new SearchModel();
    
    /* Forward declarations */
    var _documentChangeHandler, _fileSystemChangeHandler, _fileNameChangeHandler;
    
    /** Remove the listeners that were tracking potential search result changes */
    function _removeListeners() {
        DocumentModule.off("documentChange", _documentChangeHandler);
        FileSystem.off("change", _fileSystemChangeHandler);
        DocumentManager.off("fileNameChange", _fileNameChangeHandler);
    }
    
    /** Add listeners to track events that might change the search result set */
    function _addListeners() {
        if (searchModel.hasResults()) {
            // Avoid adding duplicate listeners - e.g. if a 2nd search is run without closing the old results panel first
            _removeListeners();
        
            DocumentModule.on("documentChange", _documentChangeHandler);
            FileSystem.on("change", _fileSystemChangeHandler);
            DocumentManager.on("fileNameChange",  _fileNameChangeHandler);
        }
    }
    
    /**
     * @private
     * Searches through the contents and returns an array of matches
     * @param {string} contents
     * @param {RegExp} queryExpr
     * @return {!Array.<{start: {line:number,ch:number}, end: {line:number,ch:number}, line: string}>}
     */
    function _getSearchMatches(contents, queryExpr) {
        // Quick exit if not found or if we hit the limit
        if (searchModel.foundMaximum || contents.search(queryExpr) === -1) {
            return [];
        }
        
        var match, lineNum, line, ch, totalMatchLength, matchedLines, numMatchedLines, lastLineLength,
            lines   = StringUtils.getLines(contents),
            matches = [];
        
        while ((match = queryExpr.exec(contents)) !== null) {
            lineNum          = StringUtils.offsetToLineNum(lines, match.index);
            line             = lines[lineNum];
            ch               = match.index - contents.lastIndexOf("\n", match.index) - 1;  // 0-based index
            matchedLines     = match[0].split("\n");
            numMatchedLines  = matchedLines.length;
            totalMatchLength = match[0].length;
            lastLineLength   = matchedLines[matchedLines.length - 1].length;
            
            // Don't store more than 200 chars per line
            line = line.substr(0, Math.min(200, line.length));
            
            matches.push({
                start:       {line: lineNum, ch: ch},
                end:         {line: lineNum + numMatchedLines - 1, ch: (numMatchedLines === 1 ? ch + totalMatchLength : lastLineLength)},
                
                // Note that the following offsets from the beginning of the file are *not* updated if the search
                // results change. These are currently only used for multi-file replacement, and we always
                // abort the replace (by shutting the results panel) if we detect any result changes, so we don't
                // need to keep them up to date. Eventually, we should either get rid of the need for these (by
                // doing everything in terms of line/ch offsets, though that will require re-splitting files when
                // doing a replace) or properly update them.
                startOffset: match.index,
                endOffset:   match.index + totalMatchLength,
                
                line:        line,
                result:      match,
                isChecked:   true
            });

            // We have the max hits in just this 1 file. Stop searching this file.
            // This fixed issue #1829 where code hangs on too many hits.
            // Adds one over MAX_TOTAL_RESULTS in order to know if the search has exceeded
            // or is equal to MAX_TOTAL_RESULTS. Additional result removed in SearchModel
            if (matches.length > SearchModel.MAX_TOTAL_RESULTS) {
                queryExpr.lastIndex = 0;
                break;
            }
            
            // Pathological regexps like /^/ return 0-length matches. Ensure we make progress anyway
            if (totalMatchLength === 0) {
                queryExpr.lastIndex++;
            }
        }

        return matches;
    }
    
    /**
     * @private
     * Update the search results using the given list of changes for the given document
     * @param {Document} doc  The Document that changed, should be the current one
     * @param {Array.<{from: {line:number,ch:number}, to: {line:number,ch:number}, text: !Array.<string>}>} changeList
     *      An array of changes as described in the Document constructor
     */
    function _updateResults(doc, changeList) {
        var i, diff, matches, lines, start, howMany,
            resultsChanged = false,
            fullPath       = doc.file.fullPath,
            resultInfo     = searchModel.results[fullPath];
        
        // Remove the results before we make any changes, so the SearchModel can accurately update its count.
        searchModel.removeResults(fullPath);
        
        changeList.forEach(function (change) {
            lines = [];
            start = 0;
            howMany = 0;

            // There is no from or to positions, so the entire file changed, we must search all over again
            if (!change.from || !change.to) {
                // TODO: add unit test exercising timestamp logic in this case
                // We don't just call _updateSearchMatches() here because we want to continue iterating through changes in
                // the list and update at the end.
                resultInfo = {matches: _getSearchMatches(doc.getText(), searchModel.queryExpr), timestamp: doc.diskTimestamp};
                resultsChanged = true;

            } else {
                // Get only the lines that changed
                for (i = 0; i < change.text.length; i++) {
                    lines.push(doc.getLine(change.from.line + i));
                }

                // We need to know how many newlines were inserted/deleted in order to update the rest of the line indices;
                // this is the total number of newlines inserted (which is the length of the lines array minus
                // 1, since the last line in the array is inserted without a newline after it) minus the
                // number of original newlines being removed.
                diff = lines.length - 1 - (change.to.line - change.from.line);

                if (resultInfo) {
                    // Search the last match before a replacement, the amount of matches deleted and update
                    // the lines values for all the matches after the change
                    resultInfo.matches.forEach(function (item) {
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
                        resultInfo.matches.splice(start, howMany);
                    }
                    resultsChanged = true;
                }

                // Searches only over the lines that changed
                matches = _getSearchMatches(lines.join("\r\n"), searchModel.queryExpr);
                if (matches.length) {
                    // Updates the line numbers, since we only searched part of the file
                    matches.forEach(function (value, key) {
                        matches[key].start.line += change.from.line;
                        matches[key].end.line   += change.from.line;
                    });

                    // If the file index exists, add the new matches to the file at the start index found before
                    if (resultInfo) {
                        Array.prototype.splice.apply(resultInfo.matches, [start, 0].concat(matches));
                    // If not, add the matches to a new file index
                    } else {
                        // TODO: add unit test exercising timestamp logic in self case
                        resultInfo = {
                            matches:   matches,
                            collapsed: false,
                            timestamp: doc.diskTimestamp
                        };
                    }
                    resultsChanged = true;
                }
            }
        });
        
        // Always re-add the results, even if nothing changed.
        if (resultInfo && resultInfo.matches.length) {
            searchModel.setResults(fullPath, resultInfo);
        }

        if (resultsChanged) {
            // Pass `true` for quickChange here. This will make listeners debounce the change event,
            // avoiding lots of updates if the user types quickly.
            searchModel.fireChanged(true);
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
     * Finds all candidate files to search in the given scope's subtree that are not binary content. Does NOT apply
     * the current filter yet.
     * @param {?FileSystemEntry} scope Search scope, or null if whole project
     * @return {Promise} A promise that will be resolved with the list of files in the scope. Never rejected.
     */
    function getCandidateFiles(scope) {
        function filter(file) {
            return _subtreeFilter(file, scope) && _isReadableText(file.fullPath);
        }
        
        // If the scope is a single file, just check if the file passes the filter directly rather than
        // trying to use ProjectManager.getAllFiles(), both for performance and because an individual
        // in-memory file might be an untitled document that doesn't show up in getAllFiles().
        if (scope && scope.isFile) {
            return Promise.resolve(filter(scope) ? [scope] : []);
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
                if (MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, file.fullPath) === -1) {
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
     * Tries to update the search result on document changes
     * @param {$.Event} event
     * @param {Document} document
     * @param {<{from: {line:number,ch:number}, to: {line:number,ch:number}, text: !Array.<string>}>} change
     *      A change list as described in the Document constructor
     */
    _documentChangeHandler = function (event, document, change) {
        if (_inSearchScope(document.file)) {
            _updateResults(document, change);
        }
    };
    
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
     * @return {Promise}
     */
    function _doSearchInOneFile(file) {
        return new Promise(function (resolve, reject) {

            DocumentManager.getDocumentText(file)
                .then(function (args) {
                    // Note that we don't fire a model change here, since this is always called by some outer batch
                    // operation that will fire it once it's done.
                    var text      = args[0],
                        timestamp = args[1],
                        matches   = _getSearchMatches(text, searchModel.queryExpr);
                    searchModel.setResults(file.fullPath, {matches: matches, timestamp: timestamp});
                    resolve(!!matches.length);
                })
                .catch(function () {
                    // Always resolve. If there is an error, this file
                    // is skipped and we move on to the next file.
                    resolve(false);
                });
        });
    }
    
    /**
     * @private
     * Executes the Find in Files search inside the current scope.
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo Query info object
     * @param {!Promise} candidateFilesPromise Promise from getCandidateFiles(), which was called earlier
     * @param {?string} filter A "compiled" filter as returned by FileFilters.compile(), or null for no filter
     * @return {?Promise} A promise that's resolved with the search results (or ZERO_FILES_TO_SEARCH) or rejected when the find competes. 
     *      Will be null if the query is invalid.
     */
    function _doSearch(queryInfo, candidateFilesPromise, filter) {
        searchModel.filter = filter;
        
        var queryResult = searchModel.setQueryInfo(queryInfo);
        if (!queryResult) {
            return null;
        }
        
        var scopeName = searchModel.scope ? searchModel.scope.fullPath : ProjectManager.getProjectRoot().fullPath,
            perfTimer = PerfUtils.markStart("FindIn: " + scopeName + " - " + queryInfo.query);
        
        return candidateFilesPromise
            .then(function (fileListResult) {
                // Filter out files/folders that match user's current exclusion filter
                fileListResult = FileFilters.filterFileList(filter, fileListResult);
                
                if (fileListResult.length) {
                    return Async.doInParallel(fileListResult, _doSearchInOneFile);
                } else {
                    return ZERO_FILES_TO_SEARCH;
                }
            })
            .then(function (zeroFilesToken) {
                exports._searchDone = true; // for unit tests
                PerfUtils.addMeasurement(perfTimer);
                
                // Listen for FS & Document changes to keep results up to date
                _addListeners();
                
                if (zeroFilesToken === ZERO_FILES_TO_SEARCH) {
                    return zeroFilesToken;
                } else {
                    return searchModel.results;
                }
            }, function (err) {
                console.log("find in files failed: ", err);
                PerfUtils.finalizeMeasurement(perfTimer);
                
                // In jQuery promises, returning the error here propagates the rejection,
                // unlike in Promises/A, where we would need to re-throw it to do so.
                return err;
            });
    }
    
    /**
     * @private
     * Clears any previous search information, removing update listeners and clearing the model.
     * @param {?Entry} scope Project file/subfolder to search within; else searches whole project.
     */
    function clearSearch() {
        _removeListeners();
        searchModel.clear();
    }

    /**
     * Does a search in the given scope with the given filter. Used when you want to start a search
     * programmatically.
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo Query info object
     * @param {?Entry} scope Project file/subfolder to search within; else searches whole project.
     * @param {?string} filter A "compiled" filter as returned by FileFilters.compile(), or null for no filter
     * @param {?string} replaceText If this is a replacement, the text to replace matches with. This is just
     *      stored in the model for later use - the replacement is not actually performed right now.
     * @param {?Promise} candidateFilesPromise If specified, a promise that should resolve with the same set of files that
     *      getCandidateFiles(scope) would return.
     * @return {Promise} A promise that's resolved with the search results or rejected when the find competes.
     */
    function doSearchInScope(queryInfo, scope, filter, replaceText, candidateFilesPromise) {
        clearSearch();
        searchModel.scope = scope;
        if (replaceText !== undefined) {
            searchModel.isReplace = true;
            searchModel.replaceText = replaceText;
        }
        candidateFilesPromise = candidateFilesPromise || getCandidateFiles(scope);
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
     * @return {Promise} A promise that's resolved when the replacement is finished or rejected with an array of errors
     *      if there were one or more errors. Each individual item in the array will be a {item: string, error: string} object,
     *      where item is the full path to the file that could not be updated, and error is either a FileSystem error or one 
     *      of the `FindInFiles.ERROR_*` constants.
     */
    function doReplace(results, replaceText, options) {
        return Async.promiseAlways(FindUtils.performReplacements(results, replaceText, options), function () {
            // For UI integration testing only
            exports._replaceDone = true;
        });
    }
    
    /**
     * @private
     * Moves the search results from the previous path to the new one and updates the results list, if required
     * @param {$.Event} event
     * @param {string} oldName
     * @param {string} newName
     */
    _fileNameChangeHandler = function (event, oldName, newName) {
        var resultsChanged = false;
        
            // Update the search results
        _.forEach(searchModel.results, function (item, fullPath) {
            if (fullPath.indexOf(oldName) === 0) {
                searchModel.removeResults(fullPath);
                searchModel.setResults(fullPath.replace(oldName, newName), item);
                resultsChanged = true;
            }
        });

        if (resultsChanged) {
            searchModel.fireChanged();
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
    _fileSystemChangeHandler = function (event, entry, added, removed) {
        var resultsChanged = false;

        /*
         * Remove existing search results that match the given entry's path
         * @param {(File|Directory)} entry
         */
        function _removeSearchResultsForEntry(entry) {
            Object.keys(searchModel.results).forEach(function (fullPath) {
                if (fullPath === entry.fullPath ||
                        (entry.isDirectory && fullPath.indexOf(entry.fullPath) === 0)) {
                    searchModel.removeResults(fullPath);
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

            return new Promise(function (resolve, reject) {
                var addedFiles = [];

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
                        reject(err);
                        return;
                    }

                    // find additional matches in all added files
                    Async.doInParallel(addedFiles, function (file) {
                        return _doSearchInOneFile(file).then(
                            function (foundMatches) {
                                resultsChanged = resultsChanged || foundMatches;
                            },
                            null
                        );
                    }).then(resolve, resolve);
                });
            });
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
                
                addPromise = new Promise(function (resolve, reject) {
                    entry.getContents(function (err, entries) {
                        Async.doInParallel(entries, _addSearchResultsForEntry).then(resolve, resolve);
                    });
                });
            } else {
                removed.forEach(_removeSearchResultsForEntry);
                addPromise = Async.doInParallel(added, _addSearchResultsForEntry);
            }
        } else { // entry.isFile
            _removeSearchResultsForEntry(entry);
            addPromise = _addSearchResultsForEntry(entry);
        }
        
        Async.promiseAlways(addPromise, function () {
            // Restore the results if needed
            if (resultsChanged) {
                searchModel.fireChanged();
            }
        });
    };
    
    // Public exports
    exports.searchModel          = searchModel;
    exports.doSearchInScope      = doSearchInScope;
    exports.doReplace            = doReplace;
    exports.getCandidateFiles    = getCandidateFiles;
    exports.clearSearch          = clearSearch;
    exports.ZERO_FILES_TO_SEARCH = ZERO_FILES_TO_SEARCH;
    
    // For unit tests only
    exports._documentChangeHandler = _documentChangeHandler;
    exports._fileNameChangeHandler = _fileNameChangeHandler;
    exports._fileSystemChangeHandler = _fileSystemChangeHandler;
});

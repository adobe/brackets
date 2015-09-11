/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $ */

define(function (require, exports, module) {
    "use strict";
    
    var Async               = require("utils/Async"),
        DocumentManager     = require("document/DocumentManager"),
        MainViewManager     = require("view/MainViewManager"),
        FileSystem          = require("filesystem/FileSystem"),
        FileUtils           = require("file/FileUtils"),
        ProjectManager      = require("project/ProjectManager"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        EventDispatcher     = require("utils/EventDispatcher"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        _                   = require("thirdparty/lodash");
    
    var nodeSearchDisabled = false,
        instantSearchDisabled = false,
        indexingInProgress = false,
        nodeSearchCount = 0,
        collapseResults = false;

    EventDispatcher.makeEventDispatcher(exports);

    // define preferences for find in files
    PreferencesManager.definePreference("findInFiles.nodeSearch", "boolean", true, {
        description: Strings.DESCRIPTION_FIND_IN_FILES_NODE
    });
    PreferencesManager.definePreference("findInFiles.instantSearch", "boolean", true, {
        description: Strings.DESCRIPTION_FIND_IN_FILES_INSTANT
    });

    /**
     * returns true if the used disabled node based search in his preferences
     * @return {boolean}
     */
    function _prefNodeSearchDisabled() {
        return !PreferencesManager.get("findInFiles.nodeSearch");
    }

    /**
     * returns true if the used instant search in his preferences
     * @return {boolean}
     */
    function _prefInstantSearchDisabled() {
        return !PreferencesManager.get("findInFiles.instantSearch");
    }

    /**
     * Given a replace string that contains $-expressions, replace them with data from the given
     * regexp match info.
     * NOTE: we can't just use the ordinary replace() function here because the string has been
     * extracted from the original text and so might be missing some context that the regexp matched.
     * @param {string} replaceWith The string containing the $-expressions.
     * @param {Object} match The match data from the regexp.
     * @return {string} The replace text with the $-expressions substituted.
     */
    function parseDollars(replaceWith, match) {
        replaceWith = replaceWith.replace(/(\$+)(\d{1,2}|&)/g, function (whole, dollars, index) {
            if (dollars.length % 2 === 1) { // make sure dollar signs don't escape themselves (like $$1, $$$$&)
                if (index === "&") { // handle $&
                    // slice the first dollar (but leave any others to get unescaped below) and return the
                    // whole match
                    return dollars.substr(1) + (match[0] || "");
                } else {
                    // now we're sure index is an integer, so we can parse it
                    var parsedIndex = parseInt(index, 10);
                    if (parsedIndex !== 0) { // handle $n or $nn, but don't handle $0 or $00
                        // slice the first dollar (but leave any others to get unescaped below) and return the
                        // the corresponding match
                        return dollars.substr(1) + (match[parsedIndex] || "");
                    }
                }
            }
            // this code gets called if the dollar signs escape themselves or if $0/$00 (not handled) was present
            return whole; // return everything to get handled below
        });
        // replace escaped dollar signs (i.e. $$, $$$$, ...) with single ones (unescaping)
        replaceWith = replaceWith.replace(/\$\$/g, "$");
        return replaceWith;
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
        // Double-check that the open document's timestamp matches the one we recorded. This
        // should normally never go out of sync, because if it did we wouldn't start the
        // replace in the first place (due to the fact that we immediately close the search
        // results panel whenever we detect a filesystem change that affects the results),
        // but we want to double-check in case we don't happen to get the change in time.
        // This will *not* handle cases where the document has been edited in memory since 
        // the matchInfo was generated.
        if (doc.diskTimestamp.getTime() !== matchInfo.timestamp.getTime()) {
            return new $.Deferred().reject(exports.ERROR_FILE_CHANGED).promise();
        }

        // Do the replacements in reverse document order so the offsets continue to be correct.
        doc.batchOperation(function () {
            matchInfo.matches.reverse().forEach(function (match) {
                if (match.isChecked) {
                    doc.replaceRange(isRegexp ? parseDollars(replaceText, match.result) : replaceText, match.start, match.end);
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
                    result.push(isRegexp ? parseDollars(replaceText, match.result) : replaceText);
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
        // If we're forcing files open, or if the document is in the working set but not actually open
        // yet, we want to open the file and do the replacement in memory.
        if (!doc && (options.forceFilesOpen || MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, fullPath) !== -1)) {
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
     * @private
     * Returns true if a search result has any checked matches.
     */
    function hasCheckedMatches(result) {
        return result.matches.some(function (match) { return match.isChecked; });
    }
        
    /**
     * Given a set of search results, replaces them with the given replaceText, either on disk or in memory.
     * Checks timestamps to ensure replacements are not performed in files that have changed on disk since
     * the original search results were generated. However, does *not* check whether edits have been performed
     * in in-memory documents since the search; it's up to the caller to guarantee this hasn't happened.
     * (When called from the standard Find in Files UI, SearchResultsView guarantees this. If called headlessly,
     * the caller needs to track changes.)
     * 
     * Replacements in documents that are already open in memory at the start of the replacement are guaranteed to
     * happen synchronously; replacements in files on disk will return an error if the on-disk file changes between
     * the time performReplacements() is called and the time the replacement actually happens.
     *
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
     *      of the `FindUtils.ERROR_*` constants.
     */
    function performReplacements(results, replaceText, options) {
        return Async.doInParallel_aggregateErrors(Object.keys(results), function (fullPath) {
            return _doReplaceInOneFile(fullPath, results[fullPath], replaceText, options);
        }).done(function () {
            if (options && options.forceFilesOpen) {
                // If the currently selected document wasn't modified by the search, or there is no open document,
                // then open the first modified document.
                var doc = DocumentManager.getCurrentDocument();
                if (!doc ||
                        !results[doc.file.fullPath] ||
                        !hasCheckedMatches(results[doc.file.fullPath])) {
                    // Figure out the first modified document. This logic is slightly different from
                    // SearchResultsView._getSortedFiles() because it doesn't sort the currently open file to
                    // the top. But if the currently open file were in the search results, we wouldn't be
                    // doing this anyway.
                    var sortedPaths = Object.keys(results).sort(FileUtils.comparePaths),
                        firstPath = _.find(sortedPaths, function (path) {
                            return hasCheckedMatches(results[path]);
                        });
                    
                    if (firstPath) {
                        var newDoc = DocumentManager.getOpenDocumentForPath(firstPath);
                        // newDoc might be null if the replacement failed.
                        if (newDoc) {
                            // @todo change the `_edit` call to this:
                            //     
                            ///    CommandManager.execute(Commands.FILE_OPEN, {fullPath: firstPath});
                            //
                            // The problem with doing that is that the promise returned by this
                            // function has already been resolved by `Async.doInParallel()` and
                            // `CommandManager.execute` is an asynchronous operation.
                            // An asynchronous open can't be waited on (since the promise has been  
                            //  resolved already) so use the synchronous version so that the next `done`
                            //  handler is blocked until the open completes
                            MainViewManager._edit(MainViewManager.ACTIVE_PANE, newDoc);
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Returns label text to indicate the search scope. Already HTML-escaped.
     * @param {?Entry} scope
     * @return {string}
     */
    function labelForScope(scope) {
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
     * Parses the given query into a regexp, and returns whether it was valid or not.
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo
     * @return {{queryExpr: RegExp, valid: boolean, empty: boolean, error: string}}
     *      queryExpr - the regexp representing the query
     *      valid - set to true if query is a nonempty string or a valid regexp.
     *      empty - set to true if query was empty.
     *      error - set to an error string if valid is false and query is nonempty.
     */
    function parseQueryInfo(queryInfo) {
        var queryExpr;

        // TODO: only major difference between this one and the one in FindReplace is that
        // this always returns a regexp even for simple strings. Reconcile.
        if (!queryInfo || !queryInfo.query) {
            return {empty: true};
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
                queryExpr = new RegExp(queryInfo.query, flags);
            } catch (e) {
                return {valid: false, error: e.message};
            }
        } else {
            // Query is a plain string. Turn it into a regexp
            queryExpr = new RegExp(StringUtils.regexEscape(queryInfo.query), flags);
        }
        return {valid: true, queryExpr: queryExpr};
    }

     /**
     * Prioritizes the open file and then the working set files to the starting of the list of files
     * @param {Array.<*>} files An array of file paths or file objects to sort
     * @param {?string} firstFile If specified, the path to the file that should be sorted to the top.
     * @return {Array.<*>}
     */
    function prioritizeOpenFile(files, firstFile) {
        var workingSetFiles = MainViewManager.getWorkingSet(MainViewManager.ALL_PANES),
            workingSetFileFound = {},
            fileSetWithoutWorkingSet = [],
            startingWorkingFileSet = [],
            propertyName = "",
            i = 0;
        firstFile = firstFile || "";

        // Create a working set path map which indicates if a file in working set is found in file list
        for (i = 0; i < workingSetFiles.length; i++) {
            workingSetFileFound[workingSetFiles[i].fullPath] = false;
        }

        // Remove all the working set files from the filtration list
        fileSetWithoutWorkingSet = files.filter(function (key) {
            if (workingSetFileFound[key] !== undefined) {
                workingSetFileFound[key] = true;
                return false;
            }
            return true;
        });

        //push in the first file
        if (workingSetFileFound[firstFile] === true) {
            startingWorkingFileSet.push(firstFile);
            workingSetFileFound[firstFile] = false;
        }
        //push in the rest of working set files already present in file list
        for (propertyName in workingSetFileFound) {
            if (workingSetFileFound.hasOwnProperty(propertyName) && workingSetFileFound[propertyName]) {
                startingWorkingFileSet.push(propertyName);
            }
        }
        return startingWorkingFileSet.concat(fileSetWithoutWorkingSet);
    }


    /**
     * Returns the path of the currently open file or null if there isn't one open
     * @return {?string}
     */
    function getOpenFilePath() {
        var currentDoc = DocumentManager.getCurrentDocument();
        return currentDoc ? currentDoc.file.fullPath : null;
    }

    /**
     * enable/disable instant search
     * @param {boolean} disable true to disable node based search
     */
    function setInstantSearchDisabled(disable) {
        instantSearchDisabled = disable;
    }

    /**
     * if instant search is disabled, this will return true we can only do instant search through node
     * @return {boolean}
     */
    function isInstantSearchDisabled() {
        return _prefNodeSearchDisabled() || _prefInstantSearchDisabled() || nodeSearchDisabled || instantSearchDisabled;
    }

    /**
     * enable/disable node based search
     * @param {boolean} disable true to disable node based search
     */
    function setNodeSearchDisabled(disable) {
        if (disable) {
            // only set disable. Enabling node earch doesnt mean we have to enable instant search.
            setInstantSearchDisabled(disable);
        }
        nodeSearchDisabled = disable;
    }

    /**
     * if node search is disabled, this will return true
     * @return {boolean}
     */
    function isNodeSearchDisabled() {
        return _prefNodeSearchDisabled() || nodeSearchDisabled;
    }

    /**
     * check if a search is progressing in node
     * @return {Boolean} true if search is processing in node
     */
    function isNodeSearchInProgress() {
        if (nodeSearchCount === 0) {
            return false;
        } else {
            return true;
        }
    }


    /**
     * Raises an event when the file filters applied to a search changes
     */
    function notifyFileFiltersChanged() {
        exports.trigger(exports.SEARCH_FILE_FILTERS_CHANGED);
    }

    /**
     * Raises an event when the search scope changes[say search in a sub drictory in the project]
     */
    function notifySearchScopeChanged() {
        exports.trigger(exports.SEARCH_SCOPE_CHANGED);
    }

    /**
     * Notifies that a node search has started so that we FindUtils can figure out
     * if any outstanding node search requests are pendind
     */
    function notifyNodeSearchStarted() {
        nodeSearchCount++;
    }

    /**
     * Notifies that a node search has finished so that we FindUtils can figure out
     * if any outstanding node search requests are pendind
     */
    function notifyNodeSearchFinished() {
        nodeSearchCount--;
    }

    /**
     * Notifies that a node has started indexing the files
     */
    function notifyIndexingStarted() {
        indexingInProgress = true;
        exports.trigger(exports.SEARCH_INDEXING_STARTED);
    }

    /**
     * Notifies that a node has finished indexing the files
     */
    function notifyIndexingFinished() {
        indexingInProgress = false;
        exports.trigger(exports.SEARCH_INDEXING_FINISHED);
    }

    /**
     * Return true if indexing is in pregress in node
     * @return {boolean} true if files are being indexed in node
     */
    function isIndexingInProgress() {
        return indexingInProgress;
    }

    /**
     * Set if we need to collapse all results in the results pane
     * @param {boolean} collapse true to collapse
     */
    function setCollapseResults(collapse) {
        collapseResults = collapse;
        exports.trigger(exports.SEARCH_COLLAPSE_RESULTS);
    }

    /**
     * check if results should be collapsed
     * @return {boolean} true if results should be collapsed
     */
    function isCollapsedResults() {
        return collapseResults;
    }

    /**
     * Returns the health data pertaining to Find in files
     */
    function getHealthReport() {
        return {
            prefNodeSearchDisabled : _prefNodeSearchDisabled(),
            prefInstantSearchDisabled : _prefInstantSearchDisabled()
        };
    }

    exports.parseDollars                    = parseDollars;
    exports.hasCheckedMatches               = hasCheckedMatches;
    exports.performReplacements             = performReplacements;
    exports.labelForScope                   = labelForScope;
    exports.parseQueryInfo                  = parseQueryInfo;
    exports.prioritizeOpenFile              = prioritizeOpenFile;
    exports.getOpenFilePath                 = getOpenFilePath;
    exports.setNodeSearchDisabled           = setNodeSearchDisabled;
    exports.isNodeSearchDisabled            = isNodeSearchDisabled;
    exports.setInstantSearchDisabled        = setInstantSearchDisabled;
    exports.isInstantSearchDisabled         = isInstantSearchDisabled;
    exports.isNodeSearchInProgress          = isNodeSearchInProgress;
    exports.isIndexingInProgress            = isIndexingInProgress;
    exports.setCollapseResults              = setCollapseResults;
    exports.isCollapsedResults              = isCollapsedResults;
    exports.getHealthReport                 = getHealthReport;
    exports.ERROR_FILE_CHANGED              = "fileChanged";

    // event notification functions
    exports.notifyFileFiltersChanged        = notifyFileFiltersChanged;
    exports.notifySearchScopeChanged        = notifySearchScopeChanged;
    exports.notifyNodeSearchStarted         = notifyNodeSearchStarted;
    exports.notifyNodeSearchFinished        = notifyNodeSearchFinished;
    exports.notifyIndexingStarted           = notifyIndexingStarted;
    exports.notifyIndexingFinished          = notifyIndexingFinished;

    // events raised by FindUtils
    exports.SEARCH_FILE_FILTERS_CHANGED              = "fileFiltersChanged";
    exports.SEARCH_SCOPE_CHANGED                     = "searchScopeChanged";
    exports.SEARCH_INDEXING_STARTED                  = "searchIndexingStarted";
    exports.SEARCH_INDEXING_FINISHED                 = "searchIndexingFinished";
    exports.SEARCH_COLLAPSE_RESULTS                  = "searchCollapseResults";
});

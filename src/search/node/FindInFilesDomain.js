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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global setImmediate*/

(function () {
    "use strict";
    
    var fs = require("fs");
    var projectCache = [];
    var files;
    var MAX_DISPLAY_LENGTH = 200,
        MAX_TOTAL_RESULTS = 100000, // only 100,000 search results are supported
        MAX_RESULTS_IN_A_FILE = MAX_TOTAL_RESULTS,
        RESULTS_PER_PAGE = 100,
        MAX_RESULTS_TO_RETURN = 120;
    
    var resultSet = [],
        results = {},
        numMatches = 0,
        numFiles = 0,
        foundMaximum = false,
        currentPage,
        totalPages,
        evaluatedPages,
        nextPageStartingFile,
        offset,
        totalMatches = 0,
        exceedsMaximum = false,
        currentCrawlIndex = 0,
        crawlComplete = false,
        savedSearchObject = null,
        queryObject = {},
        filesChanged = false;
    
    function offsetToLineNum(textOrLines, offset) {
        if (Array.isArray(textOrLines)) {
            var lines = textOrLines,
                total = 0,
                line;
            for (line = 0; line < lines.length; line++) {
                if (total < offset) {
                    // add 1 per line since /n were removed by splitting, but they needed to 
                    // contribute to the total offset count
                    total += lines[line].length + 1;
                } else if (total === offset) {
                    return line;
                } else {
                    return line - 1;
                }
            }

            // if offset is NOT over the total then offset is in the last line
            if (offset <= total) {
                return line - 1;
            } else {
                return undefined;
            }
        } else {
            return textOrLines.substr(0, offset).split("\n").length - 1;
        }
    }
    
    function _getSearchMatches(contents, queryExpr) {
        if (!contents) {
            return;
        }
        // Quick exit if not found or if we hit the limit
        if (foundMaximum || contents.search(queryExpr) === -1) {
            return [];
        }

        var match, lineNum, line, ch, totalMatchLength, matchedLines, numMatchedLines, lastLineLength, endCh,
            padding, leftPadding, rightPadding, highlightOffset, highlightEndCh,
            lines   = contents.split("\n"),
            matches = [];

        while ((match = queryExpr.exec(contents)) !== null) {
            lineNum          = offsetToLineNum(lines, match.index);
            line             = lines[lineNum];
            ch               = match.index - contents.lastIndexOf("\n", match.index) - 1;  // 0-based index
            matchedLines     = match[0].split("\n");
            numMatchedLines  = matchedLines.length;
            totalMatchLength = match[0].length;
            lastLineLength   = matchedLines[matchedLines.length - 1].length;
            endCh            = (numMatchedLines === 1 ? ch + totalMatchLength : lastLineLength);
            highlightEndCh   = (numMatchedLines === 1 ? endCh : line.length);
            highlightOffset  = 0;

            if (highlightEndCh <= MAX_DISPLAY_LENGTH) {
                // Don't store more than 200 chars per line
                line = line.substr(0, Math.min(MAX_DISPLAY_LENGTH, line.length));
            } else if (totalMatchLength > MAX_DISPLAY_LENGTH) {
                // impossible to display the whole match
                line = line.substr(ch, ch + MAX_DISPLAY_LENGTH);
                highlightOffset = ch;
            } else {
                // Try to have both beginning and end of match displayed
                padding = MAX_DISPLAY_LENGTH - totalMatchLength;
                rightPadding = Math.floor(Math.min(padding / 2, line.length - highlightEndCh));
                leftPadding = Math.ceil(padding - rightPadding);
                highlightOffset = ch - leftPadding;
                line = line.substring(highlightOffset, highlightEndCh + rightPadding);
            }

            matches.push({
                start:       {line: lineNum, ch: ch},
                end:         {line: lineNum + numMatchedLines - 1, ch: endCh},

                highlightOffset: highlightOffset,

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
            // Adds one over MAX_RESULTS_IN_A_FILE in order to know if the search has exceeded
            // or is equal to MAX_RESULTS_IN_A_FILE. Additional result removed in SearchModel
            if (matches.length > MAX_RESULTS_IN_A_FILE) {
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
    
    function clearProjectCache() {
        projectCache = [];
    }

    function getFileContentsForFile(filePath) {
        if (projectCache[filePath]) {
            return projectCache[filePath];
        }
        try {
            projectCache[filePath] = fs.readFileSync(filePath, 'utf8');
        } catch (ex) {
            console.log(ex);
            projectCache[filePath] = null;
        }
        return projectCache[filePath];
    }
    
    function setResults(fullpath, resultInfo, maxResultsToReturn) {
        if (results[fullpath]) {
            numMatches -= results[fullpath].matches.length;
            delete results[fullpath];
        }

        if (foundMaximum || !resultInfo || !resultInfo.matches || !resultInfo.matches.length) {
            return;
        }

        // Make sure that the optional `collapsed` property is explicitly set to either true or false,
        // to avoid logic issues later with comparing values.
        resultInfo.collapsed = !!resultInfo.collapsed;

        results[fullpath] = resultInfo;
        numMatches += resultInfo.matches.length;
//        maxResultsToReturn = maxResultsToReturn || MAX_RESULTS_TO_RETURN;
        if (numMatches >= RESULTS_PER_PAGE) {
            foundMaximum = true;
            offset = 0;
            // Remove final result if there have been over MAX_TOTAL_RESULTS found
            if (numMatches > RESULTS_PER_PAGE) {
                console.log('Page #' + currentPage + ' : numMatches more than MAX_Results');
                console.log('length for last item of page: ' + results[fullpath].matches.length + ' numMatches: ' + numMatches);
                offset = results[fullpath].matches.length - (numMatches - RESULTS_PER_PAGE);
                results[fullpath].matches = results[fullpath].matches.slice(0, offset);
                if (offset === RESULTS_PER_PAGE) {
                    var i = currentPage - 1;
                    while ((i >= 0) && resultSet[i][fullpath]) {
                        offset += resultSet[i][fullpath].matches.length;
                        i--;
                    }
                }
                numMatches -= (numMatches - RESULTS_PER_PAGE);
            }
        }
    }
    
    function _doSearchInOneFile(filepath, text, queryExpr, dontSetResults) {

        var matches = _getSearchMatches(text, queryExpr);
        if (!dontSetResults) {
            setResults(filepath, {matches: matches});
        } else {
            return {
                'filepath': filepath,
                'matches' : matches
            };
        }
    }

    function doSearchInFiles(fileList, queryExpr) {
        var i;
        for (i = 0; i < fileList.length && !foundMaximum; i++) {
            _doSearchInOneFile(fileList[i], getFileContentsForFile(fileList[i]), queryExpr);
        }
        resultSet[currentPage] = results;
        evaluatedPages++;

        console.log("Evaluated page#" + evaluatedPages);
        if (currentPage !== totalPages - 1) {
            if (offset) {
                nextPageStartingFile = i - 1;
            } else {
                nextPageStartingFile = i;
            }
        }
    }
    
    function doSearchInFilesNextPage(fileList, queryExpr) {
        console.log('doSearchInFilesNextPage' + offset);
        var i;
        var matchedResults;
        if (resultSet[currentPage]) {
            return;
        }

        for (i = nextPageStartingFile; i < fileList.length && !foundMaximum; i++) {
            if (i === nextPageStartingFile) {
                console.log('before');
                matchedResults = _doSearchInOneFile(fileList[i], getFileContentsForFile(fileList[i]), queryExpr, true);
                console.log('after');
                matchedResults.matches = matchedResults.matches.slice(offset);
                console.log('after1.5 ' + matchedResults.matches.length);
                setResults(fileList[i], {matches: matchedResults.matches});
                console.log('after2');
            } else {
                _doSearchInOneFile(fileList[i], getFileContentsForFile(fileList[i]), queryExpr);
            }
        }
        resultSet[currentPage] = results;
        evaluatedPages++;
        console.log("Evaluated page#" + evaluatedPages);
        if (currentPage !== totalPages - 1) {
            if (offset) {
                nextPageStartingFile = i - 1;
            } else {
                nextPageStartingFile = i;
            }
        }
    }

//    function doSearchInFilesLastPage(fileList, queryExpr, pageLength) {
//
//    }
    
    function regexEscape(str) {
        return str.replace(/([.?*+\^$\[\]\\(){}|\-])/g, "\\$1");
    }
    
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
            queryExpr = new RegExp(regexEscape(queryInfo.query), flags);
        }
        return {valid: true, queryExpr: queryExpr};
    }
    
    function fileCrawler() {
        crawlComplete = false;
        if (!files || (files && files.length === 0)) {
            setTimeout(fileCrawler, 1000);
            return;
        }
        var i = 0;
        for (i = 0; i < 10 && currentCrawlIndex < files.length; i = i + 1) {
            getFileContentsForFile(files[currentCrawlIndex]);
            currentCrawlIndex++;
        }
        if (currentCrawlIndex < files.length) {
            console.log("crawling scheduled");
            setImmediate(fileCrawler);
        } else {
            crawlComplete = true;
            setTimeout(fileCrawler, 1000);
        }
    }

    function initCache(fileList) {
        console.log("cache change");
        files = fileList;
        currentCrawlIndex = 0;
        clearProjectCache();
        return true;
    }
    
    function _countNumMatches(contents, queryExpr) {
        if (!contents) {
            console.log('NO contents');
            return 0;
        }
        var matches = contents.match(queryExpr);
        if (matches && isNaN(matches.length)) {
            console.log('contents for nan' + contents);
            console.log(JSON.stringify(matches));
        }
        return matches ? matches.length : 0;
    }

    function getNumMatches(fileList, queryExpr) {
        console.log('getNumatches');
        var i,
            matches = 0;
        for (i = 0; i < fileList.length; i++) {
            var temp = _countNumMatches(getFileContentsForFile(fileList[i]), queryExpr);
            if (temp) {
                numFiles++;
                matches += temp;
            }
        }
        console.log('for completed' + matches);
        return matches;
    }

    function doSearch(searchObject) {
        console.log("doSearch");
        filesChanged = false;// On a fresh search we are starting from scratch anyway
        files = searchObject.files;
        currentPage = 0;
        evaluatedPages = 0;
        if (!files) {
            console.log("no file object found");
            return {};
        }
        resultSet = [];
        results = {};
        numMatches = 0;
        numFiles = 0;
        foundMaximum = false;
        exceedsMaximum = false;
        queryObject = parseQueryInfo(searchObject.queryInfo);
        doSearchInFiles(files, queryObject.queryExpr);
        if (!crawlComplete) {
            totalMatches = numMatches;
            numFiles = resultSet[currentPage].length;
        } else {
            totalMatches = getNumMatches(files, queryObject.queryExpr);
            totalPages = Math.ceil(totalMatches / RESULTS_PER_PAGE);
        }
        var send_object = {
            "results":  resultSet[currentPage],
            "numMatches": totalMatches,
            "numFiles": numFiles,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        return send_object;
//        var resultKeys = Object.keys(resultSet[currentPage]);
//        return {"msg" : "searchComplete", "result" : send_object};
    }
    
    function removeFilesFromCache(updateObject) {
        filesChanged = true;
        var fileList = updateObject.fileList || [],
            filesInSearchScope = updateObject.filesInSearchScope || [],
            i = 0;
        for (i = 0; i < fileList.length; i = 1 + 1) {
            delete projectCache[fileList[i]];
        }
        function isNotInRemovedFilesList(path) {
            return (filesInSearchScope.indexOf(path) === -1) ? true : false;
        }
        files = files ? files.filter(isNotInRemovedFilesList) : files;
    }

    function addFilesToCache(updateObject) {
        filesChanged = true;
        var fileList = updateObject.fileList || [],
            filesInSearchScope = updateObject.filesInSearchScope || [],
            i = 0,
            changedFilesAlreadyInList = [],
            newFiles = [];
        for (i = 0; i < fileList.length; i = 1 + 1) {
            // We just add a null entry indicating the precense of the file in the project list.
            // The file will be later read when required.
            projectCache[fileList[i]] = null;
        }

        //Now update the search scoepe
        function isInChangedFileList(path) {
            return (filesInSearchScope.indexOf(path) !== -1) ? true : false;
        }
        changedFilesAlreadyInList = files ? files.filter(isInChangedFileList) : [];
        function isNotAlreadyInList(path) {
            return (changedFilesAlreadyInList.indexOf(path) === -1) ? true : false;
        }
        newFiles = changedFilesAlreadyInList.filter(isNotAlreadyInList);
        files.push.apply(files, newFiles);
    }

    function getNextPageofSearchResults() {
        console.log("getNextPageofSearchResults" + numMatches);
        if (!files) {
            console.log("no file object found");
            return {};
        }
        currentPage++;
        if (!resultSet[currentPage]) {  //(typeof resultSet[currentPage] === 'undefined') {
            results = {};
            numMatches = 0;
            foundMaximum = false;
            exceedsMaximum = false;
            doSearchInFilesNextPage(files, queryObject.queryExpr);
        }
        var send_object = {
            "results":  resultSet[currentPage],
            "numMatches": totalMatches,
            "numFiles": numFiles,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        return send_object;
//        var resultKeys = Object.keys(resultSet[currentPage]);
//        return {"msg" : "receivedNextPage", "result" : send_object};
    }

    function getPrevPageofSearchResults() {
        console.log("getPrevPageofSearchResults" + numMatches);
        currentPage--;
        var send_object = {
            "results":  resultSet[currentPage],
            "numMatches": totalMatches,
            "numFiles": numFiles,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        return send_object;
//        var resultKeys = Object.keys(resultSet[currentPage]);
//        return {"msg" : "receivedPrevPage", "result" : send_object};
    }

    function getFirstPageofSearchResults() {
        console.log("getFirstPageofSearchResults" + numMatches);
        currentPage = 0;
        var send_object = {
            "results":  resultSet[0],
            "numMatches": totalMatches,
            "numFiles": numFiles,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        return send_object;
//        var resultKeys = Object.keys(resultSet[currentPage]);
//        return {"msg" : "receivedFirstPage", "result" : send_object};
    }

    function getLastPageofSearchResults() {
        console.log("getLastPageofSearchResults" + numMatches);
        if (!files) {
            console.log("no file object found");
            return {};
        }

        while (evaluatedPages < totalPages) {
            currentPage = evaluatedPages;
            getNextPageofSearchResults();
            console.log("Last page click: Evaluated page#" + evaluatedPages);
        }

        currentPage = totalPages - 1;
        var send_object = {
            "results":  resultSet[currentPage],
            "numMatches": totalMatches,
            "numFiles": numFiles,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        return send_object;
//        var resultKeys = Object.keys(resultSet[currentPage]);
//        return {"msg" : "receivedLastPage", "result" : send_object};
    }

    function getAllResults() {
        var send_object = {
            "results":  {},
            "numMatches": 0,
            "foundMaximum":  false,
            "exceedsMaximum":  false
        };
        if (!savedSearchObject) {
            return send_object;
        }
        savedSearchObject.startFileIndex = 0;
        savedSearchObject.maxResultsToReturn = MAX_TOTAL_RESULTS;
        return doSearch(savedSearchObject);
    }

    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain("FindInFiles")) {
            domainManager.registerDomain("FindInFiles", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "initCache",    // command name
            initCache,   // command handler function
            false,          // this command is synchronous in Node
            "Caches the project for find in files in node",
            [{name: "fileList", // parameters
                type: "Array",
                description: "List of all project files - Path only"}],
            [{name: "sdf", // return values
                type: "boolean",
                description: "don't know yet"}]
        );
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "doSearch",    // command name
            doSearch,   // command handler function
            false,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [{name: "search_object", // parameters
                type: "object",
                description: "Object containing search data"}],
            [{name: "searchResults", // return values
                type: "object",
                description: "Object containing results of the search"}]
        );
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "nextPage",    // command name
            getNextPageofSearchResults,   // command handler function
            false,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [],
            [{name: "searchResults", // return values
                type: "object",
                description: "Object containing results of the search"}]
        );
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "prevPage",    // command name
            getPrevPageofSearchResults,   // command handler function
            false,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [],
            [{name: "searchResults", // return values
                type: "object",
                description: "Object containing results of the search"}]
        );
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "firstPage",    // command name
            getFirstPageofSearchResults,   // command handler function
            false,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [],
            [{name: "searchResults", // return values
                type: "object",
                description: "Object containing results of the search"}]
        );
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "lastPage",    // command name
            getLastPageofSearchResults,   // command handler function
            false,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [],
            [{name: "searchResults", // return values
                type: "string",
                description: "Object containing results of the search"}]
        );
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "getAllResults",    // command name
            getAllResults,   // command handler function
            false,          // this command is synchronous in Node
            "get the next page of reults",
            [{name: "search_object", // parameters
                type: "object",
                description: "Object containing search data"}],
            [{name: "searchResults", // return values
                type: "object",
                description: "Object containing results of the search"}]
        );
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "filesChanged",    // command name
            addFilesToCache,   // command handler function
            false,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [{name: "updateObject", // parameters
                type: "object",
                description: "Object containing list of changed files"}],
            [{name: "searchResults", // return values
                type: "object",
                description: "Object containing results of the search"}]
        );
        domainManager.registerCommand(
            "FindInFiles",       // domain name
            "filesRemoved",    // command name
            removeFilesFromCache,   // command handler function
            false,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [{name: "updateObject", // parameters
                type: "object",
                description: "Object containing list of removed files"}],
            [{name: "searchResults", // return values
                type: "object",
                description: "Object containing results of the search"}]
        );
        setTimeout(fileCrawler, 5000);
    }
    
    exports.init = init;
    
}());

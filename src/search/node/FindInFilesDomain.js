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
        MAX_RESULTS_TO_RETURN = 120;
    
    var results = {},
        numMatches = 0,
        foundMaximum = false,
        exceedsMaximum = false,
        currentCrawlIndex = 0,
        savedSearchObject = null,
        lastSearchedIndex = 0;
    
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
        maxResultsToReturn = maxResultsToReturn || MAX_RESULTS_TO_RETURN;
        if (numMatches >= maxResultsToReturn || numMatches >= MAX_TOTAL_RESULTS) {
            foundMaximum = true;

            // Remove final result if there have been over MAX_TOTAL_RESULTS found
            if (numMatches > maxResultsToReturn) {
                results[fullpath].matches.pop();
                numMatches--;
                exceedsMaximum = true;
            }
        }
    }
    
    function _doSearchInOneFile(filepath, text, queryExpr, maxResultsToReturn) {
        var matches = _getSearchMatches(text, queryExpr);
        setResults(filepath, {matches: matches}, maxResultsToReturn);
    }
    
    function doSearchInFiles(fileList, queryExpr, startFileIndex, maxResultsToReturn) {
        var i;
        if (fileList.length === 0) {
            console.log('no files found');
            return;

        } else {
            startFileIndex = startFileIndex || 0;
            for (i = startFileIndex; i < fileList.length && !foundMaximum; i++) {
                _doSearchInOneFile(fileList[i], getFileContentsForFile(fileList[i]), queryExpr, maxResultsToReturn);
            }
            lastSearchedIndex = i;
        }
    }
    
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
    
    function doSearch(searchObject) {
        console.log("doSearch");
        
        savedSearchObject = searchObject;
        if (!files) {
            console.log("no file object found");
            return {};
        }
        results = {};
        numMatches = 0;
        foundMaximum = false;
        exceedsMaximum = false;
        var queryObject = parseQueryInfo(searchObject.queryInfo);
        if (searchObject.files) {
            files = searchObject.files;
        }
        doSearchInFiles(files, queryObject.queryExpr, searchObject.startFileIndex, searchObject.maxResultsToReturn);
        var send_object = {
            "results":  results,
            "numMatches": numMatches,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        console.log("returning " + numMatches + "results");
        return send_object;
    }
    
    function getNextPage() {
        var send_object = {
            "results":  {},
            "numMatches": 0,
            "foundMaximum":  false,
            "exceedsMaximum":  false
        };
        if (!savedSearchObject) {
            return send_object;
        }
        savedSearchObject.startFileIndex = lastSearchedIndex;
        return doSearch(savedSearchObject);
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
            getNextPage,   // command handler function
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
        setTimeout(fileCrawler, 5000);
    }
    
    exports.init = init;
    
}());

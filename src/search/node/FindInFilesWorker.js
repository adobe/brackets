/*
 * Copyright (c) 2015 Adobe Systems Incorporated. All rights reserved.
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

(function () {
    "use strict";
    
    var fs = require("fs");
    var projectCache = {};
    var files;
    var MAX_DISPLAY_LENGTH = 200,
        RESULTS_PER_PAGE = 100,
        MAX_TOTAL_RESULTS = 100;
    
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
        queryObject;
    
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
            // Adds one over MAX_TOTAL_RESULTS in order to know if the search has exceeded
            // or is equal to MAX_TOTAL_RESULTS. Additional result removed in SearchModel
            if (matches.length > 100000) {
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
    
    function getFileContentsForFile(filePath) {
        if (projectCache[filePath]) {
            return projectCache[filePath];
        }
        
        projectCache[filePath] = fs.readFileSync(filePath, 'utf8');
        return projectCache[filePath];
    }
    
    function setResults(fullpath, resultInfo) {
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
        if (numMatches >= MAX_TOTAL_RESULTS) {
            foundMaximum = true;
            offset = 0;
            // Remove final result if there have been over MAX_TOTAL_RESULTS found
            if (numMatches > MAX_TOTAL_RESULTS) {
                console.log('Page #' + currentPage + ' : numMatches more than MAX_Results');
                console.log('length for last item of page: ' + results[fullpath].matches.length + ' numMatches: ' + numMatches);
                offset = results[fullpath].matches.length - (numMatches - MAX_TOTAL_RESULTS);
                results[fullpath].matches = results[fullpath].matches.slice(0, offset);
                numMatches -= (numMatches - MAX_TOTAL_RESULTS);
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
        
    function doSearchInFilesLastPage(fileList, queryExpr, pageLength) {
    
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
    
    function initCache(fileList) {
        console.log('Child Log');
        var allFiles = fileList;
        
        allFiles.forEach(function (file) {
            getFileContentsForFile(file);
        });
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
        files = searchObject.files;
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
        totalMatches = getNumMatches(files, queryObject.queryExpr);
        totalPages = Math.ceil(totalMatches / RESULTS_PER_PAGE);
        var send_object = {
            "results":  resultSet[currentPage],
            "numMatches": totalMatches,
            "numFiles": numFiles,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        var resultKeys = Object.keys(resultSet[currentPage]);
        return send_object;
    }
    
    function getNextPageofSearchResults() {
        console.log("getNextPageofSearchResults" + numMatches);
        if (!files) {
            console.log("no file object found");
            return {};
        }
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
        var resultKeys = Object.keys(resultSet[currentPage]);
        return send_object;
    }
    
    function getPrevPageofSearchResults() {
        console.log("getPrevPageofSearchResults" + numMatches);

        var send_object = {
            "results":  resultSet[currentPage],
            "numMatches": totalMatches,
            "numFiles": numFiles,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        var resultKeys = Object.keys(resultSet[currentPage]);
        return send_object;
    }
    
    function getFirstPageofSearchResults() {
        console.log("getFirstPageofSearchResults" + numMatches);

        var send_object = {
            "results":  resultSet[0],
            "numMatches": totalMatches,
            "numFiles": numFiles,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        var resultKeys = Object.keys(resultSet[currentPage]);
        return send_object;
    }

    function getLastPageofSearchResults() {
        console.log("getLastPageofSearchResults" + numMatches);
        if (!files) {
            console.log("no file object found");
            return {};
        }
        
        while (evaluatedPages < totalPages){
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
        var resultKeys = Object.keys(resultSet[currentPage]);
        return send_object;
    }
    
    function shutDown() {
        console.log("In ChildProcess: Child Process is about to exit.. ");
        process.exit(0);
    }
    
    process.on('message', function (command) {
        var data;
        var result;
        if (command.msg === "initCache") {
            var fileList = command.fileList;
            var bool = initCache(fileList);
            data = {"msg" : "cacheComplete", "result" : bool};
            process.send(data);

        } else if (command.msg === "doSearch") {
            var searchObject = command.searchObject;
            currentPage = 0;
            evaluatedPages = 0;
            result = doSearch(searchObject);
            data = {"msg" : "searchComplete", "result" : result};
            process.send(data);
        } else if (command.msg === "getNextPage") {
            currentPage++;
            result = getNextPageofSearchResults();
            data = {"msg" : "receivedNextPage", "result" : result};
            process.send(data);
        } else if (command.msg === "getPrevPage") {
            currentPage--;
            result = getPrevPageofSearchResults();
            data = {"msg" : "receivedPrevPage", "result" : result};
            process.send(data);
        } else if (command.msg === "getFirstPage") {
            currentPage = 0;
            var result = getFirstPageofSearchResults();
            data = {"msg" : "receivedFirstPage", "result" : result};
            process.send(data);
        } else if (command.msg === "getLastPage") {
            result = getLastPageofSearchResults();
            data = {"msg" : "receivedLastPage", "result" : result};
            process.send(data);
        } else if (command.msg === "shutDown") {
            shutDown();
        }
        
    });
    
}());
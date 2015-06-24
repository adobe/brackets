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

(function () {
    "use strict";
    
    var fs = require("fs");
    var projectCache = {};
    var files;
    var MAX_DISPLAY_LENGTH = 200,
        RESULTS_PER_PAGE = 100,
        MAX_TOTAL_RESULTS = 100;
    
    var results = {},
        numMatches = 0,
        foundMaximum = false,
        fileTopIndex = -1,
        fileBottomIndex = -1,
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
            if (matches.length > MAX_TOTAL_RESULTS) {
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
//        fs.readFile(filePath, function (err, data) {
//            if (err) {
//                console.error("Error");
//            } else {
//                console.log("File contents" + data);
//            }
//        });
        
        
        projectCache[filePath] = fs.readFileSync(filePath, 'utf8');
        return projectCache[filePath];
        
//        return fs.readFileSync(filePath, 'utf8');
        
    }
    
    function setResults(fullpath, resultInfo) {
        console.log("In setResults");
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

            // Remove final result if there have been over MAX_TOTAL_RESULTS found
            if (numMatches > MAX_TOTAL_RESULTS) {
                console.log('numMatches more than MAX_Results');
                results[fullpath].matches = results[fullpath].matches.slice(0, results[fullpath].matches.length - (numMatches - MAX_TOTAL_RESULTS));
                numMatches -= (numMatches - MAX_TOTAL_RESULTS);
                
                console.log('length for last item of page: ' + results[fullpath].matches.length + ' numMatches: ' + numMatches);
                //exceedsMaximum = true;
            }
        }
        console.log('setResults. Filepath: ' + fullpath + '  :matches: ' + results[fullpath].matches.length + ' numMatches: ' + numMatches);
    }
    
    function _doSearchInOneFile(filepath, text, queryExpr, dontSetResults) {
        
        var matches = _getSearchMatches(text, queryExpr);
        //console.log('doSearchInoncefile' + filepath + '  :matches:' + matches.length + ' numMatches: ' + numMatches);
        //        if (matches.length) {
//            debugger;
//        }
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
        fileTopIndex = 0;
        for (i = 0; i < fileList.length && !foundMaximum; i++) {
            _doSearchInOneFile(fileList[i], getFileContentsForFile(fileList[i]), queryExpr);
        }
        fileBottomIndex = i - 1;
    }
    
    function doSearchInFilesNextPage(fileList, queryExpr, offset) {
        console.log('doSearchInFilesNextPage' + offset);
//        var i;
//        fileTopIndex = fileBottomIndex;
//        for (i = fileTopIndex + 1; i < fileList.length && !foundMaximum; i++) {
//            _doSearchInOneFile(fileList[i], getFileContentsForFile(fileList[i]), queryExpr);
//        }
//        fileBottomIndex = i - 1;
        
        var i;
        fileTopIndex = fileBottomIndex;
        var matchedResults;
        //var matchedResults = _doSearchInOneFile(fileList[fileTopIndex], getFileContentsForFile(fileList[fileTopIndex]), queryExpr, true);
        //console.log('1');
//        var reversedResults = [],
//            top;
        //matchedResults.matches = matchedResults.matches.slice(matchedResults.length - offset);
        //console.log('2');
        //reversedResults.push(matchedResults);
        for (i = fileTopIndex; i < fileList.length && !foundMaximum; i++) {
            if (i === fileTopIndex) {
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
        fileBottomIndex = i - 1;
    }
    
    function doSearchInFilesPrevPage(fileList, queryExpr, offset) {
        console.log('doSearchInFilesPrevPage'+(fileTopIndex) + '$'+  fileList[fileTopIndex] + 'offset:' + offset);
        var i;
        fileBottomIndex = fileTopIndex;
//        var matchedResults = _doSearchInOneFile(fileList[fileBottomIndex], getFileContentsForFile(fileList[fileBottomIndex]), queryExpr, true);
        var matchedResults;
        console.log('1');
        var reversedResults = [],
            top;
        //matchedResults.matches = matchedResults.matches.slice(0, matchedResults.length - offset);
        console.log('2');
       // reversedResults.push(matchedResults);
        for (i = fileBottomIndex; i >= 0 && !foundMaximum; i--) {
            matchedResults = _doSearchInOneFile(fileList[i], getFileContentsForFile(fileList[i]), queryExpr, true);
            
            if (i === fileBottomIndex) {
                console.log("TOP FILE LENEGTH" + matchedResults.matches.length);
                matchedResults.matches = matchedResults.matches.slice(0, matchedResults.matches.length - offset);
            }

            if (foundMaximum || !matchedResults || !matchedResults.matches || !matchedResults.matches.length) {
                console.log('CONTINUE');
                console.log(fileList[i] + '$' + matchedResults.matches.length);
                continue;
            }
            matchedResults.collapsed = !!matchedResults.collapsed;
            numMatches += matchedResults.matches.length;
            if (numMatches >= MAX_TOTAL_RESULTS) {
                console.log('in');
                foundMaximum = true;

                
                if (numMatches > MAX_TOTAL_RESULTS) {
                    matchedResults.matches = matchedResults.matches.slice(0, matchedResults.matches.length - (numMatches - MAX_TOTAL_RESULTS));
                    numMatches -= (numMatches - MAX_TOTAL_RESULTS);
                    //exceedsMaximum = true;
                }
                
                console.log('out');
            }
            console.log('setResults in PREV. Filepath: ' + fileList[i] + '  :matches: ' + matchedResults.matches.length + ' numMatches: ' + numMatches);
            reversedResults.push(matchedResults);
            
        }
        console.log('3');
        results = {};
        while(top = reversedResults.pop()) {
            results[top.filepath] = {
                matches: top.matches,
                collapsed: top.collapsed
            };
        }
        fileTopIndex = i;
    }
    
    function doSearchInFilesLastPage(fileList, queryExpr, pageLength) {
        console.log('doSearchInFilesLastPage'+(fileList.length - 1) + '$'+  fileList[fileList.length - 1] + 'pageLength:' + pageLength);
        var i;
        fileBottomIndex = fileList.length - 1;
//        var matchedResults = _doSearchInOneFile(fileList[fileBottomIndex], getFileContentsForFile(fileList[fileBottomIndex]), queryExpr, true);
        var matchedResults;
        console.log('1');
        var reversedResults = [],
            top;
        //matchedResults.matches = matchedResults.matches.slice(0, matchedResults.length - offset);
        console.log('2');
       // reversedResults.push(matchedResults);
        for (i = fileBottomIndex; i >= 0 && !foundMaximum; i--) {
            matchedResults = _doSearchInOneFile(fileList[i], getFileContentsForFile(fileList[i]), queryExpr, true);

            if (foundMaximum || !matchedResults || !matchedResults.matches || !matchedResults.matches.length) {
                console.log('CONTINUE');
                console.log(fileList[i] + '$' + matchedResults.matches.length);
                continue;
            }
            matchedResults.collapsed = !!matchedResults.collapsed;
            numMatches += matchedResults.matches.length;
            if (numMatches >= pageLength) {
                console.log('in');
                foundMaximum = true;

                
                if (numMatches > pageLength) {
                    matchedResults.matches = matchedResults.matches.slice(numMatches - pageLength);
                    // numMatches = pageLength?
                    numMatches -= (numMatches - pageLength);
                    //exceedsMaximum = true;
                }
                
                console.log('out');
            }
            console.log('setResults in PREV. Filepath: ' + fileList[i] + '  :matches: ' + matchedResults.matches.length + ' numMatches: ' + numMatches);
            reversedResults.push(matchedResults);
            
        }
        console.log('out of for loop');
        results = {};
        while(top = reversedResults.pop()) {
            results[top.filepath] = {
                matches: top.matches,
                collapsed: top.collapsed
            };
        }
        fileTopIndex = i;
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
        var i;
        files = fileList;
        // Temporarily increase caching time for testing
        for (i = 0; i < 1; i++) {
            files.forEach(function (file) {
                getFileContentsForFile(file);
            });
        }
        return true;
    }
    
    function _countNumMatches(contents, queryExpr) {
        if (!contents) {
            console.log('NO contents');
            return 0;
        } 
        var matches = contents.match(queryExpr);
        //console.log('countnum1')
        if (matches && isNaN(matches.length)) {
            console.log('contents for nan' + contents);
            console.log(JSON.stringify(matches));
        }
        //console.log('countnum2')
        return matches ? matches.length : 0;
//        if (matches) {
//            return 10;
//        } else {
//            return 0;
//        }
    }
    
    function getNumMatches(fileList, queryExpr) {
        console.log('getNumatches');
        var i,
            matches = 0;
        for (i = 0; i < fileList.length; i++) {
//            _doSearchInOneFile(fileList[i], getFileContentsForFile(fileList[i]), queryExpr);
//             if (i%100 === 0) {console.log(i);                 }
            var temp = _countNumMatches(getFileContentsForFile(fileList[i]), queryExpr);
            matches += temp;
           
//            if (isNaN(temp)) {
//                console.log('typeof' + typeof temp);
//                console.log("NANANANA");
//            }
//            console.log('nummatches in getnummatches' + matches);
        }
        console.log('for completed' + matches);
        return matches;
    }
    
    function doSearch(searchObject) {
        console.log("doSearch");
        
        if (!files) {
            console.log("no file object found");
            return {};
        }
        results = {};
        numMatches = 0;
        foundMaximum = false;
        exceedsMaximum = false;
        queryObject = parseQueryInfo(searchObject.queryInfo);
        doSearchInFiles(files, queryObject.queryExpr);
        totalMatches = getNumMatches(files, queryObject.queryExpr)
        var send_object = {
            "results":  results,
            "numMatches": totalMatches,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        var resultKeys = Object.keys(results);
        fileTopIndex = files.indexOf(resultKeys[0]);
        fileBottomIndex = files.indexOf(resultKeys.pop());
        return send_object;
    }
    
    function searchResultSlice(index) {
        var searchNumCount = 0,
            resultsClone = {},
            copyProperty = false,
            currentMatches;
        
        Object.keys(results)
            .forEach(function (filePath) {
                currentMatches = results[filePath].matches;
                searchNumCount += currentMatches.length;
                if (copyProperty) {
                    resultsClone[filePath] = results[filePath];
                }
                if (!copyProperty && searchNumCount > index) {
                    resultsClone[filePath] = {matches: currentMatches.slice(currentMatches.length - (searchNumCount - index))};
                    copyProperty = true;
                }
            });
        results = resultsClone;
    }
    
    function getFirstPageofSearchResults(searchObject) {
        console.log("doSearch");
        
        if (!files) {
            console.log("no file object found");
            return {};
        }
        results = {};
        numMatches = 0;
        foundMaximum = false;
        exceedsMaximum = false;
        doSearchInFiles(files, queryObject.queryExpr);
        var send_object = {
            "results":  results,
            "numMatches": totalMatches,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        var resultKeys = Object.keys(results);
        fileTopIndex = files.indexOf(resultKeys[0]);
        fileBottomIndex = files.indexOf(resultKeys.pop());
        return send_object;
    }
    
    function getNextPageofSearchResults() {
        console.log("getNextPageofSearchResults" +numMatches);
        
        if (!files) {
            console.log("no file object found");
            return {};
        }

        //searchResultSlice(RESULTS_PER_PAGE);
        var resultKeys = Object.keys(results);
        var    offset = results[resultKeys[resultKeys.length-1]].matches.length;
        results = {};
        numMatches = 0;
        foundMaximum = false;
        exceedsMaximum = false;
        doSearchInFilesNextPage(files, queryObject.queryExpr, offset);
        var send_object = {
            "results":  results,
            "numMatches": totalMatches,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        var resultKeys = Object.keys(results);
        fileTopIndex = files.indexOf(resultKeys[0]);
        fileBottomIndex = files.indexOf(resultKeys.pop());
        return send_object;
    }
    
    function getPrevPageofSearchResults() {
        console.log("getPrevPageofSearchResults" +numMatches);
        
        if (!files) {
            console.log("no file object found");
            return {};
        }

        //searchResultSlice(RESULTS_PER_PAGE);
        var resultKeys = Object.keys(results);
        var    offset = results[resultKeys[0]].matches.length;
        numMatches = 0;
        foundMaximum = false;
        exceedsMaximum = false;
        doSearchInFilesPrevPage(files, queryObject.queryExpr, offset);
        var send_object = {
            "results":  results,
            "numMatches": totalMatches,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        var resultKeys = Object.keys(results);
        fileTopIndex = files.indexOf(resultKeys[0]);
        fileBottomIndex = files.indexOf(resultKeys.pop());
        return send_object;
    }
    
    function getLastPageofSearchResults() {
        console.log("getLastPageofSearchResults" +numMatches);
        
        if (!files) {
            console.log("no file object found");
            return {};
        }
        
        console.log('1');

        var pageLength = totalMatches % RESULTS_PER_PAGE;
        numMatches = 0;
        foundMaximum = false;
        exceedsMaximum = false;
        console.log('2');
        try {
        doSearchInFilesLastPage(files, queryObject.queryExpr, pageLength);
        } catch (err)
        {
            console.log(err);
        }
        console.log('BACKKKKK');
        var send_object = {
            "results":  results,
            "numMatches": totalMatches,
            "foundMaximum":  foundMaximum,
            "exceedsMaximum":  exceedsMaximum
        };
        var resultKeys = Object.keys(results);
        fileTopIndex = files.indexOf(resultKeys[0]);
        fileBottomIndex = files.indexOf(resultKeys.pop());
        console.log('SENDDDD');
        try{
        var str = ( ( JSON.stringify( send_object ) ) );
            console.log('str' + str);
        } catch (err)
        {
            console.log(err);
        }
        return str;
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
            "lastPage",    // command name
            getLastPageofSearchResults,   // command handler function
            false,          // this command is synchronous in Node
            "Searches in project files and returns matches",
            [],
            [{name: "searchResults", // return values
                type: "string",
                description: "Object containing results of the search"}]
        );
        
    }
    
    exports.init = init;
    
}());

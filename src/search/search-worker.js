/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global self, importScripts, $, require */

importScripts("thirdparty/requirejs/require.js");
//importScripts("thirdparty/requirejs/require.js", "thirdparty/jquery2.js");

var config = {};

(function () {
    "use strict";
    
    var MessageIds, StringUtils, MAX_DISPLAY_LENGTH, MAX_TOTAL_RESULTS;
    var ProjectCache = {};
    var results = {},
        numMatches = 0,
        foundMaximum = false,
        exceedsMaximum = false;
    var search_object, send_object;//, "./thirdparty/jquery-2.1.3.min"
    
    require(["./MsgIds", "../utils/StringUtils"], function (messageIds, stringUtils) {
        
        MessageIds = messageIds;
        StringUtils = stringUtils;
        //$ = jquery;
        //SearchModel = srchModel.SearchModel;
        MAX_DISPLAY_LENGTH = 200;
        MAX_TOTAL_RESULTS = 100000;
        //searchModel = new SearchModel();
        
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

                // Remove final result if there have been over MAX_TOTAL_RESULTS found
                if (numMatches > MAX_TOTAL_RESULTS) {
                    results[fullpath].matches.pop();
                    numMatches--;
                    exceedsMaximum = true;
                }
            }
        }
        
        function _doSearchInOneFile(filepath, text, queryExpr) {
            // Note that we don't fire a model change here, since this is always called by some outer batch
            // operation that will fire it once it's done.
            var matches = _getSearchMatches(text, queryExpr);
            setResults(filepath, {matches: matches});
//            setResults(file.fullPath, {matches: matches, timestamp: timestamp});
        }
        
        function doSearchInFiles(fileListResult, searchString, queryExpr) {
            
            if (fileListResult.length === 0) {
                console.log('no files found');
                return;

            } else {
                var numCompleted = 0;
                var hasFailed = false;

                fileListResult.forEach(function (filePath, i) {
                    _doSearchInOneFile(filePath, ProjectCache[filePath], queryExpr);
//                    promises.push(itemPromise);
//
//                    itemPromise.fail(function () {
//                        hasFailed = true;
//                    });
//                    itemPromise.always(function () {
//                        numCompleted++;
//                        if (numCompleted === fileListResult.length) {
//                            if (hasFailed) {
//                                masterDeferred.reject();
//                            } else {
//                                masterDeferred.resolve();
//                            }
//                        }
//                    });
                });
            }
        }
        
        function readFile(path) {
            var receiveReq = new XMLHttpRequest(),
                fname = "file:///" + path;
            if (receiveReq.readyState === 4 || receiveReq.readyState === 0) {
                receiveReq.open("GET", fname, true);
                receiveReq.onreadystatechange = function () {
                    if (receiveReq.readyState === 4) {
                        ProjectCache[path] = receiveReq.responseText;
                    }
                };
                receiveReq.send(null);
            }
        }
        
        self.addEventListener('message', function (e) {
            console.log('Worker: Received the message in worker');
            search_object = e.data;
            var type = search_object.type;
            var files = search_object.files,
                queryExpr = search_object.queryExpr;
            
            if (type === MessageIds.FIF_PROJECT_INIT) {
                console.log("Worker: Type=FIF_PROJECT_INIT");
                //ProjectCache = search_object.fileContents;
                //console.log("T2: Start Indexing!!" + (new Date()).getTime());
                
                files.forEach(function (filePath, i) {
                    readFile(filePath);
                    //UnComment the following in case you want to calculate the time taken to cache files. 
                    //Then comment out the previous line
                    var receiveReq = new XMLHttpRequest(),
                        fname = "file:///" + filePath;
                    if (receiveReq.readyState === 4 || receiveReq.readyState === 0) {
                        receiveReq.open("GET", fname, true);
                        receiveReq.onreadystatechange = function () {
                            if (receiveReq.readyState === 4) {
                                ProjectCache[filePath] = receiveReq.responseText;
                                if (i === (files.length - 1)) {
                                    console.log("T2: Done Indexing!! " + (new Date()).getTime());
                                    console.log('beginning search for first time:');
                                    doSearchInFiles(search_object.files, search_object.queryInfo.query, queryExpr);
                                    var send_object = {
                                        "type": MessageIds.FIF_RESULTS_PREPARED,
                                        "results":  results,
                                        "numMatches": numMatches,
                                        "foundMaximum":  foundMaximum,
                                        "exceedsMaximum":  exceedsMaximum
                                    };
                                    self.postMessage(send_object);
                                }
                            }
                        };
                        receiveReq.send(null);
                    }
                    
                });
            } else if (type === MessageIds.FIF_SEARCH) {
                console.log("Worker: Type=FIF_SEARCH");
                doSearchInFiles(search_object.files, search_object.queryInfo.query, queryExpr);
                send_object = {
                    "type": MessageIds.FIF_RESULTS_PREPARED,
                    "results":  results,
                    "numMatches": numMatches,
                    "foundMaximum":  foundMaximum,
                    "exceedsMaximum":  exceedsMaximum
                };
                self.postMessage(send_object);
            } else {
                console.log("Worker: Type=Others");
            }
        }, false);

        self.postMessage({"type": MessageIds.FIF_WORKER_INITED});
    });
}());

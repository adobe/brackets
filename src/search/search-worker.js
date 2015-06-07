/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global self, importScripts, $, require */

importScripts("thirdparty/requirejs/require.js");

var config = {};

(function () {
    "use strict";
    
    var MessageIds, StringUtils, MAX_DISPLAY_LENGTH, MAX_TOTAL_RESULTS;
    var ProjectCache = {};
    var search_object;
    require(["./MsgIds", "utils/StringUtils"], function (messageIds, stringUtils) {
        MessageIds = messageIds;
        StringUtils = stringUtils;
        MAX_DISPLAY_LENGTH = 200;
        MAX_TOTAL_RESULTS = 100000;
        
//        function _getSearchMatches(contents, queryExpr) {
//            // Quick exit if not found or if we hit the limit
//            if (searchModel.foundMaximum || contents.search(queryExpr) === -1) {
//                return [];
//            }
//
//            var match, lineNum, line, ch, totalMatchLength, matchedLines, numMatchedLines, lastLineLength, endCh,
//                padding, leftPadding, rightPadding, highlightOffset, highlightEndCh,
//                lines   = StringUtils.getLines(contents),
//                matches = [];
//
//            while ((match = queryExpr.exec(contents)) !== null) {
//                lineNum          = StringUtils.offsetToLineNum(lines, match.index);
//                line             = lines[lineNum];
//                ch               = match.index - contents.lastIndexOf("\n", match.index) - 1;  // 0-based index
//                matchedLines     = match[0].split("\n");
//                numMatchedLines  = matchedLines.length;
//                totalMatchLength = match[0].length;
//                lastLineLength   = matchedLines[matchedLines.length - 1].length;
//                endCh            = (numMatchedLines === 1 ? ch + totalMatchLength : lastLineLength);
//                highlightEndCh   = (numMatchedLines === 1 ? endCh : line.length);
//                highlightOffset  = 0;
//
//                if (highlightEndCh <= MAX_DISPLAY_LENGTH) {
//                    // Don't store more than 200 chars per line
//                    line = line.substr(0, Math.min(MAX_DISPLAY_LENGTH, line.length));
//                } else if (totalMatchLength > MAX_DISPLAY_LENGTH) {
//                    // impossible to display the whole match
//                    line = line.substr(ch, ch + MAX_DISPLAY_LENGTH);
//                    highlightOffset = ch;
//                } else {
//                    // Try to have both beginning and end of match displayed
//                    padding = MAX_DISPLAY_LENGTH - totalMatchLength;
//                    rightPadding = Math.floor(Math.min(padding / 2, line.length - highlightEndCh));
//                    leftPadding = Math.ceil(padding - rightPadding);
//                    highlightOffset = ch - leftPadding;
//                    line = line.substring(highlightOffset, highlightEndCh + rightPadding);
//                }
//
//                matches.push({
//                    start:       {line: lineNum, ch: ch},
//                    end:         {line: lineNum + numMatchedLines - 1, ch: endCh},
//
//                    highlightOffset: highlightOffset,
//
//                    // Note that the following offsets from the beginning of the file are *not* updated if the search
//                    // results change. These are currently only used for multi-file replacement, and we always
//                    // abort the replace (by shutting the results panel) if we detect any result changes, so we don't
//                    // need to keep them up to date. Eventually, we should either get rid of the need for these (by
//                    // doing everything in terms of line/ch offsets, though that will require re-splitting files when
//                    // doing a replace) or properly update them.
//                    startOffset: match.index,
//                    endOffset:   match.index + totalMatchLength,
//
//                    line:        line,
//                    result:      match,
//                    isChecked:   true
//                });
//
//                // We have the max hits in just this 1 file. Stop searching this file.
//                // This fixed issue #1829 where code hangs on too many hits.
//                // Adds one over MAX_TOTAL_RESULTS in order to know if the search has exceeded
//                // or is equal to MAX_TOTAL_RESULTS. Additional result removed in SearchModel
//                if (matches.length > MAX_TOTAL_RESULTS) {
//                    queryExpr.lastIndex = 0;
//                    break;
//                }
//
//                // Pathological regexps like /^/ return 0-length matches. Ensure we make progress anyway
//                if (totalMatchLength === 0) {
//                    queryExpr.lastIndex++;
//                }
//            }
//
//            return matches;
//        }
//        
        function _doSearchInOneFile(file, text) {
            // Note that we don't fire a model change here, since this is always called by some outer batch
            // operation that will fire it once it's done.
            var matches = _getSearchMatches(text, searchModel.queryExpr);
            searchModel.setResults(file.fullPath, {matches: matches, timestamp: timestamp});
        }
        
        function searchInParallel(fileListResult, searchString) {
            var promises = [];
            var masterDeferred = new $.Deferred();
            if (fileListResult.length === 0) {
                masterDeferred.resolve();

            } else {
                var numCompleted = 0;
                var hasFailed = false;

                fileListResult.forEach(function (filePath, i) {
                    var itemPromise = _doSearchInOneFile(filePath, ProjectCache[filePath]);
                    promises.push(itemPromise);

                    itemPromise.fail(function () {
                        hasFailed = true;
                    });
                    itemPromise.always(function () {
                        numCompleted++;
                        if (numCompleted === fileListResult.length) {
                            if (hasFailed) {
                                masterDeferred.reject();
                            } else {
                                masterDeferred.resolve();
                            }
                        }
                    });
                });
            }
        
            return masterDeferred.promise();
        }
        
        self.addEventListener('message', function (e) {
            search_object = e.data;
            var type = search_object.type;
            
            if (type === MessageIds.FIF_PROJECT_INIT) {
                console.log("Type=FIF_PROJECT_INIT");
                ProjectCache = search_object.fileContents;
            } else if (type === MessageIds.FIF_SEARCH) {
                console.log("Type=FIF_SEARCH");
                searchInParallel(search_object.files, search_object.queryInfo.query);
            } else {
                console.log("Type=Others");
            }
            console.log("Worker: Almost done searching");
            self.postMessage("OK!! Done searching!");
        }, false);
    });

}());

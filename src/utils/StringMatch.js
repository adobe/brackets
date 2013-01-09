/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, window, setTimeout, ArrayBuffer, Int8Array */
/*unittests: StringMatch */

define(function (require, exports, module) {
    "use strict";
    
    /*
     * Performs matching that is useful for QuickOpen and similar searches.
     */
    
    /** Object representing a search result with associated metadata (added as extra ad hoc fields) */
    function SearchResult(label) {
        this.label = label;
    }
    


    /*
     * Identifies the "special" characters in the given string.
     * Special characters for matching purposes are:
     *
     * * the first character
     * * "/" and the character following the "/"
     * * "_", "." and "-" and the character following it
     * * an uppercase character that follows a lowercase one (think camelCase)
     *
     * The returned object contains an array called "specials". This array is
     * a list of indexes into the original string where all of the special
     * characters are. It also has a property "lastSegmentSpecialsIndex" which
     * is an index into the specials array that denotes which location is the
     * beginning of the last path segment. (This is used to allow scanning of
     * the last segment's specials separately.)
     * 
     * @param {string} input string to break apart (e.g. filename that is being searched)
     * @return {{specials:Array.<number>, lastSegmentSpecialsIndex:number}}
     */
    function findSpecialCharacters(str) {
        var i, c;
        
        // the beginning of the string is always special
        var specials = [0];
        
        // lastSegmentSpecialsIndex starts off with the assumption that
        // there are no segments
        var lastSegmentSpecialsIndex = 0;
        
        // used to track down the camelCase changeovers
        var lastWasLowerCase = false;
        
        for (i = 0; i < str.length; i++) {
            c = str[i];
            if (c === "/") {
                // new segment means this character and the next are special
                specials.push(i++);
                specials.push(i);
                lastSegmentSpecialsIndex = specials.length - 1;
                lastWasLowerCase = false;
            } else if (c === "." || c === "-" || c === "_") {
                // _, . and - are separators so they are
                // special and so is the next character
                specials.push(i++);
                specials.push(i);
                lastWasLowerCase = false;
            } else if (c.toUpperCase() === c) {
                // this is the check for camelCase changeovers
                if (lastWasLowerCase) {
                    specials.push(i);
                }
                lastWasLowerCase = false;
            } else {
                lastWasLowerCase = true;
            }
        }
        return {
            specials: specials,
            lastSegmentSpecialsIndex: lastSegmentSpecialsIndex
        };
    }
    
    // states used during the scanning of the string
    var SPECIALS_COMPARE = 0;
    var CONTIGUOUS_COMPARE = 1;
    var SPECIALS_EXHAUSTED = 2;
    
    // Scores can be hard to make sense of. The DEBUG_SCORES flag
    // provides a way to peek into the parts that made up a score.
    // This flag is used for manual debugging and in the unit tests only.
    var DEBUG_SCORES = false;
    function _setDebugScores(ds) {
        DEBUG_SCORES = ds;
    }
    
    // Constants for scoring
    var SPECIAL_POINTS = 25;
    var MATCH_POINTS = 10;
    var LAST_SEGMENT_BOOST = 1;
    var BEGINNING_OF_NAME_POINTS = 25;
    var DEDUCTION_FOR_LENGTH = 0.2;
    var CONSECUTIVE_MATCHES_POINTS = 25;
    var NOT_STARTING_ON_SPECIAL_PENALTY = 25;
    
    /*
     * Finds the best matches between the query and the string. The query is
     * compared with compareStr (generally a lower case string with a lower case
     * query), but the results are returned based on str.
     *
     * Generally speaking, this function tries to find a "special" character
     * (see findSpecialCharacters above) for the first character of the query.
     * When it finds one, it then tries to look for consecutive characters that
     * match. Once the characters stop matching, it tries to find a special
     * character for the next query character. If a special character isn't found, 
     * it starts scanning sequentially.
     *
     * The returned object contains the following fields:
     * * {Array} ranges: the scanned regions of the string, in order. For each range:
     *     * {string} text: the text for the string range
     *     * {boolean} matched: was this range part of the match?
     *     * {boolean} includesLastSegment: is this range part of the last segment of str
     * * {int} matchGoodness: the score computed for this match
     * * (optional) {Object} scoreDebug: if DEBUG_SCORES is true, an object with the score broken down
     *
     * @param {string} query the search string (generally lower cased)
     * @param {string} str the original string to search
     * @param {string} compareStr the string to compare with (generally lower cased)
     * @param {Array} specials list of special indexes in str (from findSpecialCharacters)
     * @param {int} startingSpecial index into specials array to start scanning with
     * @param {boolean} lastSegmentStart optional which character does the last segment start at
     * @return {{ranges:Array.{text:string, matched:boolean, includesLastSegment:boolean}, matchGoodness:int, scoreDebug: Object}} matched ranges and score
     */
    function getMatchRanges(query, str, compareStr, specials, startingSpecial, lastSegmentStart) {
        var ranges = [];
        
        var score = 0;
        var scoreDebug;
        if (DEBUG_SCORES) {
            scoreDebug = {
                special: 0,
                match: 0,
                lastSegment: 0,
                beginning: 0,
                lengthDeduction: 0,
                consecutive: 0,
                notStartingOnSpecial: 0
            };
        }
        
        // normalize the optional parameters
        if (!lastSegmentStart) {
            lastSegmentStart = 0;
        }
        
        if (startingSpecial === undefined) {
            startingSpecial = 0;
        }
        
        var specialsCounter = startingSpecial;
        
        // strCounter and queryCounter are the indexes used for pulling characters
        // off of the str/compareStr and query.
        var strCounter = specials[startingSpecial];
        var queryCounter = 0;
        
        // initial state is to scan through the special characters
        var state = SPECIALS_COMPARE;
        
        // currentRange keeps track of the range we are adding characters to now
        var currentRange = null;
        var lastSegmentScore = 0;
        var currentRangeStartedOnSpecial = false;
        
        // the character index (against str) that was last in a matched range. This is used for
        // adding unmatched ranges in between and adding bonus points for consecutive matches.
        var lastMatchIndex = strCounter - 1;
        
        // Records the current range and adds any additional ranges required to
        // get to character index c. This function is called before starting a new range
        // or returning from the function.
        function closeRangeGap(c) {
            // close the current range
            if (currentRange) {
                currentRange.includesLastSegment = lastMatchIndex >= lastSegmentStart;
                if (currentRange.matched && currentRange.includesLastSegment) {
                    if (DEBUG_SCORES) {
                        scoreDebug.lastSegment += lastSegmentScore * LAST_SEGMENT_BOOST;
                    }
                    score += lastSegmentScore * LAST_SEGMENT_BOOST;
                }
                
                if (currentRange.matched && !currentRangeStartedOnSpecial) {
                    if (DEBUG_SCORES) {
                        scoreDebug.notStartingOnSpecial -= NOT_STARTING_ON_SPECIAL_PENALTY;
                    }
                    score -= NOT_STARTING_ON_SPECIAL_PENALTY;
                }
                ranges.push(currentRange);
            }
            
            // if there was space between the new range and the last,
            // add a new unmatched range before the new range can be added.
            if (lastMatchIndex + 1 < c) {
                ranges.push({
                    text: str.substring(lastMatchIndex + 1, c),
                    matched: false,
                    includesLastSegment: c > lastSegmentStart
                });
            }
            currentRange = null;
            lastSegmentScore = 0;
        }
        
        // records that the character at index c (of str) matches, adding
        // that character to the current range or starting a new one.
        function addMatch(c) {
            var newPoints = 0;
            
            // A match means that we need to do some scoring bookkeeping.
            if (DEBUG_SCORES) {
                scoreDebug.match += MATCH_POINTS;
            }
            newPoints += MATCH_POINTS;
            
            // a bonus is given for characters that match at the beginning
            // of the filename
            if (c === lastSegmentStart) {
                if (DEBUG_SCORES) {
                    scoreDebug.beginning += BEGINNING_OF_NAME_POINTS;
                }
                newPoints += BEGINNING_OF_NAME_POINTS;
            }
            
            // If the new character immediately follows the last matched character,
            // we award the consecutive matches bonus. The check for score > 0
            // handles the initial value of lastMatchIndex which is used for
            // constructing ranges but we don't yet have a true match.
            if (score > 0 && lastMatchIndex + 1 === c) {
                if (DEBUG_SCORES) {
                    scoreDebug.consecutive += CONSECUTIVE_MATCHES_POINTS;
                }
                newPoints += CONSECUTIVE_MATCHES_POINTS;
            }
            
            score += newPoints;
            if (c >= lastSegmentStart) {
                lastSegmentScore += newPoints;
            }
            
            // if the last range wasn't a match or there's a gap, we need to close off
            // the range to start a new one.
            if ((currentRange && !currentRange.matched) || c > lastMatchIndex + 1) {
                closeRangeGap(c);
            }
            lastMatchIndex = c;
            
            // set up a new match range or add to the current one
            if (!currentRange) {
                currentRange = {
                    text: str[c],
                    matched: true
                };
                
                // Check to see if this new matched range is starting on a special
                // character. We penalize those ranges that don't, because most
                // people will search on the logical boundaries of the name
                currentRangeStartedOnSpecial = c === specials[specialsCounter];
            } else {
                currentRange.text += str[c];
            }
        }
        
        // Compares the current character from the query string against the
        // special characters in compareStr.
        function findMatchingSpecial() {
            // used to loop through the specials
            var i;
            
            var foundMatch = false;
            for (i = specialsCounter; i < specials.length; i++) {
                // first, check to see if strCounter has moved beyond
                // the current special character. This is possible
                // if the contiguous comparison continued on through
                // the next special
                if (specials[i] < strCounter) {
                    specialsCounter = i;
                } else if (query[queryCounter] === compareStr[specials[i]]) {
                    // we have a match! do the required tracking
                    specialsCounter = i;
                    queryCounter++;
                    strCounter = specials[i];
                    addMatch(strCounter++);
                    if (DEBUG_SCORES) {
                        scoreDebug.special += SPECIAL_POINTS;
                    }
                    score += SPECIAL_POINTS;
                    foundMatch = true;
                    break;
                }
            }
            
            // when we find a match, we switch to looking for consecutive matching characters
            if (foundMatch) {
                state = CONTIGUOUS_COMPARE;
            } else {
                // we didn't find a match among the specials
                state = SPECIALS_EXHAUSTED;
            }
        }
        
        // keep looping until we've either exhausted the query or the string
        while (queryCounter < query.length && strCounter < str.length) {
            if (state === SPECIALS_COMPARE) {
                findMatchingSpecial();
            } else if (state === CONTIGUOUS_COMPARE || state === SPECIALS_EXHAUSTED) {
                // for both of these states, we're looking character by character 
                // for matches
                if (query[queryCounter] === compareStr[strCounter]) {
                    // got a match! record it, and switch to CONTIGUOUS_COMPARE
                    // in case we had been in SPECIALS_EXHAUSTED state
                    queryCounter++;
                    addMatch(strCounter++);
                    state = CONTIGUOUS_COMPARE;
                } else {
                    // no match. If we were in CONTIGUOUS_COMPARE mode, we
                    // we switch to looking for specials again. If we've
                    // already exhaused the specials, we're just going to keep
                    // stepping through compareStr.
                    if (state !== SPECIALS_EXHAUSTED) {
                        findMatchingSpecial();
                    } else {
                        strCounter++;
                    }
                }
            }
        }
        
        var result;
        // Add the rest of the string ranges
        closeRangeGap(str.length);
        
        // It's not a match if we still have query string left.
        if (queryCounter < query.length) {
            result = null;
        } else {
            result = {
                matchGoodness: score,
                ranges: ranges
            };
            if (DEBUG_SCORES) {
                result.scoreDebug = scoreDebug;
            }
        }
        return result;
    }
    
    /*
     * Seek out the best match in the last segment (generally the filename). 
     * Matches in the filename are preferred, but the query entered could match
     * any part of the path. So, we find the best match we can get in the filename
     * and then allow for searching the rest of the string with any characters that
     * are left from the beginning of the query.
     *
     * The parameters and return value are the same as for getMatchRanges,
     * except this function is always working on the last segment and the
     * result can optionally include a remainder, which is the characters
     * at the beginning of the query which did not match in the last segment.
     *
     * @param {string} query the search string (generally lower cased)
     * @param {string} str the original string to search
     * @param {string} compareStr the string to compare with (generally lower cased)
     * @param {Array} specials list of special indexes in str (from findSpecialCharacters)
     * @param {int} startingSpecial index into specials array to start scanning with
     * @param {boolean} lastSegmentStart which character does the last segment start at
     * @return {{ranges:Array.{text:string, matched:boolean, includesLastSegment:boolean}, remainder:string, matchGoodness:int, scoreDebug: Object}} matched ranges and score
     */
    function _lastSegmentSearch(query, str, compareStr, specials, startingSpecial, lastSegmentStart) {
        var queryCounter, matchRanges;
        
        // It's possible that the query is longer than the last segment.
        // If so, we can chop off the bit that we know couldn't possibly be there.
        var remainder = "";
        var extraCharacters = specials[startingSpecial] + query.length - str.length;

        if (extraCharacters > 0) {
            remainder = query.substring(0, extraCharacters);
            query = query.substring(extraCharacters);
        }
        
        for (queryCounter = 0; queryCounter < query.length; queryCounter++) {
            matchRanges = getMatchRanges(query.substring(queryCounter),
                                     str, compareStr, specials, startingSpecial, lastSegmentStart);
            
            // if we've got a match *or* there are no segments in this string, we're done
            if (matchRanges || startingSpecial === 0) {
                break;
            }
        }
        
        if (queryCounter === query.length || !matchRanges) {
            return null;
        } else {
            matchRanges.remainder = remainder + query.substring(0, queryCounter);
            return matchRanges;
        }
    }
    
    /*
     * Implements the top-level search algorithm. Search the last segment first,
     * then search the rest of the string with the remainder.
     *
     * The parameters and return value are the same as for getMatchRanges.
     *
     * @param {string} query the search string (will be searched lower case)
     * @param {string} str the original string to search
     * @param {Array} specials list of special indexes in str (from findSpecialCharacters)
     * @param {int} lastSegmentSpecialsIndex index into specials array to start scanning with
     * @return {{ranges:Array.{text:string, matched:boolean, includesLastSegment:boolean}, matchGoodness:int, scoreDebug: Object}} matched ranges and score
     */
    function _computeMatch(query, str, specials, lastSegmentSpecialsIndex) {
        // set up query as all lower case and make a lower case string to use for comparisons
        query = query.toLowerCase();
        var compareStr = str.toLowerCase();
        
        var lastSegmentStart = specials[lastSegmentSpecialsIndex];
        var result;
        
        if (lastSegmentStart + query.length < str.length) {
            result = _lastSegmentSearch(query, str, compareStr, specials, lastSegmentSpecialsIndex, lastSegmentStart);
        }
        
        if (result) {
            // Do we have more query characters that did not fit?
            if (result.remainder) {
                // Scan with the remainder only through the beginning of the last segment
                var remainderResult = getMatchRanges(result.remainder, str.substring(0, lastSegmentStart),
                                              compareStr.substring(0, lastSegmentStart),
                                              specials.slice(0, lastSegmentSpecialsIndex), 0, lastSegmentStart);
                
                if (remainderResult) {
                    // We have a match
                    // This next part deals with scoring for the case where
                    // there are consecutive matched characters at the border of the
                    // last segment.
                    var lastRange = remainderResult.ranges[remainderResult.ranges.length - 1];
                    if (result.ranges[0].matched && lastRange.matched) {
                        result.matchGoodness += lastRange.text.length * CONSECUTIVE_MATCHES_POINTS;
                        if (DEBUG_SCORES) {
                            result.scoreDebug.consecutive += lastRange.text.length * CONSECUTIVE_MATCHES_POINTS;
                        }
                    }
                    
                    // add the new matched ranges to the beginning of the set of ranges we had
                    result.ranges.unshift.apply(result.ranges, remainderResult.ranges);
                } else {
                    // no match
                    return null;
                }
            } else {
                // There was no remainder, which means that the whole match is in the
                // last segment. We need to add a range at the beginning for everything
                // that came before the last segment.
                result.ranges.unshift({
                    text: str.substring(0, lastSegmentStart),
                    matched: false,
                    includesLastSegment: false
                });
            }
            delete result.remainder;
        } else {
            // No match in the last segment, so we start over searching the whole
            // string
            result = getMatchRanges(query, str, compareStr, specials, 0, lastSegmentStart);
        }
        
        if (result) {
            var lengthPenalty = -1 * Math.round(str.length * DEDUCTION_FOR_LENGTH);
            if (DEBUG_SCORES) {
                result.scoreDebug.lengthDeduction = lengthPenalty;
            }
            result.matchGoodness = result.matchGoodness + lengthPenalty;
        }
        return result;
    }
    
    /*
     * Match str against the query using the QuickOpen algorithm provided by
     * the functions above. The general idea is to prefer matches in the last
     * segment (the filename) and matches of "special" characters. stringMatch
     * will try to provide the best match and produces a "matchGoodness" score
     * to allow for relative ranking.
     *
     * The result object returned includes "stringRanges" which can be used to highlight
     * the matched portions of the string, in addition to the "matchGoodness"
     * mentioned above. If DEBUG_SCORES is true, scoreDebug is set on the result
     * to provide insight into the score.
     *
     * The matching is done in a case-insensitive manner.
     * 
     * @param {string} str  The string to search
     * @param {string} query  The query string to find in string
     */
    function stringMatch(str, query) {
        var result;

        // No query? Short circuit the normal work done and just
        // return a single range that covers the whole string.
        if (!query) {
            result = new SearchResult(str);
            result.matchGoodness = 0;
            if (DEBUG_SCORES) {
                result.scoreDebug = {};
            }
            result.stringRanges = [{
                text: str,
                matched: false,
                includesLastSegment: true
            }];
            return result;
        }
        
        // Locate the special characters and then use orderedCompare to do the real
        // work.
        var special = findSpecialCharacters(str);
        var compareData = _computeMatch(query, str, special.specials,
                              special.lastSegmentSpecialsIndex);
        
        // If we get a match, turn this into a SearchResult as expected by the consumers
        // of this API.
        if (compareData) {
            result = new SearchResult(str);
            result.stringRanges = compareData.ranges;
            result.matchGoodness = -1 * compareData.matchGoodness;
            if (DEBUG_SCORES) {
                result.scoreDebug = compareData.scoreDebug;
            }
        }
        return result;
    }
    
    /**
     * Sorts an array of SearchResult objects on a primary field, followed by secondary fields
     * in case of ties. 'fields' maps field name to priority, where 0 is the primary field. E.g.:
     *      multiFieldSort(bugList, { milestone: 0, severity: 1 });
     * Would sort a bug list by milestone, and within each milestone sort bugs by severity.
     *
     * Any fields that have a string value are compared case-insensitively. Fields used should be
     * present on all SearchResult objects (no optional/undefined fields).
     *
     * @param {!Array.<SearchResult>} searchResults
     * @param {!Object.<string, number>} fields
     */
    function multiFieldSort(searchResults, fields) {
        // Move field names into an array, with primary field first
        var fieldNames = [];
        $.each(fields, function (key, priority) {
            fieldNames[priority] = key;
        });
        
        searchResults.sort(function (a, b) {
            var priority;
            for (priority = 0; priority < fieldNames.length; priority++) {
                var fieldName = fieldNames[priority];
                var valueA = a[fieldName];
                var valueB = b[fieldName];
                if (typeof valueA === "string") {
                    valueA = valueA.toLowerCase();
                    valueB = valueB.toLowerCase();
                }
                
                if (valueA < valueB) {
                    return -1;
                } else if (valueA > valueB) {
                    return 1;
                }
                // otherwise, move on to next sort priority
            }
            return 0; // all sort fields are equal
        });
    }
    
    /**
     * Sorts search results generated by stringMatch(): results are sorted into several
     * tiers based on how well they matched the search query, then sorted alphabetically
     * within each tier.
     */
    function basicMatchSort(searchResults) {
        multiFieldSort(searchResults, { matchGoodness: 0, label: 1 });
    }
    
    exports._findSpecialCharacters  = findSpecialCharacters;
    exports._computeMatch           = _computeMatch;
    exports._lastSegmentSearch      = _lastSegmentSearch;
    exports._setDebugScores         = _setDebugScores;

    // public exports
    exports.SearchResult            = SearchResult;
    exports.stringMatch             = stringMatch;
    exports.basicMatchSort          = basicMatchSort;
    exports.multiFieldSort          = multiFieldSort;
});

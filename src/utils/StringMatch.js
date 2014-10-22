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
/*global define */
/*unittests: StringMatch */

define(function (require, exports, module) {
    "use strict";
    
    var _ = require("thirdparty/lodash");
    
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
    var SPECIALS_MATCH = 0;
    var ANY_MATCH = 1;
    
    // Scores can be hard to make sense of. The DEBUG_SCORES flag
    // provides a way to peek into the parts that made up a score.
    // This flag is used for manual debugging and in the unit tests only.
    var DEBUG_SCORES = false;
    function _setDebugScores(ds) {
        DEBUG_SCORES = ds;
    }
    

    // Constants for scoring
    var SPECIAL_POINTS = 40;
    var MATCH_POINTS = 10;
    var UPPER_CASE_MATCH = 100;
    var CONSECUTIVE_MATCHES_POINTS = 8;
    var BEGINNING_OF_NAME_POINTS = 13;
    var LAST_SEGMENT_BOOST = 1;
    var DEDUCTION_FOR_LENGTH = 0.2;
    var NOT_STARTING_ON_SPECIAL_PENALTY = 25;
    
    // Used in match lists to designate matches of "special" characters (see
    // findSpecialCharacters above
    function SpecialMatch(index, upper) {
        this.index = index;
        if (upper) {
            this.upper = upper;
        }
    }
    
    // Used in match lists to designate any matched characters that are not special
    function NormalMatch(index, upper) {
        this.index = index;
        if (upper) {
            this.upper = upper;
        }
    }
    
    /*
     * Finds the best matches between the query and the string. The query is
     * compared with str (usually a lower case string with a lower case
     * query).
     *
     * Generally speaking, this function tries to find "special" characters
     * (see findSpecialCharacters above) first. Failing that, it starts scanning
     * the "normal" characters. Sometimes, it will find a special character that matches
     * but then not be able to match the rest of the query. In cases like that, the
     * search will backtrack and try to find matches for the whole query earlier in the
     * string.
     *
     * A contrived example will help illustrate how the searching and backtracking works. It's a bit long,
     * but it illustrates different pieces of the algorithm which can be tricky. Let's say that we're
     * searching the string "AzzBzzCzdzezzDgxgEF" for "abcdex".
     *
     * To start with, it will match "abcde" from the query to "A B C D E" in the string (the spaces 
     * represent gaps in the matched part of the string), because those are all "special characters".
     * However, the "x" in the query doesn't match the "F" which is the only character left in the
     * string.
     * 
     * Backtracking kicks in. The "E" is pulled off of the match list.
     * deadBranches[4] is set to the "g" before the "E". This means that for the 5th
     * query character (the "e") we know that we don't have a match beyond that point in the string.
     *
     * To resume searching, the backtrack function looks at the previous match (the "D") and starts
     * searching in character-by-character (ANY_MATCH) mode right after that. It fails to find an
     * "e" before it gets to deadBranches[4], so it has to backtrack again.
     *
     * This time, the "D" is pulled off the match list.
     * deadBranches[3] is set to the "z" before the "D", because we know that for the "dex" part of the
     * query, we can't make it work past the "D". We'll resume searching with the "z" after the "C".
     *
     * Doing an ANY_MATCH search, we find the "d". We then start searching specials for "e", but we
     * stop before we get to "E" because deadBranches[4] tells us that's a dead end. So, we switch
     * to ANY_MATCH and find the "e".
     *
     * Finally, we search for the "x". We don't find a special that matches, so we start an ANY_MATCH
     * search. Then we find the "x", and we have a successful match.
     *
     * Here are some notes on how the algorithm works:
     *
     * * We only backtrack() when we're exhausted both special AND normal forward searches past that point, 
     *   for the query remainder we currently have.  For a different query remainder, we may well get further 
     *   along - hence deadBranches[] being dependent on queryCounter; but in order to get a different query 
     *   remainder, we must give up one or more current matches by backtracking.
     *
     * * Normal "any char" forward search is a superset of special matching mode -- anything that would have 
     *   been matched in special mode *could* also be matched by normal mode. In practice, however,
     *   any special characters that could have matched would be picked up first by the specials matching
     *   code.
     *
     * * backtrack() always goes at least as far back as str[deadBranches[queryCounter]-1] before allowing 
     *   forward searching to resume
     *
     * * When `deadBranches[queryCounter] = strCounter` it means if we're still trying to match 
     *   `queryLower[queryCounter]` and we get to `str[strCounter]`, there's no way we can match the 
     *   remainer of `queryLower` with the remainder of `str` -- either using specials-only or 
     *   full any-char matching.
     *
     * * We know this because deadBranches[] is set in backtrack(), and we don't get to backtrack() unless 
     *   either:
     *   1. We've already exhausted both special AND normal forward searches past that point
     *      (i.e. backtrack() due to `strCounter >= str.length`, yet `queryCounter < query.length`)
     *   2. We stopped searching further forward due to a previously set deadBranches[] value
     *      (i.e. backtrack() due to `strCounter > deadBranches[queryCounter]`, yet 
     *      `queryCounter < query.length`)
     *
     * @param {string} query the search string (generally lower cased)
     * @param {string} str the string to compare with (generally lower cased)
     * @param {string} originalQuery the "non-normalized" query string (used to detect case match priority)
     * @param {string} originalStr the "non-normalized" string to compare with (used to detect case match priority)
     * @param {Array} specials list of special indexes in str (from findSpecialCharacters)
     * @param {int} startingSpecial index into specials array to start scanning with
     * @return {Array.<SpecialMatch|NormalMatch>} matched indexes or null if no matches possible
     */
    function _generateMatchList(query, str, originalQuery, originalStr, specials, startingSpecial) {
        var result = [];
        
        // used to keep track of which special character we're testing now
        var specialsCounter = startingSpecial;
        
        // strCounter and queryCounter are the indexes used for pulling characters
        // off of the str/compareLower and query.
        var strCounter = specials[startingSpecial];
        var queryCounter;
        
        // the search branches out between special characters and normal characters
        // that are found via consecutive character scanning. In the process of
        // performing these scans, we discover that parts of the query will not match
        // beyond a given point in the string. We keep track of that information
        // in deadBranches, which has a slot for each character in the query.
        // The value stored in the slot is the index into the string after which we
        // are certain there is no match.
        var deadBranches = [];
        
        for (queryCounter = 0; queryCounter < query.length; queryCounter++) {
            deadBranches[queryCounter] = Infinity;
        }
        
        queryCounter = 0;
        
        var state = SPECIALS_MATCH;
        
        // Compares the current character from the query string against the
        // special characters in str. Returns true if a match was found,
        // false otherwise.
        function findMatchingSpecial() {
            // used to loop through the specials
            var i;
            
            for (i = specialsCounter; i < specials.length; i++) {
                // short circuit this search when we know there are no matches following
                if (specials[i] >= deadBranches[queryCounter]) {
                    break;
                }
                
                // First, ensure that we're not comparing specials that
                // come earlier in the string than our current search position.
                // This can happen when the string position changes elsewhere.
                if (specials[i] < strCounter) {
                    specialsCounter = i;
                } else if (query[queryCounter] === str[specials[i]]) {
                    // we have a match! do the required tracking
                    strCounter = specials[i];
                    
                    // Upper case match check:
                    // If the query and original string matched, but the original string
                    // and the lower case version did not, that means that the original
                    // was upper case.
                    var upper = originalQuery[queryCounter] === originalStr[strCounter] && originalStr[strCounter] !== str[strCounter];
                    result.push(new SpecialMatch(strCounter, upper));
                    specialsCounter = i;
                    queryCounter++;
                    strCounter++;
                    return true;
                }
            }
            
            return false;
        }
        
        // This function implements the backtracking that is done when we fail to find
        // a match with the query using the "search for specials first" approach.
        //
        // returns false when it is not able to backtrack successfully
        function backtrack() {
            
            // The idea is to pull matches off of our match list, rolling back
            // characters from the query. We pay special attention to the special
            // characters since they are searched first.
            while (result.length > 0) {
                var item = result.pop();
                
                // nothing in the list? there's no possible match then.
                if (!item) {
                    return false;
                }
                
                // we pulled off a match, which means that we need to put a character
                // back into our query. strCounter is going to be set once we've pulled
                // off the right special character and know where we're going to restart
                // searching from.
                queryCounter--;
                
                if (item instanceof SpecialMatch) {
                    // pulled off a special, which means we need to make that special available
                    // for matching again
                    specialsCounter--;
                    
                    // check to see if we've gone back as far as we need to
                    if (item.index < deadBranches[queryCounter]) {
                        // we now know that this part of the query does not match beyond this
                        // point
                        deadBranches[queryCounter] = item.index - 1;
                        
                        // since we failed with the specials along this track, we're
                        // going to reset to looking for matches consecutively.
                        state = ANY_MATCH;
                        
                        // we figure out where to start looking based on the new
                        // last item in the list. If there isn't anything else
                        // in the match list, we'll start over at the starting special
                        // (which is generally the beginning of the string, or the
                        // beginning of the last segment of the string)
                        item = result[result.length - 1];
                        if (!item) {
                            strCounter = specials[startingSpecial] + 1;
                            return true;
                        }
                        strCounter = item.index + 1;
                        return true;
                    }
                }
            }
            return false;
        }
        
        while (true) {
            
            // keep looping until we've either exhausted the query or the string
            while (queryCounter < query.length && strCounter < str.length && strCounter <= deadBranches[queryCounter]) {
                if (state === SPECIALS_MATCH) {
                    if (!findMatchingSpecial()) {
                        state = ANY_MATCH;
                    }
                }
                
                if (state === ANY_MATCH) {
                    // we look character by character for matches
                    if (query[queryCounter] === str[strCounter]) {
                        // got a match! record it, and switch back to searching specials
                        
                        // See the specials section above for a comment on the expression
                        // for `upper` below.
                        var upper = originalQuery[queryCounter] === originalStr[strCounter] && originalStr[strCounter] !== str[strCounter];
                        result.push(new NormalMatch(strCounter++, upper));

                        queryCounter++;
                        state = SPECIALS_MATCH;
                    } else {
                        // no match, keep looking
                        strCounter++;
                    }
                }
            }
            
            // if we've finished the query, or we haven't finished the query but we have no
            // more backtracking we can do, then we're all done searching.
            if (queryCounter >= query.length || (queryCounter < query.length && !backtrack())) {
                break;
            }
        }
        
        // return null when we don't find anything
        if (queryCounter < query.length || result.length === 0) {
            return null;
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
     * @param {string} str the string to compare with (generally lower cased)
     * @param {string} originalQuery the "non-normalized" query string (used to detect case match priority)
     * @param {string} originalStr the "non-normalized" string to compare with (used to detect case match priority)
     * @param {Array} specials list of special indexes in str (from findSpecialCharacters)
     * @param {int} startingSpecial index into specials array to start scanning with
     * @param {boolean} lastSegmentStart which character does the last segment start at
     * @return {{remainder:int, matchList:Array.<SpecialMatch|NormalMatch>}} matched indexes or null if no matches possible
     */
    function _lastSegmentSearch(query, str, originalQuery, originalStr, specials, startingSpecial, lastSegmentStart) {
        var queryCounter, matchList;
        
        // It's possible that the query is longer than the last segment.
        // If so, we can chop off the bit that we know couldn't possibly be there.
        var remainder = "",
            originalRemainder = "",
            extraCharacters = specials[startingSpecial] + query.length - str.length;

        if (extraCharacters > 0) {
            remainder = query.substring(0, extraCharacters);
            originalRemainder = originalQuery.substring(0, extraCharacters);
            query = query.substring(extraCharacters);
            originalQuery = originalQuery.substring(extraCharacters);
        }
        
        for (queryCounter = 0; queryCounter < query.length; queryCounter++) {
            matchList = _generateMatchList(query.substring(queryCounter),
                                     str, originalQuery.substring(queryCounter),
                                     originalStr, specials, startingSpecial);
            
            // if we've got a match *or* there are no segments in this string, we're done
            if (matchList || startingSpecial === 0) {
                break;
            }
        }
        
        if (queryCounter === query.length || !matchList) {
            return null;
        } else {
            return {
                remainder: remainder + query.substring(0, queryCounter),
                originalRemainder: originalRemainder + originalQuery.substring(0, queryCounter),
                matchList: matchList
            };
        }
    }
    
    /*
     * Implements the top-level search algorithm. Search the last segment first,
     * then search the rest of the string with the remainder.
     *
     * The parameters and return value are the same as for getMatchRanges.
     *
     * @param {string} queryLower the search string (will be searched lower case)
     * @param {string} compareLower the lower-cased string to search
     * @param {string} originalQuery the "non-normalized" query string (used to detect case match priority)
     * @param {string} originalStr the "non-normalized" string to compare with (used to detect case match priority)
     * @param {Array} specials list of special indexes in str (from findSpecialCharacters)
     * @param {int} lastSegmentSpecialsIndex index into specials array to start scanning with
     * @return {Array.<SpecialMatch|NormalMatch>} matched indexes or null if no matches possible
     */
    function _wholeStringSearch(queryLower, compareLower, originalQuery, originalStr, specials, lastSegmentSpecialsIndex) {
        var lastSegmentStart = specials[lastSegmentSpecialsIndex];
        var result;
        var matchList;
        
        result = _lastSegmentSearch(queryLower, compareLower, originalQuery, originalStr, specials, lastSegmentSpecialsIndex, lastSegmentStart);
        
        if (result) {
            matchList = result.matchList;
            
            // Do we have more query characters that did not fit?
            if (result.remainder) {
                // Scan with the remainder only through the beginning of the last segment
                var remainderMatchList = _generateMatchList(result.remainder,
                                              compareLower.substring(0, lastSegmentStart),
                                              result.originalRemainder,
                                              originalStr.substring(0, lastSegmentStart),
                                              specials.slice(0, lastSegmentSpecialsIndex), 0);
                
                if (remainderMatchList) {
                    // add the new matched ranges to the beginning of the set of ranges we had
                    matchList.unshift.apply(matchList, remainderMatchList);
                } else {
                    // no match
                    return null;
                }
            }
        } else {
            // No match in the last segment, so we start over searching the whole
            // string
            matchList = _generateMatchList(queryLower, compareLower, originalQuery, originalStr, specials, 0);
        }
        
        return matchList;
    }
    
    /**
     * Converts a list of matches into a form suitable for returning from stringMatch.
     *
     * @param {Array.<SpecialMatch|NormalMatch>} matchList to convert
     * @param {string} original string
     * @param {int} character index where last segment begins
     * @return {{ranges:Array.<{text:string, matched:boolean, includesLastSegment:boolean}>, matchGoodness:int, scoreDebug: Object}} matched ranges and score
     */
    function _computeRangesAndScore(matchList, str, lastSegmentStart) {
        var matchCounter;
        var ranges = [];
        var lastMatchIndex = -1;
        var lastSegmentScore = 0;
        var currentRangeStartedOnSpecial = false;
        
        var score = 0;
        var scoreDebug;
        if (DEBUG_SCORES) {
            scoreDebug = {
                special: 0,
                match: 0,
                upper: 0,
                lastSegment: 0,
                beginning: 0,
                lengthDeduction: 0,
                consecutive: 0,
                notStartingOnSpecial: 0
            };
        }
        
        var currentRange = null;
        
        // Records the current range and adds any additional ranges required to
        // get to character index c. This function is called before starting a new range
        // or returning from the function.
        function closeRangeGap(c) {
            // Close the current range
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
            
            // If there was space between the new range and the last,
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
        
        // In some cases (see the use of this variable below), we accelerate the
        // bonus the more consecutive matches there are.
        var numConsecutive = 0;
        
        // Adds a matched character to the appropriate range
        function addMatch(match) {
            // Pull off the character index
            var c = match.index;
            var newPoints = 0;
            
            // A match means that we need to do some scoring bookkeeping.
            // Start with points added for any match
            if (DEBUG_SCORES) {
                scoreDebug.match += MATCH_POINTS;
            }
            newPoints += MATCH_POINTS;
            
            if (match.upper) {
                if (DEBUG_SCORES) {
                    scoreDebug.upper += UPPER_CASE_MATCH;
                }
                newPoints += UPPER_CASE_MATCH;
            }
                        
            // A bonus is given for characters that match at the beginning
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
                // Continue boosting for each additional match at the beginning
                // of the name
                if (c - numConsecutive === lastSegmentStart) {
                    if (DEBUG_SCORES) {
                        scoreDebug.beginning += BEGINNING_OF_NAME_POINTS;
                    }
                    newPoints += BEGINNING_OF_NAME_POINTS;
                }
                
                numConsecutive++;
                
                var boost = CONSECUTIVE_MATCHES_POINTS * numConsecutive;
                
                // Consecutive matches that started on a special are a
                // good indicator of intent, so we award an added bonus there.
                if (currentRangeStartedOnSpecial) {
                    boost = boost * 2;
                }
                
                if (DEBUG_SCORES) {
                    scoreDebug.consecutive += boost;
                }
                newPoints += boost;
            } else {
                numConsecutive = 1;
            }
            
            // add points for "special" character matches
            if (match instanceof SpecialMatch) {
                if (DEBUG_SCORES) {
                    scoreDebug.special += SPECIAL_POINTS;
                }
                newPoints += SPECIAL_POINTS;
            }
            
            score += newPoints;
            
            // points accumulated in the last segment get an extra bonus
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
                currentRangeStartedOnSpecial = match instanceof SpecialMatch;
            } else {
                currentRange.text += str[c];
            }
        }
        
        // scan through the matches, adding each one in turn
        for (matchCounter = 0; matchCounter < matchList.length; matchCounter++) {
            var match = matchList[matchCounter];
            addMatch(match);
        }
        
        // add a range for the last part of the string
        closeRangeGap(str.length);
        
        // shorter strings that match are often better than longer ones
        var lengthPenalty = -1 * Math.round(str.length * DEDUCTION_FOR_LENGTH);
        if (DEBUG_SCORES) {
            scoreDebug.lengthDeduction = lengthPenalty;
        }
        score = score + lengthPenalty;

        var result = {
            ranges: ranges,
            matchGoodness: score
        };
        
        if (DEBUG_SCORES) {
            result.scoreDebug = scoreDebug;
        }
        return result;
    }
    
    /*
     * If we short circuit normal matching to produce a prefix match,
     * this function will generate the appropriate SearchResult.
     * This function assumes that the prefix match check has already
     * been performed.
     *
     * @param {string} str  The string with the prefix match for the query
     * @param {string} query  The query that matched the beginning of str
     * @return {{ranges:Array.<{text:string, matched:boolean, includesLastSegment:boolean}>, matchGoodness:int, scoreDebug: Object}} ranges has a matching range for beginning of str
     *                      and a non-matching range for the end of the str
     *                      the score is -Number.MAX_VALUE in all cases
     */
    function _prefixMatchResult(str, query) {
        var result = new SearchResult(str);
        
        result.matchGoodness = -Number.MAX_VALUE;
        
        if (str.substr(0, query.length) !== query) {
            // Penalize for not matching case
            result.matchGoodness *= 0.5;
        }
        
        if (DEBUG_SCORES) {
            result.scoreDebug = {
                beginning: -result.matchGoodness
            };
        }
        
        result.stringRanges = [{
            text: str.substr(0, query.length),
            matched: true,
            includesLastSegment: true
        }];
        if (str.length > query.length) {
            result.stringRanges.push({
                text: str.substring(query.length),
                matched: false,
                includesLastSegment: true
            });
        }
        return result;
    }


    /*
     * Match str against the query using the QuickOpen algorithm provided by
     * the functions above. The general idea is to prefer matches of "special" characters and,
     * optionally, matches that occur in the "last segment" (generally, the filename). stringMatch
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
     * @param {{preferPrefixMatches:?boolean, segmentedSearch:?boolean}} options to control search behavior.
     *                  preferPrefixMatches puts an exact case-insensitive prefix match ahead of all other matches,
     *                  even short-circuiting the match logic. This option implies segmentedSearch=false.
     *                  When segmentedSearch is true, the string is broken into segments by "/" characters
     *                  and the last segment is searched first and matches there are scored higher.
     * @param {?Object} special (optional) the specials data from findSpecialCharacters, if already known
     *                  This is generally just used by StringMatcher for optimization.
     * @return {{ranges:Array.<{text:string, matched:boolean, includesLastSegment:boolean}>, matchGoodness:int, scoreDebug: Object}} matched ranges and score
     */
    function stringMatch(str, query, options, special) {
        var result;
        
        options = options || {};
        
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
        
        // comparisons are case insensitive, so switch to lower case here
        var queryLower = query.toLowerCase();
        var compareLower = str.toLowerCase();
        
        if (options.preferPrefixMatches) {
            options.segmentedSearch = false;
        }
        
        if (options.preferPrefixMatches && compareLower.substr(0, queryLower.length) === queryLower) {
            // NOTE: we compare against the case insensitive match
            //        above but we pass the case-sensitive version in 
            //        because we want to weight the match to give case-matches
            //        a higher score
            return _prefixMatchResult(str, query);
        }
        
        // Locate the special characters and then use orderedCompare to do the real
        // work.
        if (!special) {
            special = findSpecialCharacters(str);
        }
        var lastSegmentStart, matchList;
        
        // For strings that are not broken into multiple segments, we can potentially
        // avoid some extra work
        if (options.segmentedSearch) {
            lastSegmentStart = special.specials[special.lastSegmentSpecialsIndex];
            matchList = _wholeStringSearch(queryLower, compareLower, query, str, special.specials,
                              special.lastSegmentSpecialsIndex);
        } else {
            lastSegmentStart = 0;
            matchList = _generateMatchList(queryLower, compareLower, query, str, special.specials, 0);
        }

        // If we get a match, turn this into a SearchResult as expected by the consumers
        // of this API.
        if (matchList) {
            var compareData = _computeRangesAndScore(matchList, str, lastSegmentStart);
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
     * in case of ties. 'fieldSpec' provides the priority order for fields, where the first entry is the primary field, for example:
     *      multiFieldSort(bugList, [ "milestone", "severity" ]);
     * Would sort a bug list by milestone, and within each milestone sort bugs by severity.
     *
     * fieldSpec can also include comparator functions of the form normally used by the sort()
     * function.
     *
     * Any fields that have a string value are compared case-insensitively. Fields used should be
     * present on all SearchResult objects (no optional/undefined fields).
     *
     * @param {!Array.<SearchResult>} searchResults
     * @param {!Array.<string, function>} fieldSpec
     */
    function multiFieldSort(searchResults, fieldSpec) {
        // Move field names into an array, with primary field first
        var comparisons;
        if (Array.isArray(fieldSpec)) {
            comparisons = fieldSpec;
        } else {
            // TODO Deprecate this form of calling this function
            comparisons = [];
            _.forEach(fieldSpec, function (priority, key) {
                comparisons[priority] = key;
            });
        }
        
        searchResults.sort(function (a, b) {
            var priority;
            for (priority = 0; priority < comparisons.length; priority++) {
                var comparison = comparisons[priority];
                if (typeof comparison === "function") {
                    var result = comparison(a, b);
                    if (result) {
                        return result;
                    }
                } else {
                    var valueA = a[comparison];
                    var valueB = b[comparison];
                    if (typeof valueA === "string") {
                        valueA = valueA.toLowerCase();
                        valueB = valueB.toLowerCase();
                    }
                    
                    if (valueA < valueB) {
                        return -1;
                    } else if (valueA > valueB) {
                        return 1;
                    }
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
    
    /**
     * A StringMatcher provides an interface to the stringMatch function with built-in
     * caching. You should use a StringMatcher for the lifetime of queries over a
     * single data set.
     *
     * You are free to store other data on this object to assist in higher-level caching.
     * (This object's caches are all stored in "_" prefixed properties.)
     *
     * @param {{preferPrefixMatches:?boolean, segmentedSearch:?boolean}} options to control search behavior.
     *                  preferPrefixMatches puts an exact case-insensitive prefix match ahead of all other matches,
     *                  even short-circuiting the match logic. This option implies segmentedSearch=false.
     *                  segmentedSearch treats segments of the string specially.
     */
    function StringMatcher(options) {
        this.options = options;
        this.reset();
    }
    
    /**
     * Map from search-result string to the findSpecialCharacters() result for that string - easy to cache
     * since this info doesn't change as the query changes.
     * @type {Object.<string, {specials:Array.<number>, lastSegmentSpecialsIndex:number}>}
     */
    StringMatcher.prototype._specialsCache = null;
    
    /**
     * Set of search-result strings that we know don't match the query _lastQuery - or any other query with
     * that prefix.
     * @type {Object.<string, boolean>}
     */
    StringMatcher.prototype._noMatchCache = null;
    
    /**
     * Clears the caches. Use this in the event that the caches may be invalid.
     */
    StringMatcher.prototype.reset = function () {
        // We keep track of the last query to know when we need to invalidate.
        this._lastQuery = null;
        
        this._specialsCache = {};
        this._noMatchCache = {};
    };
    
    /**
     * Performs a single match using the stringMatch function. See stringMatch for full documentation.
     *
     * @param {string} str  The string to search
     * @param {string} query  The query string to find in string
     * @return {{ranges:Array.<{text:string, matched:boolean, includesLastSegment:boolean}>, matchGoodness:int, scoreDebug: Object}} matched ranges and score
     */
    StringMatcher.prototype.match = function (str, query) {
        
        // If the query is not just added characters from the previous query, we invalidate
        // the no match cache and will re-match everything.
        if (this._lastQuery !== null && (this._lastQuery !== query.substring(0, this._lastQuery.length))) {
            this._noMatchCache = {};
        }
        
        this._lastQuery = query;
        
        // Check for a known non-matching string.
        if (_.has(this._noMatchCache, str)) {
            return undefined;
        }
        
        // Load up the cached specials information (or build it if this is our first time through).
        var special = _.has(this._specialsCache, str) ? this._specialsCache[str] : undefined;
        if (special === undefined) {
            special = findSpecialCharacters(str);
            this._specialsCache[str] = special;
        }
        
        var result = stringMatch(str, query, this.options, special);
        
        // If this query was not a match, we cache that fact for next time.
        if (!result) {
            this._noMatchCache[str] = true;
        }
        return result;
    };
    
    exports._findSpecialCharacters  = findSpecialCharacters;
    exports._wholeStringSearch      = _wholeStringSearch;
    exports._lastSegmentSearch      = _lastSegmentSearch;
    exports._setDebugScores         = _setDebugScores;
    exports._generateMatchList      = _generateMatchList;
    exports._SpecialMatch           = SpecialMatch;
    exports._NormalMatch            = NormalMatch;
    exports._computeRangesAndScore  = _computeRangesAndScore;

    // public exports
    exports.SearchResult            = SearchResult;
    exports.stringMatch             = stringMatch;
    exports.basicMatchSort          = basicMatchSort;
    exports.multiFieldSort          = multiFieldSort;
    exports.StringMatcher           = StringMatcher;
});

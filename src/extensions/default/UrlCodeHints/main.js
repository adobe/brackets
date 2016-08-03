/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */


define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var AppInit             = brackets.getModule("utils/AppInit"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        FileSystem          = brackets.getModule("filesystem/FileSystem"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        HTMLUtils           = brackets.getModule("language/HTMLUtils"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        StringUtils         = brackets.getModule("utils/StringUtils"),
        Strings             = brackets.getModule("strings"),
        Data                = require("text!data.json"),

        urlHints,
        data,
        htmlAttrs,
        styleModes      = ["css", "text/x-less", "text/x-scss"];


    PreferencesManager.definePreference("codehint.UrlCodeHints", "boolean", true, {
        description: Strings.DESCRIPTION_URL_CODE_HINTS
    });

    /**
     * @constructor
     */
    function UrlCodeHints() {}

    /**
     * Helper function to create a list of urls to existing files based on the query.
     * @param {{queryStr: string}} query -- a query object, used to filter the code hints
     *
     * @return {Array.<string>|$.Deferred} The (possibly deferred) hints.
     */
    UrlCodeHints.prototype._getUrlList = function (query) {
        var directory,
            doc,
            docDir,
            queryDir = "",
            queryUrl,
            result = [],
            self,
            targetDir,
            unfiltered = [];

        doc = this.editor && this.editor.document;
        if (!doc || !doc.file) {
            return result;
        }

        docDir = FileUtils.getDirectoryPath(doc.file.fullPath);

        // get relative path from query string
        queryUrl = window.PathUtils.parseUrl(query.queryStr);
        if (queryUrl) {
            queryDir = queryUrl.directory;
        }

        // build target folder path
        if (queryDir.length > 0 && queryDir[0] === "/") {
            // site-root relative path
            targetDir = ProjectManager.getProjectRoot().fullPath +
                        decodeURI(queryDir).substring(1);
        } else {
            // page relative path
            targetDir = docDir + decodeURI(queryDir);
        }

        // Get list of files from target folder. Getting the file/folder info is an
        // asynch operation, so it works like this:
        //
        // The initial pass initiates the asynchronous retrieval of data and returns an
        // empty list, so no code hints are displayed. In the async callback, the code
        // hints and the original query are stored in a cache, and then the process to
        // show code hints is re-initiated.
        //
        // During the next pass, there should now be code hints cached from the initial
        // pass, but user may have typed while file/folder info was being retrieved from
        // disk, so we need to make sure code hints still apply to current query. If so,
        // display them, otherwise, clear cache and start over.
        //
        // As user types within a folder, the same unfiltered file/folder list is still
        // valid and re-used from cache. Filtering based on user input is done outside
        // of this method. When user moves to a new folder, then the cache is deleted,
        // and file/folder info for new folder is then retrieved.

        if (this.cachedHints) {
            // url hints have been cached, so determine if they're stale
            if (!this.cachedHints.query ||
                    this.cachedHints.query.tag !== query.tag ||
                    this.cachedHints.query.attrName !== query.attrName ||
                    this.cachedHints.queryDir !== queryDir ||
                    this.cachedHints.docDir !== docDir) {

                // delete stale cache
                this.cachedHints = null;
            }
        }

        if (this.cachedHints) {
            // use cached hints
            unfiltered = this.cachedHints.unfiltered;

        } else {
            directory = FileSystem.getDirectoryForPath(targetDir);
            self = this;

            if (self.cachedHints && self.cachedHints.deferred) {
                self.cachedHints.deferred.reject();
            }
            // create empty object so we can detect "waiting" state
            self.cachedHints = {};
            self.cachedHints.deferred = $.Deferred();
            self.cachedHints.unfiltered = [];

            directory.getContents(function (err, contents) {
                var currentDeferred, entryStr, syncResults;

                if (!err) {
                    contents.forEach(function (entry) {
                        if (ProjectManager.shouldShow(entry)) {
                            // convert to doc relative path
                            entryStr = queryDir + entry._name;
                            if (entry._isDirectory) {
                                entryStr += "/";
                            }

                            // code hints show the unencoded string so the
                            // choices are easier to read.  The encoded string
                            // will still be inserted into the editor.
                            unfiltered.push(entryStr);
                        }
                    });

                    self.cachedHints.unfiltered = unfiltered;
                    self.cachedHints.query      = query;
                    self.cachedHints.queryDir   = queryDir;
                    self.cachedHints.docDir     = docDir;

                    if (self.cachedHints.deferred.state() !== "rejected") {
                        currentDeferred = self.cachedHints.deferred;

                        // Since we've cached the results, the next call to _getUrlList should be synchronous.
                        // If it isn't, we've got a problem and should reject both the current deferred
                        // and any new deferred that got created on the call.
                        syncResults = self._getUrlList(query);
                        if (syncResults instanceof Array) {
                            currentDeferred.resolveWith(self, [syncResults]);
                        } else {
                            if (currentDeferred && currentDeferred.state() === "pending") {
                                currentDeferred.reject();
                            }

                            if (self.cachedHints.deferred &&
                                    self.cachedHints.deferred.state() === "pending") {
                                self.cachedHints.deferred.reject();
                                self.cachedHints.deferred = null;
                            }
                        }
                    }
                }
            });

            return self.cachedHints.deferred;
        }

        // build list

        // without these entries, typing "../" will not display entries for containing folder
        if (queryUrl.filename === ".") {
            result.push(queryDir + ".");
        } else if (queryUrl.filename === "..") {
            result.push(queryDir + "..");
        }

        // add file/folder entries
        unfiltered.forEach(function (item) {
            result.push(item);
        });

        // TODO: filter by desired file type based on tag, type attr, etc.

        // TODO: add list item to top of list to popup modal File Finder dialog
        // New string: "Browse..." or "Choose a File..."
        // Command: Commands.FILE_OPEN

        return result;
    };

    /**
     * Helper function that determines the possible value hints for a given html tag/attribute name pair
     *
     * @param {{queryStr: string}} query
     * The current query
     *
     * @return {{hints: (Array.<string>|$.Deferred), sortFunc: ?function(string, string): number}}
     * The (possibly deferred) hints and the sort function to use on thise hints.
     */
    UrlCodeHints.prototype._getUrlHints = function (query) {
        var hints = [],
            sortFunc;

        // Do not show hints after "?" in url
        if (query.queryStr.indexOf("?") === -1) {

            // Default behavior for url hints is do not close on select.
            this.closeOnSelect = false;
            hints = this._getUrlList(query);
            sortFunc = StringUtils.urlSort;
        }

        return { hints: hints, sortFunc: sortFunc };
    };

    /**
     * Determines whether url hints are available in the current editor
     * context.
     *
     * @param {Editor} editor
     * A non-null editor object for the active window.
     *
     * @param {string} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {boolean}
     * Determines whether the current provider is able to provide hints for
     * the given editor context and, in case implicitChar is non-null,
     * whether it is appropriate to do so.
     */
    UrlCodeHints.prototype.hasHints = function (editor, implicitChar) {
        var mode = editor.getModeForSelection();
        if (mode === "html") {
            return this.hasHtmlHints(editor, implicitChar);
        } else if (styleModes.indexOf(mode) > -1) {
            return this.hasCssHints(editor, implicitChar);
        }

        return false;
    };

    /**
     * Helper function for hasHints() for CSS.
     *
     * @param {Editor} editor
     * A non-null editor object for the active window.
     *
     * @param {string} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {boolean}
     * Determines whether the current provider is able to provide hints for
     * the given editor context and, in case implicitChar is non-null,
     * whether it is appropriate to do so.
     */
    UrlCodeHints.prototype.hasCssHints = function (editor, implicitChar) {
        this.editor = editor;
        var cursor = this.editor.getCursorPos();

        this.info = CSSUtils.getInfoAtPos(editor, cursor);

        if (this.info.context !== CSSUtils.PROP_VALUE && this.info.context !== CSSUtils.IMPORT_URL) {
            return false;
        }

        // collect existing value
        var i,
            val = "";

        for (i = 0; i <= this.info.index && i < this.info.values.length; i++) {
            if (i < this.info.index) {
                val += this.info.values[i];
            } else {
                val += this.info.values[i].substring(0, this.info.offset);
            }
        }

        // starts with "url(" ?
        if (val.match(/^\s*url\(/i)) {
            return true;
        }

        return false;
    };

    /**
     * Helper function for hasHints() for HTML.
     *
     * @param {Editor} editor
     * A non-null editor object for the active window.
     *
     * @param {string} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {boolean}
     * Determines whether the current provider is able to provide hints for
     * the given editor context and, in case implicitChar is non-null,
     * whether it is appropriate to do so.
     */
    UrlCodeHints.prototype.hasHtmlHints = function (editor, implicitChar) {
        var tagInfo,
            query,
            tokenType;

        this.editor = editor;

        tagInfo = HTMLUtils.getTagInfo(editor, editor.getCursorPos());
        query = null;
        tokenType = tagInfo.position.tokenType;

        if (tokenType === HTMLUtils.ATTR_VALUE) {

            // Verify that attribute name has hintable values
            if (htmlAttrs[tagInfo.attr.name]) {

                if (tagInfo.position.offset >= 0) {
                    query = tagInfo.attr.value.slice(0, tagInfo.position.offset);
                } else {
                    // We get negative offset for a quoted attribute value with some leading whitespaces
                    // as in <a rel= "rtl" where the cursor is just to the right of the "=".
                    // So just set the queryStr to an empty string.
                    query = "";
                }

                var hintsAndSortFunc = this._getUrlHints({queryStr: query}),
                    hints = hintsAndSortFunc.hints;

                if (hints instanceof Array) {
                    // If we got synchronous hints, check if we have something we'll actually use
                    var i, foundPrefix = false;
                    query = query.toLowerCase();
                    for (i = 0; i < hints.length; i++) {
                        if (hints[i].toLowerCase().indexOf(query) === 0) {
                            foundPrefix = true;
                            break;
                        }
                    }

                    if (!foundPrefix) {
                        query = null;
                    }
                }
            }
        }

        return (query !== null);
    };

    /**
     * Returns a list of available url hints, if possible, for the current
     * editor context.
     *
     * @return {jQuery.Deferred|{
     *              hints: Array.<string|jQueryObject>,
     *              match: string,
     *              selectInitial: boolean,
     *              handleWideResults: boolean}}
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides
     * 1. a sorted array hints that consists of strings
     * 2. a string match that is used by the manager to emphasize matching
     *    substrings when rendering the hint list
     * 3. a boolean that indicates whether the first result, if one exists, should be
     *    selected by default in the hint list window.
     * 4. handleWideResults, a boolean (or undefined) that indicates whether
     *    to allow result string to stretch width of display.
     */
    UrlCodeHints.prototype.getHints = function (key) {
        var mode = this.editor.getModeForSelection(),
            cursor = this.editor.getCursorPos(),
            filter = "",
            hints = [],
            sortFunc,
            query = { queryStr: "" },
            result = [];

        if (mode === "html") {
            var tagInfo = HTMLUtils.getTagInfo(this.editor, cursor),
                tokenType = tagInfo.position.tokenType;

            if (tokenType !== HTMLUtils.ATTR_VALUE || !htmlAttrs[tagInfo.attr.name]) {
                return null;
            }

            if (tagInfo.position.offset >= 0) {
                query.queryStr = tagInfo.attr.value.slice(0, tagInfo.position.offset);
            }
            this.info = tagInfo;

        } else if (styleModes.indexOf(mode) > -1) {
            this.info = CSSUtils.getInfoAtPos(this.editor, cursor);

            var context = this.info.context;
            if (context !== CSSUtils.PROP_VALUE && context !== CSSUtils.IMPORT_URL) {
                return null;
            }

            // Cursor is in an existing property value or partially typed value
            if (this.info.index !== -1) {

                // Collect value up to (item) index/(char) offset
                var i, val = "";
                for (i = 0; i < this.info.index; i++) {
                    val += this.info.values[i];
                }
                // index may exceed length of array for multiple-value case
                if (this.info.index < this.info.values.length) {
                    val += this.info.values[this.info.index].substr(0, this.info.offset);
                }

                // Strip "url("
                val = val.replace(/^\s*url\(/i, "");

                // Keep track of leading whitespace and strip it
                var matchWhitespace = val.match(/^\s*/);
                if (matchWhitespace) {
                    this.info.leadingWhitespace = matchWhitespace[0];
                    val = val.substring(matchWhitespace[0].length);
                } else {
                    this.info.leadingWhitespace = null;
                }

                // Keep track of opening quote and strip it
                if (val.match(/^["']/)) {
                    this.info.openingQuote = val[0];
                    val = val.substring(1);
                } else {
                    this.info.openingQuote = null;
                }

                query.queryStr = val;
            }

        } else {
            return null;
        }

        if (query.queryStr !== null) {
            filter = query.queryStr;
            var hintsAndSortFunc = this._getUrlHints(query);
            hints = hintsAndSortFunc.hints;
            sortFunc = hintsAndSortFunc.sortFunc;
        }
        this.info.filter = filter;

        if (hints instanceof Array && hints.length) {
            // Array was returned
            var lowerCaseFilter = filter.toLowerCase();
            console.assert(!result.length);
            result = $.map(hints, function (item) {
                if (item.toLowerCase().indexOf(lowerCaseFilter) === 0) {
                    return item;
                }
            }).sort(sortFunc);

            return {
                hints: result,
                match: query.queryStr,
                selectInitial: true,
                handleWideResults: false
            };

        } else if (hints instanceof Object && hints.hasOwnProperty("done")) {
            // Deferred hints were returned
            var deferred = $.Deferred();
            hints.done(function (asyncHints) {
                var lowerCaseFilter = filter.toLowerCase();
                result = $.map(asyncHints, function (item) {
                    if (item.toLowerCase().indexOf(lowerCaseFilter) === 0) {
                        return item;
                    }
                }).sort(sortFunc);

                deferred.resolveWith(this, [{
                    hints: result,
                    match: query.queryStr,
                    selectInitial: true,
                    handleWideResults: false
                }]);
            });

            return deferred;
        }

        return null;
    };

    /**
     * Inserts a given url hint into the current editor context.
     *
     * @param {jQuery.Object} completion
     * The hint to be inserted into the editor context.
     *
     * @return {boolean}
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    UrlCodeHints.prototype.insertHint = function (completion) {
        var mode = this.editor.getModeForSelection();

        // Encode the string just prior to inserting the hint into the editor
        completion = encodeURI(completion);

        if (mode === "html") {
            return this.insertHtmlHint(completion);
        } else if (styleModes.indexOf(mode) > -1) {
            return this.insertCssHint(completion);
        }

        return false;
    };

    /**
     * Get distance between 2 positions.
     *
     * Assumption: pos2 >= pos1
     *
     * Note that this function is designed to work on CSSUtils info.values array,
     * so this could be made a method if that is converted to an object.
     *
     * @param {Array.<string>}  array  - strings to be searched
     * @param {{index: number, offset: number}} pos1 - starting index/offset in index string
     * @param {{index: number, offset: number}} pos2 - ending index/offset in index string
     *
     * @return {number}
     * Number of characters between 2 positions
     */
    UrlCodeHints.prototype.getCharOffset = function (array, pos1, pos2) {
        var i, count = 0;

        if (pos1.index === pos2.index) {
            return (pos2.offset >= pos1.offset) ? (pos2.offset - pos1.offset) : 0;
        } else if (pos1.index < pos2.index) {
            if (pos1.index < 0 || pos1.index >= array.length || pos2.index < 0 || pos2.index >= array.length) {
                return 0;
            }

            for (i = pos1.index; i <= pos2.index; i++) {
                if (i === pos1.index) {
                    count += (array[i].length - pos1.offset);
                } else if (i === pos2.index) {
                    count += pos2.offset;
                } else {
                    count += array[i].length;
                }
            }
        }

        return count;
    };

    /**
     * Finds next position in array of specified char.
     *
     * Note that this function is designed to work on CSSUtils info.values array,
     * so this could be made a method if that is converted to an object.
     *
     * @param {Array}  array - strings to be searched
     * @param {string} ch    - char to search for
     * @param {{index: number, offset: number}} pos - starting index/offset in index string
     *
     * @return {{index: number, offset: number}}
     * Index of array, and offset in string where char found.
     */
    UrlCodeHints.prototype.findNextPosInArray = function (array, ch, pos) {
        var i, o, searchOffset;
        for (i = pos.index; i < array.length; i++) {
            // Only use offset on index, then offset of 0 after that
            searchOffset = (i === pos.index) ? pos.offset : 0;
            o = array[i].indexOf(ch, searchOffset);

            if (o !== -1) {
                return { index: i, offset: o };
            }
        }
        return { index: -1, offset: -1 };
    };

    /**
     * Inserts a given css url hint into the current editor context.
     *
     * @param {jQuery.Object} completion
     * The hint to be inserted into the editor context.
     *
     * @return {boolean}
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    UrlCodeHints.prototype.insertCssHint = function (completion) {
        var cursor = this.editor.getCursorPos(),
            start  = { line: cursor.line, ch: cursor.ch },
            end    = { line: cursor.line, ch: cursor.ch };

        var hasClosingQuote = false,
            hasClosingParen = false,
            insertText      = completion,
            moveLen         = 0,
            closingPos      = { index: -1, offset: -1 },
            searchResult    = { index: -1, offset: -1 };

        if (this.info.context !== CSSUtils.PROP_VALUE && this.info.context !== CSSUtils.IMPORT_URL) {
            return false;
        }

        // Special handling for URL hinting -- if the completion is a file name
        // and not a folder, then close the code hint list.
        if (!this.closeOnSelect && completion.match(/\/$/) === null) {
            this.closeOnSelect = true;
        }

        // Look for optional closing quote
        if (this.info.openingQuote) {
            closingPos = this.findNextPosInArray(this.info.values, this.info.openingQuote, this.info);
            hasClosingQuote = (closingPos.index !== -1);
        }

        // Look for closing paren
        if (hasClosingQuote) {
            searchResult = this.findNextPosInArray(this.info.values, ")", closingPos);
            hasClosingParen = (searchResult.index !== -1);
        } else {
            // index may exceed length of array for multiple-value case
            closingPos = this.findNextPosInArray(this.info.values, ")", this.info);
            hasClosingParen = (closingPos.index !== -1);
        }

        // Insert folder names, but replace file names, so if a file is selected
        // (i.e. closeOnSelect === true), then adjust insert char positions to
        // replace existing value, if there is a closing paren
        if (this.closeOnSelect) {
            if (closingPos.index !== -1) {
                end.ch += this.getCharOffset(this.info.values, this.info, closingPos);
            }
        } else {
            // If next char is "/", then overwrite it since we're inserting a "/"
            var nextSlash = this.findNextPosInArray(this.info.values, "/", this.info);
            if (nextSlash.index === this.info.index && nextSlash.offset === this.info.offset) {
                end.ch += 1;
            }
        }
        if (this.info.filter.length > 0) {
            start.ch -= this.info.filter.length;
        }

        // Append matching quote, whitespace, paren
        if (this.info.openingQuote && !hasClosingQuote) {
            insertText += this.info.openingQuote;
        }
        if (!hasClosingParen) {
            // Add trailing whitespace to match leading whitespace
            if (this.info.leadingWhitespace) {
                insertText += this.info.leadingWhitespace;
            }
            insertText += ")";
        }

        // HACK (tracking adobe/brackets#1688): We talk to the private CodeMirror instance
        // directly to replace the range instead of using the Document, as we should. The
        // reason is due to a flaw in our current document synchronization architecture when
        // inline editors are open.
        this.editor._codeMirror.replaceRange(insertText, start, end);

        // Adjust cursor position
        if (this.closeOnSelect) {
            // If there is existing closing quote and/or paren, move the cursor past them
            moveLen = (hasClosingQuote ? 1 : 0) + (hasClosingParen ? 1 : 0);
            if (moveLen > 0) {
                this.editor.setCursorPos(start.line, start.ch + completion.length + moveLen);
            }
            return false;

        } else {
            // If closing quote and/or paren are added, move the cursor to where it would have been
            moveLen = ((this.info.openingQuote && !hasClosingQuote) ? 1 : 0) + (!hasClosingParen ? 1 : 0);
            if (moveLen > 0) {
                this.editor.setCursorPos(start.line, start.ch + completion.length);
            }
        }

        return true;
    };

    /**
     * Inserts a given html url hint into the current editor context.
     *
     * @param {jQuery.Object} completion
     * The hint to be inserted into the editor context.
     *
     * @return {boolean}
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    UrlCodeHints.prototype.insertHtmlHint = function (completion) {
        var cursor = this.editor.getCursorPos(),
            start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            tagInfo = HTMLUtils.getTagInfo(this.editor, cursor),
            tokenType = tagInfo.position.tokenType,
            charCount = 0,
            endQuote = "",
            shouldReplace = false;

        if (tokenType === HTMLUtils.ATTR_VALUE) {
            // Special handling for URL hinting -- if the completion is a file name
            // and not a folder, then close the code hint list.
            if (!this.closeOnSelect && completion.match(/\/$/) === null) {
                this.closeOnSelect = true;

                // Insert folder names, but replace file names
                shouldReplace = true;
            }

            if (!tagInfo.attr.hasEndQuote) {
                endQuote = tagInfo.attr.quoteChar;
                if (endQuote) {
                    completion += endQuote;
                } else if (tagInfo.position.offset === 0) {
                    completion = "\"" + completion + "\"";
                }
            } else if (completion === tagInfo.attr.value) {
                shouldReplace = false;
            }

            if (shouldReplace) {
                // Replace entire value
                charCount = tagInfo.attr.value.length;
            } else {
                // Replace filter (to insert new selection)
                charCount = this.info.filter.length;

                // If next char is "/", then overwrite it since we're inserting a "/"
                if (this.info.attr.value.length > charCount && this.info.attr.value[charCount] === "/") {
                    charCount += 1;
                }
            }
        }

        end.line = start.line = cursor.line;
        start.ch = cursor.ch - tagInfo.position.offset;
        end.ch = start.ch + charCount;

        this.editor.document.replaceRange(completion, start, end);

        if (!this.closeOnSelect) {
            // If we append the missing quote, then we need to adjust the cursor postion
            // to keep the code hint list open.
            if (tokenType === HTMLUtils.ATTR_VALUE && !tagInfo.attr.hasEndQuote) {
                this.editor.setCursorPos(start.line, start.ch + completion.length - 1);
            }
            return true;
        }

        if (tokenType === HTMLUtils.ATTR_VALUE && tagInfo.attr.hasEndQuote) {
            // Move the cursor to the right of the existing end quote after value insertion.
            this.editor.setCursorPos(start.line, start.ch + completion.length + 1);
        }

        return false;
    };

    function _clearCachedHints() {
        // Verify cache exists and is not deferred
        if (urlHints && urlHints.cachedHints && urlHints.cachedHints.deferred &&
                urlHints.cachedHints.deferred.state() !== "pending") {

            // Cache may or may not be stale. Main benefit of cache is to limit async lookups
            // during typing. File tree updates cannot happen during typing, so it's probably
            // not worth determining whether cache may still be valid. Just delete it.
            urlHints.cachedHints = null;
        }
    }

    AppInit.appReady(function () {
        data            = JSON.parse(Data);
        htmlAttrs       = data.htmlAttrs;

        urlHints        = new UrlCodeHints();
        CodeHintManager.registerHintProvider(urlHints, ["css", "html", "less", "scss"], 5);

        FileSystem.on("change", _clearCachedHints);
        FileSystem.on("rename", _clearCachedHints);

        // For unit testing
        exports.hintProvider = urlHints;
    });
});

/*
 * Copyright (c) 2013
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


/*

TODO:
- placing cursor inside ()
  - only do it for url()
  - move that code to UrlCodeHints extension?
- handle @import
  - need to update CSSUtils
- handle quotes inside url()
- handle url without url() ?
  - both with and without quotes
- unit tests

*/


define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var AppInit             = brackets.getModule("utils/AppInit"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        HTMLUtils           = brackets.getModule("language/HTMLUtils"),
        NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        StringUtils         = brackets.getModule("utils/StringUtils"),

        CSSProperties       = require("text!CSSProperties.json"),
        HTMLAttributes      = require("text!HtmlAttributes.json"),

        htmlAttrs;
    
    /**
     * @constructor
     */
    function UrlCodeHints() {}

    /**
     * Helper function for search(). Create a list of urls to existing files based on the query.
     * @param {{queryStr: string}} query -- a query object, used to filter the code hints
     * @return {Array.<string>}
     */
    UrlCodeHints.prototype._getUrlList = function (query) {
        var doc,
            result = [];
        
        // site-root relative links are not yet supported, so filter them out
        if (query.queryStr.length > 0 && query.queryStr[0] === "/") {
            return result;
        }

        // get path to current document
        doc = DocumentManager.getCurrentDocument();
        if (!doc || !doc.file) {
            return result;
        }

        var docUrl = window.PathUtils.parseUrl(doc.file.fullPath);
        if (!docUrl) {
            return result;
        }

        var docDir = docUrl.domain + docUrl.directory;

        // get relative path from query string
        // TODO: handle site-root relative
        var queryDir = "";
        var queryUrl = window.PathUtils.parseUrl(query.queryStr);
        if (queryUrl) {
            queryDir = queryUrl.directory;
        }

        // build target folder path
        var targetDir = docDir + decodeURI(queryDir);

        // get list of files from target folder
        var unfiltered = [];

        // Getting the file/folder info is an asynch operation, so it works like this:
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
            var self = this,
                origEditor = EditorManager.getFocusedEditor();

            if (self.cachedHints && self.cachedHints.deferred) {
                self.cachedHints.deferred.reject();
            }
            // create empty object so we can detect "waiting" state
            self.cachedHints = {};
            self.cachedHints.deferred = $.Deferred();
            self.cachedHints.unfiltered = [];

            NativeFileSystem.requestNativeFileSystem(targetDir, function (fs) {
                fs.root.createReader().readEntries(function (entries) {

                    entries.forEach(function (entry) {
                        if (ProjectManager.shouldShow(entry)) {
                            // convert to doc relative path
                            var entryStr = entry.fullPath.replace(docDir, "");

                            // code hints show the same strings that are inserted into text,
                            // so strings in list will be encoded. wysiwyg, baby!
                            unfiltered.push(encodeURI(entryStr));
                        }
                    });

                    self.cachedHints.unfiltered = unfiltered;
                    self.cachedHints.query      = query;
                    self.cachedHints.queryDir   = queryDir;
                    self.cachedHints.docDir     = docDir;
                    
                    if (!self.cachedHints.deferred.isRejected()) {
                        var currentDeferred = self.cachedHints.deferred;
                        // Since we've cached the results, the next call to _getUrlList should be synchronous.
                        // If it isn't, we've got a problem and should reject both the current deferred
                        // and any new deferred that got created on the call.
                        var syncResults = self._getUrlList(query);
                        if (syncResults instanceof Array) {
                            currentDeferred.resolveWith(self, [syncResults]);
                        } else {
                            if (currentDeferred && !currentDeferred.isResolved() && !currentDeferred.isRejected()) {
                                currentDeferred.reject();
                            }
                            
                            if (self.cachedHints.deferred &&
                                    !self.cachedHints.deferred.isResolved() &&
                                    !self.cachedHints.deferred.isRejected()) {
                                self.cachedHints.deferred.reject();
                                self.cachedHints.deferred = null;
                            }
                        }
                    }
                });
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
     * Helper function that determins the possible value hints for a given html tag/attribute name pair
     * 
     * @param {{queryStr: string}} query
     * The current query
     *
     * @param {String} tagName 
     * HTML tag name
     *
     * @param {String} attrName 
     * HTML attribute name
     *
     * @return {Object<hints: (Array[String]|$.Deferred<Array[String]>), sortFunc: ?Function>} 
     * The (possibly deferred) hints and the sort function to use on thise hints.
     */
    UrlCodeHints.prototype._getUrlHints = function (query) {
        var hints = [],
            sortFunc = null;
        
        // Default behavior for url hints is do not close on select.
        this.closeOnSelect = false;
        hints = this._getUrlList(query);
        sortFunc = StringUtils.urlSort;
        
        return { hints: hints, sortFunc: sortFunc };
    };
    
    /**
     * Determines whether font hints are available in the current editor
     * context.
     *
     * @param {Editor} editor
     * A non-null editor object for the active window.
     *
     * @param {String} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {Boolean}
     * Determines whether the current provider is able to provide hints for
     * the given editor context and, in case implicitChar is non- null,
     * whether it is appropriate to do so.
     */
    UrlCodeHints.prototype.hasHints = function (editor, implicitChar) {
        var mode = editor.getModeForSelection();
        if (mode === "html") {
            return this.hasHtmlHints(editor, implicitChar);
        } else if (mode === "css") {
            return this.hasCssHints(editor, implicitChar);
        }

        return false;
    };

    UrlCodeHints.prototype.hasCssHints = function (editor, implicitChar) {
        this.editor = editor;
        var cursor = this.editor.getCursorPos();

        this.info = CSSUtils.getInfoAtPos(editor, cursor);

        // only handles "url()" (i.e. not new) value
        // TODO: handle "@import url();"
        if ((this.info.context !== CSSUtils.PROP_VALUE) || this.info.isNewItem) {
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
        if (val.match(/^url\(/i)) {
            return true;
        }

        return false;
    };

    UrlCodeHints.prototype.hasHtmlHints = function (editor, implicitChar) {
        var tagInfo,
            query,
            tokenType;

        this.editor = editor;
        if (implicitChar === null) {
            tagInfo = HTMLUtils.getTagInfo(editor, editor.getCursorPos());
            query = null;
            tokenType = tagInfo.position.tokenType;
             
            if (tokenType === HTMLUtils.ATTR_VALUE) {
                if (tagInfo.position.offset >= 0) {
                    query = tagInfo.attr.value.slice(0, tagInfo.position.offset);
                } else {
                    // We get negative offset for a quoted attribute value with some leading whitespaces 
                    // as in <a rel= "rtl" where the cursor is just to the right of the "=".
                    // So just set the queryStr to an empty string. 
                    query = "";
                }
                
                // If we're at an attribute value, check if it's an attribute name that has hintable values.
                if (htmlAttrs[tagInfo.attr.name]) {
                    var hintsAndSortFunc = this._getUrlHints({queryStr: query});
                    var hints = hintsAndSortFunc.hints;
                    if (hints instanceof Array) {
                        // If we got synchronous hints, check if we have something we'll actually use
                        var i, foundPrefix = false;
                        for (i = 0; i < hints.length; i++) {
                            if (hints[i].indexOf(query) === 0) {
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
        }
    };

    /**
     * Returns a list of availble font hints, if possible, for the current
     * editor context.
     *
     * @return {Object<hints: Array<jQuery.Object>, match: String,
     *      selectInitial: Boolean>}
     *
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides:
     * 1. a sorted array formatted hints;
     * 2. a null string match to indicate that the hints are already formatted;
     * 3. a boolean that indicates whether the first result, if one exists,
     *    should be selected by default in the hint list window.
     */
    UrlCodeHints.prototype.getHints = function (key) {
        var mode = this.editor.getModeForSelection(),
            cursor = this.editor.getCursorPos(),
            filter = "",
            unfiltered = [],
            hints = [],
            sortFunc = null,
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

        } else if (mode === "css") {
            this.info = CSSUtils.getInfoAtPos(this.editor, cursor);

            var context = this.info.context;
            if (context !== CSSUtils.PROP_VALUE) {
                return null;
            }

            // Cursor is in an existing property value or partially typed value
            if (!this.info.isNewItem && this.info.index !== -1) {
                query.queryStr = this.info.values[this.info.index].trim();
                query.queryStr = query.queryStr.substr(0, this.info.offset);

                // bit of a hack for now...
                if (query.queryStr === "(" && this.info.index === 1 &&
                        this.info.values[0].toLowerCase() === "url") {
                    query.queryStr = "";
                }
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

        if (hints instanceof Array && hints.length) {
            // Array was returned
            console.assert(!result.length);
            result = $.map(hints, function (item) {
                if (item.indexOf(filter) === 0) {
                    return item;
                }
            }).sort(sortFunc);

            return {
                hints: result,
                match: query.queryStr,
                selectInitial: true
            };

        } else if (hints instanceof Object && hints.hasOwnProperty("done")) {
            // Deferred hints were returned
            var deferred = $.Deferred();
            hints.done(function (asyncHints) {
                deferred.resolveWith(this, [{
                    hints : asyncHints,
                    match: query.queryStr,
                    selectInitial: true
                }]);
            });

            return deferred;
        }

        return null;
    };

    /**
     * Inserts a given font hint into the current editor context.
     *
     * @param {jQuery.Object} completion
     * The hint to be inserted into the editor context.
     *
     * @return {Boolean}
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    UrlCodeHints.prototype.insertHint = function (completion) {
        var mode = this.editor.getModeForSelection();
        if (mode === "html") {
            return this.insertHtmlHint(completion);
        } else if (mode === "css") {
            return this.insertCssHint(completion);
        }

        return false;
    };

    UrlCodeHints.prototype.insertCssHint = function (completion) {
        var cursor = this.editor.getCursorPos(),
            start = {line: -1, ch: -1},
            end = {line: -1, ch: -1};

        if (this.info.context !== CSSUtils.PROP_VALUE) {
            return false;
        }

        // Special handling for URL hinting -- if the completion is a file name
        // and not a folder, then close the code hint list.
        if (!this.closeOnSelect && completion.match(/\/$/) === null) {
            this.closeOnSelect = true;
        }

        start.line = end.line = cursor.line;
        end.ch = cursor.ch;

        if (this.info.index === 1 && this.info.values[0].toLowerCase() === "url(") {
            start.ch = cursor.ch - this.info.offset;
        } else {
            start.ch = cursor.ch;
        }

        var hasClosingParen = (this.info.values[this.info.index][this.info.offset] === ")");

        // HACK (tracking adobe/brackets#1688): We talk to the private CodeMirror instance
        // directly to replace the range instead of using the Document, as we should. The
        // reason is due to a flaw in our current document synchronization architecture when
        // inline editors are open.
        var insertText = completion;
        if (!hasClosingParen) {
            insertText += ")";
        }
        this.editor._codeMirror.replaceRange(insertText, start, end);

        if (this.closeOnSelect) {
            // If there is an existing closing paren, move the cursor to the right of it
            if (hasClosingParen) {
                this.editor.setCursorPos(start.line, start.ch + completion.length + 1);
            }
            return false;
        }

        return true;
    };

    UrlCodeHints.prototype.insertHtmlHint = function (completion) {
        var cursor = this.editor.getCursorPos(),
            start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            tagInfo = HTMLUtils.getTagInfo(this.editor, cursor),
            tokenType = tagInfo.position.tokenType,
            charCount = 0,
            replaceExistingOne = tagInfo.attr.valueAssigned,
            endQuote = "",
            shouldReplace = true;

        if (tokenType === HTMLUtils.ATTR_VALUE) {
            charCount = tagInfo.attr.value.length;
            
            // Special handling for URL hinting -- if the completion is a file name
            // and not a folder, then close the code hint list.
            if (!this.closeOnSelect && completion.match(/\/$/) === null) {
                this.closeOnSelect = true;
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
        }

        end.line = start.line = cursor.line;
        start.ch = cursor.ch - tagInfo.position.offset;
        end.ch = start.ch + charCount;

        if (shouldReplace) {
            if (start.ch !== end.ch) {
                this.editor.document.replaceRange(completion, start, end);
            } else {
                this.editor.document.replaceRange(completion, start);
            }
        }

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

    AppInit.appReady(function () {
        htmlAttrs       = JSON.parse(HTMLAttributes);

        var urlHints = new UrlCodeHints();
        CodeHintManager.registerHintProvider(urlHints, ["css", "html"], 5);

        // For unit testing
//        exports.urlCodeHintProvider = urlHints;
    });
});

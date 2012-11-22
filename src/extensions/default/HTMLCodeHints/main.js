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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        HTMLUtils           = brackets.getModule("language/HTMLUtils"),
        NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        StringUtils         = brackets.getModule("utils/StringUtils"),
        HTMLTags            = require("text!HtmlTags.json"),
        HTMLAttributes      = require("text!HtmlAttributes.json"),
        tags                = JSON.parse(HTMLTags),
        attributes          = JSON.parse(HTMLAttributes);

    /**
     * @constructor
     */
    function TagHints() {}

    /**
     * Filters the source list by query and returns the result
     * @param {Object.<queryStr: string, ...} query -- a query object with a required property queryStr 
     *     that will be used to filter out code hints
     * @return {Array.<string>}
     */
    TagHints.prototype.search = function (query) {
        var result = $.map(tags, function (value, key) {
            if (key.indexOf(query.queryStr) === 0) {
                return key;
            }
        }).sort();

        return result;
        // TODO: better sorting. Should rank tags based on portion of query that is present in tag
    };


    /**
     * Figures out the text to use for the hint list query based on the text
     * around the cursor
     * Query is the text from the start of a tag to the current cursor position
     * @param {Editor} editor
     * @param {Cursor} current cursor location
     * @return {Object.<queryStr: string, ...} search query results will be filtered by.
     *      Return empty queryStr string to indicate code hinting should not filter and show all results.
     *      Return null in queryStr to indicate NO hints can be provided.
     */
    TagHints.prototype.getQueryInfo = function (editor, cursor) {
        var tagInfo = HTMLUtils.getTagInfo(editor, cursor),
            query = {queryStr: null};

        if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
            if (tagInfo.position.offset >= 0) {
                query.queryStr = tagInfo.tagName.slice(0, tagInfo.position.offset);
            }

        }

        return query;
    };

    /**
     * Enters the code completion text into the editor
     * @param {string} completion - text to insert into current code editor
     * @param {Editor} editor
     * @param {Cursor} current cursor location
     * @return {boolean} true to close the hint list, false to keep the hint list open.
     */
    TagHints.prototype.handleSelect = function (completion, editor, cursor) {
        var start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            tagInfo = HTMLUtils.getTagInfo(editor, cursor),
            charCount = 0;

        if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
            charCount = tagInfo.tagName.length;
        }

        end.line = start.line = cursor.line;
        start.ch = cursor.ch - tagInfo.position.offset;
        end.ch = start.ch + charCount;

        if (completion !== tagInfo.tagName) {
            if (start.ch !== end.ch) {
                editor.document.replaceRange(completion, start, end);
            } else {
                editor.document.replaceRange(completion, start);
            }
        }
        
        return true;
    };

    /**
     * Check whether to show hints on a specific key.
     * @param {string} key -- the character for the key user just presses.
     * @return {boolean} return true/false to indicate whether hinting should be triggered by this key.
     */
    TagHints.prototype.shouldShowHintsOnKey = function (key) {
        return key === "<";
    };

    /**
     * @constructor
     */
    function AttrHints() {
        this.globalAttributes = this.readGlobalAttrHints();
        this.cachedHints = null;
        
        // Used in URL hinting to keep the popup list open
        // by setting this to false.
        this.closeOnSelect = true;
    }

    /**
     * @private
     * Parse the code hints from JSON data and extract all hints from property names.
     * @return {!Array.<string>} An array of code hints read from the JSON data source.
     */
    AttrHints.prototype.readGlobalAttrHints = function () {
        return $.map(attributes, function (value, key) {
            if (value.global === "true") {
                return key;
            }
        });
    };

    /**
     * Enters the code completion text into the editor
     * @param {string} completion - text to insert into current code editor
     * @param {Editor} editor
     * @param {Cursor} current cursor location
     * @return {boolean} true to close the hint list, false to keep the hint list open.
     */
    AttrHints.prototype.handleSelect = function (completion, editor, cursor) {
        var start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            tagInfo = HTMLUtils.getTagInfo(editor, cursor),
            tokenType = tagInfo.position.tokenType,
            charCount = 0,
            insertedName = false,
            replaceExistingOne = tagInfo.attr.valueAssigned,
            endQuote = "",
            shouldReplace = true;

        if (tokenType === HTMLUtils.ATTR_NAME) {
            charCount = tagInfo.attr.name.length;
            // Append an equal sign and two double quotes if the current attr is not an empty attr
            // and then adjust cursor location before the last quote that we just inserted.
            if (!replaceExistingOne && attributes && attributes[completion] &&
                    attributes[completion].type !== "flag") {
                completion += "=\"\"";
                insertedName = true;
            } else if (completion === tagInfo.attr.name) {
                shouldReplace = false;
            }
        } else if (tokenType === HTMLUtils.ATTR_VALUE) {
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
                editor.document.replaceRange(completion, start, end);
            } else {
                editor.document.replaceRange(completion, start);
            }
        }

        if (!this.closeOnSelect) {
            return false;
        }
        
        if (insertedName) {
            editor.setCursorPos(start.line, start.ch + completion.length - 1);

            // Since we're now inside the double-quotes we just inserted,
            // immediately pop up the attribute value hint.
            CodeHintManager.showHint(editor);
        } else if (tokenType === HTMLUtils.ATTR_VALUE && tagInfo.attr.hasEndQuote) {
            // Move the cursor to the right of the existing end quote after value insertion.
            editor.setCursorPos(start.line, start.ch + completion.length + 1);
        }
        
        return true;
    };

    /**
     * Figures out the text to use for the hint list query based on the text
     * around the cursor
     * Query is the text from the start of an attribute to the current cursor position
     * @param {Editor} editor
     * @param {Cursor} current cursor location
     * @return {Object.<queryStr: string, ...} search query results will be filtered by.
     *      Return empty queryStr string to indicate code hinting should not filter and show all results.
     *      Return null in queryStr to indicate NO hints can be provided.
     */
    AttrHints.prototype.getQueryInfo = function (editor, cursor) {
        var tagInfo = HTMLUtils.getTagInfo(editor, cursor),
            query = {queryStr: null},
            tokenType = tagInfo.position.tokenType;
 
        if (tokenType === HTMLUtils.ATTR_NAME || tokenType === HTMLUtils.ATTR_VALUE) {
            query.tag = tagInfo.tagName;
            
            if (tagInfo.position.offset >= 0) {
                if (tokenType === HTMLUtils.ATTR_NAME) {
                    query.queryStr = tagInfo.attr.name.slice(0, tagInfo.position.offset);
                } else {
                    query.queryStr = tagInfo.attr.value.slice(0, tagInfo.position.offset);
                    query.attrName = tagInfo.attr.name;
                }
            } else if (tokenType === HTMLUtils.ATTR_VALUE) {
                // We get negative offset for a quoted attribute value with some leading whitespaces 
                // as in <a rel= "rtl" where the cursor is just to the right of the "=".
                // So just set the queryStr to an empty string. 
                query.queryStr = "";
                query.attrName = tagInfo.attr.name;
            }

            // TODO: get existing attributes for the current tag and add them to query.usedAttr
        }

        return query;
    };

    /**
     * Helper function for search(). Create a list of urls to existing files based on the query.
     * @param {Object.<queryStr: string, ...} query -- a query object with a required property queryStr 
     *     that will be used to filter out code hints
     * @return {Array.<string>}
     */
    AttrHints.prototype._getUrlList = function (query) {
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

            // create empty object so we can detect "waiting" state
            self.cachedHints = {};
            self.cachedHints.unfiltered = [];

            NativeFileSystem.requestNativeFileSystem(targetDir, function (dirEntry) {
                dirEntry.createReader().readEntries(function (entries) {

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

                    // If the editor has not changed, then re-initiate code hints. Cached data
                    // is still valid for folder even if we're not going to show it now.
                    if (origEditor === EditorManager.getFocusedEditor()) {
                        CodeHintManager.showHint(origEditor);
                    }
                });
            });

            return result;
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
     * Create a complete list of attributes for the tag in the query. Then filter 
     * the list by attrName in the query and return the result.
     * @param {Object.<queryStr: string, ...} query -- a query object with a required property queryStr 
     *     that will be used to filter out code hints
     * @return {Array.<string>}
     */
    AttrHints.prototype.search = function (query) {
        var result = [];

        if (query.tag && query.queryStr !== null) {
            var tagName = query.tag,
                attrName = query.attrName,
                filter = query.queryStr,
                unfiltered = [],
                sortFunc = null;

            this.closeOnSelect = true;
            
            if (attrName) {
                // We look up attribute values with tagName plus a slash and attrName first.  
                // If the lookup fails, then we fall back to look up with attrName only. Most 
                // of the attributes in JSON are using attribute name only as their properties, 
                // but in some cases like "type" attribute, we have different properties like 
                // "script/type", "link/type" and "button/type".
                var tagPlusAttr = tagName + "/" + attrName,
                    attrInfo = attributes[tagPlusAttr] || attributes[attrName];
                
                if (attrInfo) {
                    if (attrInfo.type === "boolean") {
                        unfiltered = ["false", "true"];
                    } else if (attrInfo.type === "url") {
                        // Default behavior for url hints is do not close on select.
                        this.closeOnSelect = false;
                        unfiltered = this._getUrlList(query);
                        sortFunc = StringUtils.urlSort;
                    } else if (attrInfo.attribOption) {
                        unfiltered = attrInfo.attribOption;
                    }
                }
            } else if (tags && tags[tagName] && tags[tagName].attributes) {
                unfiltered = tags[tagName].attributes.concat(this.globalAttributes);

                // TODO: exclude existing attributes from unfiltered array
            }

            if (unfiltered.length) {
                console.assert(!result.length);
                result = $.map(unfiltered, function (item) {
                    if (item.indexOf(filter) === 0) {
                        return item;
                    }
                }).sort(sortFunc);
            }
        }

        return result;
    };

    /**
     * Check whether to show hints on a specific key.
     * @param {string} key -- the character for the key user just presses.
     * @return {boolean} return true/false to indicate whether hinting should be triggered by this key.
     */
    AttrHints.prototype.shouldShowHintsOnKey = function (key) {
        return (key === " " || key === "'" || key === "\"" || key === "=");
    };

    var tagHints = new TagHints();
    var attrHints = new AttrHints();
    CodeHintManager.registerHintProvider(tagHints);
    CodeHintManager.registerHintProvider(attrHints);
    
    // For unit testing
    exports.tagHintProvider = tagHints;
    exports.attrHintProvider = attrHints;
});
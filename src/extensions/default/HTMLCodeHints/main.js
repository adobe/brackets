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
    var AppInit             = brackets.getModule("utils/AppInit"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        HTMLUtils           = brackets.getModule("language/HTMLUtils"),
        NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        StringUtils         = brackets.getModule("utils/StringUtils"),
        HintsCollector      = brackets.getModule("codehint/HintsCollector"),
        tags,
        attributes;

    /**
     * @constructor
     */
    function TagHints() {}
    
    /**
     * Determines whether HTML tag hints are available in the current editor
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
    TagHints.prototype.hasHints = function (editor, implicitChar) {
        var tagInfo,
            query;
        
        this.editor = editor;
        if (implicitChar === null) {
            tagInfo = HTMLUtils.getTagInfo(this.editor, this.editor.getCursorPos());
            if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
                if (tagInfo.position.offset >= 0) {
                    return true;
                }
            }
            return false;
        } else {
            return implicitChar === "<";
        }
    };
       
    /**
     * Returns a list of availble HTML tag hints if possible for the current
     * editor context. 
     *
     * @return {Object<hints: Array<(String + jQuery.Obj)>, match: String, 
     *      selectInitial: Boolean>}
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides 1. a sorted array hints that consists 
     * of strings; 2. a string match that is used by the manager to emphasize
     * matching substrings when rendering the hint list; and 3. a boolean that
     * indicates whether the first result, if one exists, should be selected
     * by default in the hint list window.
     */
    TagHints.prototype.getHints = function (implicitChar) {
        var tagInfo = HTMLUtils.getTagInfo(this.editor, this.editor.getCursorPos()),
            query,
            result;

        if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
            if (tagInfo.position.offset >= 0) {
                query = tagInfo.tagName.slice(0, tagInfo.position.offset);
                result = $.map(tags, function (value, key) {
                    if (key.indexOf(query) === 0) {
                        return key;
                    }
                }).sort();
                
                return {
                    hints: result,
                    match: query,
                    selectInitial: true
                };
            }
        }
        
        return null;
    };
    
    /**
     * Inserts a given HTML tag hint into the current editor context. 
     * 
     * @param {String} hint 
     * The hint to be inserted into the editor context.
     * 
     * @return {Boolean} 
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    TagHints.prototype.insertHint = function (completion) {
        var start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            cursor = this.editor.getCursorPos(),
            tagInfo = HTMLUtils.getTagInfo(this.editor, cursor),
            charCount = 0;

        if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
            charCount = tagInfo.tagName.length;
        }

        end.line = start.line = cursor.line;
        start.ch = cursor.ch - tagInfo.position.offset;
        end.ch = start.ch + charCount;

        if (completion !== tagInfo.tagName) {
            if (start.ch !== end.ch) {
                this.editor.document.replaceRange(completion, start, end);
            } else {
                this.editor.document.replaceRange(completion, start);
            }
        }
        
        return false;
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
     * Helper function for search(). Create a list of urls to existing files based on the query.
     * @param {{queryStr: string}} query -- a query object, used to filter the code hints
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
    AttrHints.prototype._getValueHintsForAttr = function (query, tagName, attrName) {
        // We look up attribute values with tagName plus a slash and attrName first.  
        // If the lookup fails, then we fall back to look up with attrName only. Most 
        // of the attributes in JSON are using attribute name only as their properties, 
        // but in some cases like "type" attribute, we have different properties like 
        // "script/type", "link/type" and "button/type".
        var hints = [],
            sortFunc = null;
        
        var tagPlusAttr = tagName + "/" + attrName,
            attrInfo = attributes[tagPlusAttr] || attributes[attrName];
        
        if (attrInfo) {
            if (attrInfo.type === "boolean") {
                hints = ["false", "true"];
            } else if (attrInfo.type === "url") {
                // Default behavior for url hints is do not close on select.
                this.closeOnSelect = false;
                hints = this._getUrlList(query);
                sortFunc = StringUtils.urlSort;
            } else if (attrInfo.attribOption) {
                hints = attrInfo.attribOption;
            }
        }
        
        return { hints: hints, sortFunc: sortFunc };
    };
    
    /**
     * Determines whether HTML attribute hints are available in the current 
     * editor context.
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
     * the given editor context and, in case implicitChar is non-null,
     * whether it is appropriate to do so.
     */
    AttrHints.prototype.hasHints = function (editor, implicitChar) {
        var tagInfo,
            query,
            tokenType;
        
        this.editor = editor;
        if (implicitChar === null) {
            tagInfo = HTMLUtils.getTagInfo(editor, editor.getCursorPos());
            query = null;
            tokenType = tagInfo.position.tokenType;
             
            if (tokenType === HTMLUtils.ATTR_NAME) {
                if (tagInfo.position.offset >= 0) {
                    query = tagInfo.attr.name.slice(0, tagInfo.position.offset);
                }
            } else if (tokenType === HTMLUtils.ATTR_VALUE) {
                if (tagInfo.position.offset >= 0) {
                    query = tagInfo.attr.value.slice(0, tagInfo.position.offset);
                } else {
                    // We get negative offset for a quoted attribute value with some leading whitespaces 
                    // as in <a rel= "rtl" where the cursor is just to the right of the "=".
                    // So just set the queryStr to an empty string. 
                    query = "";
                }
                
                // If we're at an attribute value, check if it's an attribute name that has hintable values.
                if (tagInfo.attr.name) {
                    var hintsAndSortFunc = this._getValueHintsForAttr({queryStr: query}, tagInfo.tagName, tagInfo.attr.name);
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

            return query !== null;
        } else {
            return (implicitChar === " " || implicitChar === "'" ||
                implicitChar === "\"" || implicitChar === "=");
        }
    };
    
    /**
     * Returns a list of availble HTML attribute hints if possible for the 
     * current editor context. 
     *
     * @return {Object<hints: Array<(String + jQuery.Obj)>, match: String, 
     *      selectInitial: Boolean>}
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides 1. a sorted array hints that consists 
     * of strings; 2. a string match that is used by the manager to emphasize
     * matching substrings when rendering the hint list; and 3. a boolean that
     * indicates whether the first result, if one exists, should be selected
     * by default in the hint list window.
     */
    AttrHints.prototype.getHints = function (implicitChar) {
        var cursor = this.editor.getCursorPos(),
            tagInfo = HTMLUtils.getTagInfo(this.editor, cursor),
            query = {queryStr: null},
            tokenType = tagInfo.position.tokenType,
            result = [];
 
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

            query.usedAttr = HTMLUtils.getTagAttributes(this.editor, cursor);
        }

        if (query.tag && query.queryStr !== null) {
            var tagName = query.tag,
                attrName = query.attrName,
                filter = query.queryStr,
                unfiltered = [],
                hints = [],
                sortFunc = null;

            this.closeOnSelect = true;
            
            if (attrName) {
                var hintsAndSortFunc = this._getValueHintsForAttr(query, tagName, attrName);
                hints = hintsAndSortFunc.hints;
                sortFunc = hintsAndSortFunc.sortFunc;
                
            } else if (tags && tags[tagName] && tags[tagName].attributes) {
                unfiltered = tags[tagName].attributes.concat(this.globalAttributes);
                hints = $.grep(unfiltered, function (attr, i) {
                    return $.inArray(attr, query.usedAttr) < 0;
                });
            }
            
            if (hints instanceof Array && hints.length) {
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
            } else if (hints instanceof Object && hints.hasOwnProperty("done")) { // Deferred hints
                var deferred = $.Deferred();
                hints.done(function (asyncHints) {
                    deferred.resolveWith(this, [{ hints : asyncHints, match: query.queryStr, selectInitial: true }]);
                });
                return deferred;
            } else {
                return null;
            }
        }

        
    };
    
    /**
     * Inserts a given HTML attribute hint into the current editor context.
     * 
     * @param {String} hint 
     * The hint to be inserted into the editor context.
     * 
     * @return {Boolean} 
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    AttrHints.prototype.insertHint = function (completion) {
        var cursor = this.editor.getCursorPos(),
            start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            tagInfo = HTMLUtils.getTagInfo(this.editor, cursor),
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
        
        if (insertedName) {
            this.editor.setCursorPos(start.line, start.ch + completion.length - 1);

            // Since we're now inside the double-quotes we just inserted,
            // immediately pop up the attribute value hint.
            return true;
        } else if (tokenType === HTMLUtils.ATTR_VALUE && tagInfo.attr.hasEndQuote) {
            // Move the cursor to the right of the existing end quote after value insertion.
            this.editor.setCursorPos(start.line, start.ch + completion.length + 1);
        }
        
        return false;
    };

    AppInit.appReady(function () {
        tags = HintsCollector.getCodeHints(HintsCollector.HTML_TAG);
        attributes = HintsCollector.getCodeHints(HintsCollector.HTML_ATTRIBUTE);
        
        // Register code hint providers
        var tagHints = new TagHints();
        var attrHints = new AttrHints();
        CodeHintManager.registerHintProvider(tagHints, ["html"], 0);
        CodeHintManager.registerHintProvider(attrHints, ["html"], 0);
    
        // For unit testing
        exports.tagHintProvider = tagHints;
        exports.attrHintProvider = attrHints;
    });
});
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
/*global define, $, CodeMirror */
/*unittests: HTML Instrumentation*/

/**
 * HTMLInstrumentation
 *
 * This module contains functions for "instrumenting" html code. Instrumented code
 * adds a "data-brackets-id" attribute to every tag in the code. The value of this
 * tag is guaranteed to be unique.
 *
 * The primary function is generateInstrumentedHTML(). This does just what it says -
 * it will read the HTML content in the doc and generate instrumented code by injecting
 * "data-brackets-id" attributes.
 *
 * There are also helper functions for returning the tagID associated with a specified
 * position in the document.
 */
define(function (require, exports, module) {
    "use strict";

    var DocumentManager = require("document/DocumentManager"),
        HTMLSimpleDOM   = require("./HTMLSimpleDOM"),
        HTMLDOMDiff     = require("./HTMLDOMDiff"),
        PerfUtils       = require("utils/PerfUtils");
    
    var allowIncremental = true;
    
    // Hash of scanned documents. Key is the full path of the doc. Value is an object
    // with two properties: timestamp and dom. Timestamp is the document timestamp,
    // dom is the root node of a simple DOM tree.
    var _cachedValues = {};

    /** 
     * Remove a document from the cache
     */
    function _removeDocFromCache(evt, document) {
        if (_cachedValues.hasOwnProperty(document.file.fullPath)) {
            delete _cachedValues[document.file.fullPath];
            $(document).off(".htmlInstrumentation");
        }
    }
    
    function _getMarkerAtDocumentPos(editor, pos, preferParent, markCache) {
        var i,
            cm = editor._codeMirror,
            marks = cm.findMarksAt(pos),
            match,
            range;
        
        function posEq(pos1, pos2) {
            return pos1.line === pos2.line && pos1.ch === pos2.ch;
        }
        
        if (!marks.length) {
            return null;
        }
        
        markCache = markCache || {};
        marks = marks.filter(function (mark) {
            return !!mark.tagID;
        }).map(function (mark) {
            // All marks should exist since we just got them from CodeMirror.
            if (!markCache[mark.tagID]) {
                markCache[mark.tagID] = {mark: mark, range: mark.find()};
            }
            return markCache[mark.tagID];
        });
        marks.sort(function (mark1, mark2) {
            return (mark1.range.from.line === mark2.range.from.line ? mark1.range.from.ch - mark2.range.from.ch : mark1.range.from.line - mark2.range.from.line);
        });
        
        // The mark with the latest start is the innermost one.
        match = marks[marks.length - 1];
        if (preferParent) {
            // If the match is exactly at the edge of the range and preferParent is set,
            // we want to pop upwards.
            if (posEq(match.range.from, pos) || posEq(match.range.to, pos)) {
                if (marks.length > 1) {
                    match = marks[marks.length - 2];
                } else {
                    // We must be outside the root, so there's no containing tag.
                    match = null;
                }
            }
        }
        
        return match.mark;
    }
    
    /**
     * Get the instrumented tagID at the specified position. Returns -1 if
     * there are no instrumented tags at the location.
     * The _markText() function must be called before calling this function.
     *
     * NOTE: This function is "private" for now (has a leading underscore), since
     * the API is likely to change in the future.
     *
     * @param {Editor} editor The editor to scan. 
     * @return {number} tagID at the specified position, or -1 if there is no tag
     */
    function _getTagIDAtDocumentPos(editor, pos, markCache) {
        var match = _getMarkerAtDocumentPos(editor, pos, false, markCache);

        return (match) ? match.tagID : -1;
    }
    
    /**
     * Recursively walks the SimpleDOM starting at node and marking
     * all tags in the CodeMirror instance. The more useful interface
     * is the _markTextFromDOM function which clears existing marks
     * before calling this function to create new ones.
     *
     * @param {CodeMirror} cm CodeMirror instance in which to mark tags
     * @param {Object} node SimpleDOM node to use as the root for marking
     */
    function _markTags(cm, node) {
        node.children.forEach(function (childNode) {
            if (childNode.children) {
                _markTags(cm, childNode);
            }
        });
        var mark = cm.markText(node.startPos, node.endPos);
        mark.tagID = node.tagID;
    }
    
    /**
     * Clears the marks from the document and creates new ones.
     *
     * @param {Editor} editor Editor object holding this document
     * @param {Object} dom SimpleDOM root object that contains the parsed structure
     */
    function _markTextFromDOM(editor, dom) {
        var cm = editor._codeMirror;
        
        // Remove existing marks
        var marks = cm.getAllMarks();
        cm.operation(function () {
            marks.forEach(function (mark) {
                if (mark.hasOwnProperty("tagID")) {
                    mark.clear();
                }
            });
        });
                
        // Mark
        _markTags(cm, dom);
    }
    
    function DOMUpdater(previousDOM, editor, changeList) {
        var text, startOffset = 0, startOffsetPos;

        this.isIncremental = false;
        
        function isDangerousEdit(text) {
            // We don't consider & dangerous since entities only affect text content, not
            // overall DOM structure.
            return (/[<>\/=\"\']/).test(text);
        }
        
        // If there's more than one change, be conservative and assume we have to do a full reparse.
        if (changeList && !changeList.next) {
            // If the inserted or removed text doesn't have any characters that could change the
            // structure of the DOM (e.g. by adding or removing a tag boundary), then we can do
            // an incremental reparse of just the parent tag containing the edit. This should just
            // be the marked range that contains the beginning of the edit range, since that position
            // isn't changed by the edit.
            if (!isDangerousEdit(changeList.text) && !isDangerousEdit(changeList.removed)) {
                // If the edit is right at the beginning or end of a tag, we want to be conservative
                // and use the parent as the edit range.
                var startMark = _getMarkerAtDocumentPos(editor, changeList.from, true);
                if (startMark) {
                    var range = startMark.find();
                    if (range) {
                        text = editor._codeMirror.getRange(range.from, range.to);
                        this.changedTagID = startMark.tagID;
                        startOffsetPos = range.from;
                        startOffset = editor._codeMirror.indexFromPos(startOffsetPos);
                        this.isIncremental = true;
                    }
                }
            }
        }
        
        if (!this.changedTagID) {
            // We weren't able to incrementally update, so just rebuild and diff everything.
            text = editor.document.getText();
        }
        
        HTMLSimpleDOM.Builder.call(this, text, startOffset, startOffsetPos);
        this.editor = editor;
        this.cm = editor._codeMirror;
        this.previousDOM = previousDOM;
    }
    
    DOMUpdater.prototype = Object.create(HTMLSimpleDOM.Builder.prototype);
    
    function hasAncestorWithID(tag, id) {
        var ancestor = tag.parent;
        while (ancestor && ancestor.tagID !== id) {
            ancestor = ancestor.parent;
        }
        return !!ancestor;
    }
    
    /**
     * Overrides the `getID` method to return the tag ID from the document. If a viable tag
     * ID cannot be found in the document marks, then a new ID is returned. This will also
     * assign a new ID if the tag changed between the previous and current versions of this
     * node.
     *
     * @param {Object} newTag tag object for the current element
     * @return {int} best ID
     */
    DOMUpdater.prototype.getID = function (newTag, markCache) {
        // TODO: _getTagIDAtDocumentPos is likely a performance bottleneck
        // Get the mark at the start of the tagname (not before the beginning of the tag, because that's
        // actually inside the parent).
        var currentTagID = _getTagIDAtDocumentPos(this.editor, HTMLSimpleDOM._offsetPos(newTag.startPos, 1), markCache);
        
        // If the new tag is in an unmarked range, or the marked range actually corresponds to an
        // ancestor tag, then this must be a newly inserted tag, so give it a new tag ID.
        if (currentTagID === -1 || hasAncestorWithID(newTag, currentTagID)) {
            currentTagID = this.getNewID();
        } else {
            // If the tag has changed between the previous DOM and the new one, we assign a new ID
            // so that the old tag will be deleted and the new one inserted.
            var oldNode = this.previousDOM.nodeMap[currentTagID];
            if (!oldNode || oldNode.tag !== newTag.tag) {
                currentTagID = this.getNewID();
            }
        }
        return currentTagID;
    };
    
    DOMUpdater.prototype._updateMarkedRanges = function (nodeMap, markCache) {
        // TODO: this is really inefficient - should we cache the mark for each node?
        var updateIDs = Object.keys(nodeMap),
            cm = this.cm,
            marks = cm.getAllMarks();
        
        function posEq(pos1, pos2) {
            return pos1 && pos2 && pos1.line === pos2.line && pos1.ch === pos2.ch;
        }
        
        cm.operation(function () {
            marks.forEach(function (mark) {
                if (mark.hasOwnProperty("tagID") && nodeMap[mark.tagID]) {
                    var node = nodeMap[mark.tagID],
                        markInfo = markCache[mark.tagID];
                    // If the mark's bounds already match, avoid destroying and recreating the mark,
                    // since that incurs some overhead.
                    if (!(markInfo && posEq(markInfo.range.from, node.startPos) && posEq(markInfo.range.to, node.endPos))) {
                        mark.clear();
                        mark = cm.markText(node.startPos, node.endPos);
                        mark.tagID = node.tagID;
                    }
                    updateIDs.splice(updateIDs.indexOf(node.tagID), 1);
                }
            });
            
            // Any remaining updateIDs are new.
            updateIDs.forEach(function (id) {
                var node = nodeMap[id], mark;
                if (node.children) {
                    mark = cm.markText(node.startPos, node.endPos);
                    mark.tagID = Number(id);
                }
            });
        });
    };
    
    DOMUpdater.prototype._buildNodeMap = function (root) {
        var nodeMap = {};
        
        function walk(node) {
            if (node.tagID) {
                nodeMap[node.tagID] = node;
            }
            if (node.children) {
                node.children.forEach(walk);
            }
        }
        
        walk(root);
        root.nodeMap = nodeMap;
    };
    
    DOMUpdater.prototype._handleDeletions = function (nodeMap, oldSubtreeMap, newSubtreeMap) {
        var deletedIDs = [];
        Object.keys(oldSubtreeMap).forEach(function (key) {
            if (!newSubtreeMap.hasOwnProperty(key)) {
                deletedIDs.push(key);
                delete nodeMap[key];
            }
        });
        
        // TODO: again, really inefficient - should we cache the mark for each node?
        var marks = this.cm.getAllMarks();
        marks.forEach(function (mark) {
            if (mark.hasOwnProperty("tagID") && deletedIDs.indexOf(mark.tagID) !== -1) {
                mark.clear();
            }
        });
    };
    
    DOMUpdater.prototype.update = function () {
        var markCache = {},
            newSubtree = this.build(true, markCache),
            result = {
                // default result if we didn't identify a changed portion
                newDOM: newSubtree,
                oldSubtree: this.previousDOM,
                newSubtree: newSubtree
            };
        
        if (!newSubtree) {
            return null;
        }

        if (this.changedTagID) {
            // Find the old subtree that's going to get swapped out.
            var oldSubtree = this.previousDOM.nodeMap[this.changedTagID],
                parent = oldSubtree.parent;
            
            // If we didn't have a parent, then the whole tree changed anyway, so
            // we'll just return the default result.
            if (parent) {
                var childIndex = parent.children.indexOf(oldSubtree);
                if (childIndex === -1) {
                    // This should never happen...
                    console.error("DOMUpdater.update(): couldn't locate old subtree in tree");
                } else {
                    // Swap the new subtree in place of the old subtree.
                    oldSubtree.parent = null;
                    newSubtree.parent = parent;
                    parent.children[childIndex] = newSubtree;
                    
                    // Overwrite any node mappings in the parent DOM with the
                    // mappings for the new subtree. We keep the nodeMap around
                    // on the new subtree so that the differ can use it later.
                    $.extend(this.previousDOM.nodeMap, newSubtree.nodeMap);
                    
                    // Update marked ranges for all items in the new subtree.
                    this._updateMarkedRanges(newSubtree.nodeMap, markCache);
                    
                    // Build a local nodeMap for the old subtree so the differ can
                    // use it.
                    this._buildNodeMap(oldSubtree);
                    
                    // Clean up the info for any deleted nodes that are no longer in
                    // the new tree.
                    this._handleDeletions(this.previousDOM.nodeMap, oldSubtree.nodeMap, newSubtree.nodeMap);
                    
                    // Update the signatures for all parents of the new subtree.
                    var curParent = parent;
                    while (curParent) {
                        HTMLSimpleDOM._updateHash(curParent);
                        curParent = curParent.parent;
                    }
                    
                    // TODO: add/update marked ranges for any nodes inside subtree
                    // (will need to offset the start/end of each node by the offset
                    // of the beginning of the changed range)
                    
                    result.newDOM = this.previousDOM;
                    result.oldSubtree = oldSubtree;
                }
            }
        } else {
            _markTextFromDOM(this.editor, result.newDOM);
        }
        
        return result;
    };
    
    
    function _updateDOM(previousDOM, editor, changeList) {
        if (!allowIncremental) {
            changeList = undefined;
        }
        var updater = new DOMUpdater(previousDOM, editor, changeList);
        var result = updater.update();
        if (!result) {
            return null;
        }
        
        var edits = HTMLDOMDiff.domdiff(result.oldSubtree, result.newSubtree);
        
        // We're done with the nodeMap that was added to the subtree by the updater.
        if (result.newSubtree !== result.newDOM) {
            delete result.newSubtree.nodeMap;
        }
        
        return {
            dom: result.newDOM,
            edits: edits,
            _wasIncremental: updater.isIncremental // for unit tests only
        };
    }
    
    function getUnappliedEditList(editor, changeList) {
        var cachedValue = _cachedValues[editor.document.file.fullPath];
        // We might not have a previous DOM if the document was empty before this edit.
        if (!cachedValue || !cachedValue.dom || _cachedValues[editor.document.file.fullPath].invalid) {
            // We were in an invalid state, so do a full rebuild.
            changeList = null;
        }
        var result = _updateDOM(cachedValue && cachedValue.dom, editor, changeList);
        if (result) {
            _cachedValues[editor.document.file.fullPath] = {
                timestamp: editor.document.diskTimestamp,
                dom: result.dom,
                dirty: false
            };
            return result.edits;
        } else {
            if (cachedValue) {
                cachedValue.invalid = true;
            }
            return [];
        }
    }
    
    /**
     * @private
     * Add SimpleDOMBuilder metadata to browser DOM tree JSON representation
     * @param {Object} root
     */
    function _processBrowserSimpleDOM(browserRoot, editorRootTagID) {
        var nodeMap         = {},
            root;
        
        function _processElement(elem) {
            elem.tagID = elem.attributes["data-brackets-id"];
            
            // remove data-brackets-id attribute for diff
            delete elem.attributes["data-brackets-id"];
            
            elem.children.forEach(function (child) {
                // set parent
                child.parent = elem;
                
                if (child.children) {
                    _processElement(child);
                } else if (child.content) {
                    HTMLSimpleDOM._updateHash(child);
                    child.tagID = HTMLSimpleDOM.getTextNodeID(child);
                    
                    nodeMap[child.tagID] = child;
                }
            });
            
            HTMLSimpleDOM._updateHash(elem);
            
            nodeMap[elem.tagID] = elem;

            // Choose the root element based on the root tag in the editor.
            // The browser may insert html, head and body elements if missing.
            if (elem.tagID === editorRootTagID) {
                root = elem;
            }
        }
        
        _processElement(browserRoot);

        root = root || browserRoot;
        root.nodeMap = nodeMap;

        return root;
    }
    
    /**
     * @private
     * Diff the browser DOM with the in-editor DOM
     * @param {Editor} editor
     * @param {Object} browserSimpleDOM
     */
    function _getBrowserDiff(editor, browserSimpleDOM) {
        var cachedValue = _cachedValues[editor.document.file.fullPath],
            editorRoot  = cachedValue.dom,
            browserRoot;
        
        browserRoot = _processBrowserSimpleDOM(browserSimpleDOM, editorRoot.tagID);
        
        return {
            diff    : HTMLDOMDiff.domdiff(editorRoot, browserRoot),
            browser : browserRoot,
            editor  : editorRoot
        };
    }
    
    $(DocumentManager).on("beforeDocumentDelete", _removeDocFromCache);
    
    /**
     * Scan a document to prepare for HTMLInstrumentation
     * @param {Document} doc The doc to scan. 
     * @return {Object} Root DOM node of the scanned document.
     */
    function scanDocument(doc) {
        if (!_cachedValues.hasOwnProperty(doc.file.fullPath)) {
            $(doc).on("change.htmlInstrumentation", function () {
                if (_cachedValues[doc.file.fullPath]) {
                    _cachedValues[doc.file.fullPath].dirty = true;
                }
            });
            
            // Assign to cache, but don't set a value yet
            _cachedValues[doc.file.fullPath] = null;
        }
        
        var cachedValue = _cachedValues[doc.file.fullPath];
        if (!doc.isDirty && cachedValue && !cachedValue.dirty && cachedValue.timestamp === doc.diskTimestamp) {
            return cachedValue.dom;
        }
        
        var text = doc.getText(),
            dom = HTMLSimpleDOM.build(text);
        
        if (dom) {
            // Cache results
            _cachedValues[doc.file.fullPath] = {
                timestamp: doc.diskTimestamp,
                dom: dom,
                dirty: false
            };
        }
        
        return dom;
    }
    
    /**
     * Generate instrumented HTML for the specified editor's document, and mark the associated tag 
     * ranges in the editor. Each tag has a "data-brackets-id" attribute with a unique ID for its 
     * value. For example, "<div>" becomes something like "<div data-brackets-id='45'>". The attribute 
     * value is just a number that is guaranteed to be unique. 
     * @param {Editor} editor The editor whose document we're instrumenting, and which we should
     *     mark ranges in.
     * @return {string} instrumented html content
     */
    function generateInstrumentedHTML(editor) {
        var doc = editor.document,
            dom = scanDocument(doc),
            orig = doc.getText(),
            gen = "",
            lastIndex = 0;
        
        if (!dom) {
            return null;
        }
        
        // Ensure that the marks in the editor are up to date with respect to the given DOM.
        _markTextFromDOM(editor, dom);
        
        // Walk through the dom nodes and insert the 'data-brackets-id' attribute at the
        // end of the open tag        
        function walk(node) {
            if (node.tag) {
                var attrText = " data-brackets-id='" + node.tagID + "'";
                
                // Insert the attribute as the first attribute in the tag.
                var insertIndex = node.start + node.tag.length + 1;
                gen += orig.substr(lastIndex, insertIndex - lastIndex) + attrText;
                lastIndex = insertIndex;
            }
            
            if (node.children) {
                node.children.forEach(walk);
            }
        }
        
        walk(dom);
        gen += orig.substr(lastIndex);
        
        return gen;
    }
    
    /**
     * Mark the text for the specified editor. Either the scanDocument() or 
     * the generateInstrumentedHTML() function must be called before this function
     * is called.
     *
     * NOTE: This function is "private" for now (has a leading underscore), since
     * the API is likely to change in the future.
     *
     * @param {Editor} editor The editor whose text should be marked.
     * @return none
     */
    function _markText(editor) {
        var cache = _cachedValues[editor.document.file.fullPath],
            dom = cache && cache.dom;
        
        if (!dom) {
            console.error("Couldn't find the dom for " + editor.document.file.fullPath);
            return;
        }
        
        _markTextFromDOM(editor, dom);
    }
    
    /**
     * @private
     * Clear the DOM cache. For unit testing only.
     */
    function _resetCache() {
        _cachedValues = {};
    }

    // private methods
    exports._markText                   = _markText;
    exports._getMarkerAtDocumentPos     = _getMarkerAtDocumentPos;
    exports._getTagIDAtDocumentPos      = _getTagIDAtDocumentPos;
    exports._markTextFromDOM            = _markTextFromDOM;
    exports._updateDOM                  = _updateDOM;
    exports._allowIncremental           = allowIncremental;
    exports._getBrowserDiff             = _getBrowserDiff;
    exports._resetCache                 = _resetCache;
    
    // public API
    exports.scanDocument                = scanDocument;
    exports.generateInstrumentedHTML    = generateInstrumentedHTML;
    exports.getUnappliedEditList        = getUnappliedEditList;
});

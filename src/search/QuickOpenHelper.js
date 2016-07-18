/*
 * Copyright (c) 2016 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $ */



define(function (require, exports, module) {
    "use strict";
    
    var EditorManager       = require("editor/EditorManager"),
        QuickOpen           = require("search/QuickOpen"),
        DocumentManager     = require("document/DocumentManager"),
        StringMatch         = require("utils/StringMatch");
    
    /**
     * @param {string} query what the user is searching for
     * @param {boolean} returns true if this plug-in wants to provide results for this query
     */
    function match(query) {
        return (query[0] === "@");
    }

    /**
     * Scroll to the selected item in the current document (unless no query string entered yet,
     * in which case the topmost list item is irrelevant)
     * @param {?SearchResult} selectedItem
     * @param {string} query
     * @param {boolean} explicit False if this is only highlighted due to being at top of list after search()
     */
    function itemFocus(selectedItem, query, explicit) {
        if (!selectedItem || (query.length < 2 && !explicit)) {
            return;
        }
        var fileLocation = selectedItem.fileLocation;

        var from = {line: fileLocation.line, ch: fileLocation.chFrom};
        var to = {line: fileLocation.line, ch: fileLocation.chTo};
        EditorManager.getCurrentFullEditor().setSelection(from, to, true);
    }

    /**
     * Scroll to the selected item in the current document (unless no query string entered yet,
     * in which case the topmost list item is irrelevant)
     * @param {?SearchResult} selectedItem
     * @param {string} query
     */
    function itemSelect(selectedItem, query) {
        itemFocus(selectedItem, query, true);
    }
    
    exports.match      = match;
    exports.itemFocus  = itemFocus;
    exports.itemSelect = itemSelect;
});

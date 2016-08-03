/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, regexp: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */



define(function (require, exports, module) {
    "use strict";

    var EditorManager       = brackets.getModule("editor/EditorManager"),
        QuickOpen           = brackets.getModule("search/QuickOpen"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        StringMatch         = brackets.getModule("utils/StringMatch");


   /**
    * FileLocation class
    * @constructor
    * @param {string} fullPath
    * @param {number} line
    * @param {number} chFrom column start position
    * @param {number} chTo column end position
    * @param {string} id
    */
    function FileLocation(fullPath, line, chFrom, chTo, id) {
        this.fullPath = fullPath;
        this.line = line;
        this.chFrom = chFrom;
        this.chTo = chTo;
        this.id = id;
    }

    /**
     * Returns a list of information about ID's for a single document. This array is populated
     * by createIDList()
     * @type {?Array.<FileLocation>}
     */
    function createIDList() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        var idList = [];
        var docText = doc.getText();
        var lines = docText.split("\n");

        var regex = new RegExp(/\s+id\s*?=\s*?["'](.*?)["']/gi);
        var id, chFrom, chTo, i, line;
        for (i = 0; i < lines.length; i++) {
            line = lines[i];
            var info;
            while ((info = regex.exec(line)) !== null) {
                id = info[1];
                // TODO: this doesn't handle id's that share the
                // same portion of a name on the same line or when
                // the id and value are on different lines
                chFrom = line.indexOf(id);
                chTo = chFrom + id.length;
                idList.push(new FileLocation(null, i, chFrom, chTo, id));
            }
        }
        return idList;
    }


    /**
     * @param {string} query what the user is searching for
     * @return {Array.<SearchResult>} sorted and filtered results that match the query
     */
    function search(query, matcher) {
        var idList = matcher.idList;
        if (!idList) {
            idList = createIDList();
            matcher.idList = idList;
        }
        query = query.slice(query.indexOf("@") + 1, query.length);

        // Filter and rank how good each match is
        var filteredList = $.map(idList, function (fileLocation) {
            var searchResult = matcher.match(fileLocation.id, query);
            if (searchResult) {
                searchResult.fileLocation = fileLocation;
            }
            return searchResult;
        });

        // Sort based on ranking & basic alphabetical order
        StringMatch.basicMatchSort(filteredList);

        return filteredList;
    }

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

    function itemSelect(selectedItem, query) {
        itemFocus(selectedItem, query, true);
    }


    QuickOpen.addQuickOpenPlugin(
        {
            name: "html ids",
            languageIds: ["html"],
            search: search,
            match: match,
            itemFocus: itemFocus,
            itemSelect: itemSelect
        }
    );

});

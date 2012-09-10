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

/*jslint vars: true, plusplus: true, devel: true, regexp: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */



define(function (require, exports, module) {
    "use strict";

    var EditorManager       = brackets.getModule("editor/EditorManager"),
        QuickOpen           = brackets.getModule("search/QuickOpen"),
        DocumentManager     = brackets.getModule("document/DocumentManager");


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
     * Contains a list of information about ID's for a single document. This array is populated
     * by createIDList()
     * @type {?Array.<FileLocation>}
     */
    var idList = null;

    /** clears idList */
    function done() {
        idList = null;
    }

    // create list of ids found in html file
    function createIDList() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        if (!idList) {
            idList = [];
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
        }
    }

    function getLocationFromID(id) {
        if (!idList) {
            return null;
        }

        var i, result;
        for (i = 0; i < idList.length; i++) {
            var fileLocation = idList[i];
            if (fileLocation.id === id) {
                result = fileLocation;
                break;
            }
        }

        return result;
    }

    /**
     * @param {string} query what the user is searching for
     * @returns {Array.<SearchResult>} sorted and filtered results that match the query
     */
    function search(query) {
        createIDList();
        query = query.slice(query.indexOf("@") + 1, query.length);
        
        // Filter and rank how good each match is
        var filteredList = $.map(idList, function (itemInfo) {
            return QuickOpen.stringMatch(itemInfo.id, query);
        });
        
        // Sort based on ranking & basic alphabetical order
        QuickOpen.basicMatchSort(filteredList);

        return filteredList;
    }

    /**
     * @param {string} query what the user is searching for
     * @param {boolean} returns true if this plug-in wants to provide results for this query
     */
    function match(query) {
        // TODO: match any location of @ when QuickOpen._handleItemFocus() is modified to
        // dynamic open files
        //if (query.indexOf("@") !== -1) {
        if (query.indexOf("@") === 0) {
            return true;
        }
    }


    /**
     * Select the selected item in the current document
     * @param {?SearchResult} selectedItem
     */
    function itemFocus(selectedItem) {
        if (!selectedItem) {
            return;
        }
        var fileLocation = getLocationFromID(selectedItem.label);
        if (fileLocation) {
            var from = {line: fileLocation.line, ch: fileLocation.chFrom};
            var to = {line: fileLocation.line, ch: fileLocation.chTo};
            EditorManager.getCurrentFullEditor().setSelection(from, to);
        }
    }

    function itemSelect(selectedItem) {
        itemFocus(selectedItem);
    }


    QuickOpen.addQuickOpenPlugin(
        {
            name: "html ids",
            fileTypes: ["html"],
            done: done,
            search: search,
            match: match,
            itemFocus: itemFocus,
            itemSelect: itemSelect,
            resultsFormatter: null // use default
        }
    );

});
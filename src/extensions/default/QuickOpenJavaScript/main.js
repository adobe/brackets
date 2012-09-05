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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */



define(function (require, exports, module) {
    "use strict";

    var EditorManager       = brackets.getModule("editor/EditorManager"),
        QuickOpen           = brackets.getModule("search/QuickOpen"),
        JSUtils             = brackets.getModule("language/JSUtils"),
        DocumentManager     = brackets.getModule("document/DocumentManager");


   /** 
    * FileLocation class
    * @constructor
    * @param {string} fullPath
    * @param {number} line
    * @param {number} chFrom column start position
    * @param {number} chTo column end position
    * @param {string} functionName
    */
    function FileLocation(fullPath, line, chFrom, chTo, functionName) {
        this.fullPath = fullPath;
        this.line = line;
        this.chFrom = chFrom;
        this.chTo = chTo;
        this.functionName = functionName;
    }

    /**
     * Contains a list of information about functions for a single document. This array is populated
     * by createFunctionList()
     * @type {?Array.<FileLocation>}
     */
    var functionList = null;


    function done() {
        functionList = null;
    }

    /**
     * Retrieves the FileLocation object stored in the functionsList for a given function name
     * @param {string} functionName
     * @returns {FileLocation}
     */
    function getLocationFromFunctionName(functionName) {
        if (!functionList) {
            return null;
        }

        // TODO: doesn't handle case where two functions have same name
        var i, fileLocation;
        for (i = 0; i < functionList.length; i++) {
            var functionInfo = functionList[i];
            if (functionInfo.functionName === functionName) {
                fileLocation = functionInfo;
                break;
            }
        }

        return fileLocation;
    }

    
    function createFunctionList() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        functionList = [];
        var docText = doc.getText();
        var lines = docText.split("\n");
        var functions = JSUtils.findAllMatchingFunctionsInText(docText, "*");
        functions.forEach(function (funcEntry) {
            var chFrom = lines[funcEntry.lineStart].indexOf(funcEntry.name);
            var chTo = chFrom + funcEntry.name.length;
            functionList.push(new FileLocation(null, funcEntry.lineStart, chFrom, chTo, funcEntry.name));
        });

    }

    

    /**
     * @param {string} query what the user is searching for
     * @returns {Array.<SearchResult>} sorted and filtered results that match the query
     */
    function search(query) {
        createFunctionList();
        query = query.slice(query.indexOf("@") + 1, query.length);
        
        // Filter and rank how good each match is
        var filteredList = $.map(functionList, function (itemInfo) {
            return QuickOpen.stringMatch(itemInfo.functionName, query);
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
        // only match @ at beginning of query for now
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
        var fileLocation = getLocationFromFunctionName(selectedItem.label);

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
            name: "JavaScript functions",
            fileTypes: ["js"],
            done: done,
            search: search,
            match: match,
            itemFocus: itemFocus,
            itemSelect: itemSelect,
            resultsFormatter: null // use default
        }
    );

});
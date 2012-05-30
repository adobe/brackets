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
    'use strict';

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

    /**
     * Populates the functionList array
     */
    function createFunctionList() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        if (!functionList) {
            functionList = [];
            var docText = doc.getText();
            
            // TODO: use a shared JS language intelligence module
            // TODO: this doesn't handle functions with params that spread across lines
            var regexA = new RegExp(/(function\b)(.+)\b\(.*?\)/gi);  // recognizes the form: function functionName()
            var regexB = new RegExp(/(\w+)\s*=\s*function\s*(\(.*?\))/gi); // recognizes the form: functionName = function()
            var regexC = new RegExp(/((\w+)\s*:\s*function\s*\(.*?\))/gi); // recognizes the form: functionName: function()
            var infoA, infoB, infoC, i, line;
            var funcName, chFrom, chTo;

            var lines = docText.split("\n");

            for (i = 0; i < lines.length; i++) {
                line = lines[i];

                infoA = regexA.exec(line);
                if (infoA) {
                    funcName = $.trim(infoA[0]);
                    chFrom = line.indexOf(funcName);
                    chTo = chFrom + funcName.length;
                    functionList.push(new FileLocation(null, i, chFrom, chTo, funcName));
                }

                infoB = regexB.exec(line);
                if (infoB) {
                    var pattern = $.trim(infoB[1]);
                    var params = infoB[2];
                    var dotIndex = pattern.lastIndexOf(".");
                    if (dotIndex !== -1) {
                        funcName = pattern.slice(dotIndex + 1, pattern.length);
                    } else {
                        funcName = pattern;
                    }

                    chFrom = line.indexOf(funcName);
                    chTo = chFrom + funcName.length;
                    functionList.push(new FileLocation(null, i, chFrom, chTo, funcName + params));
                }

                infoC = regexC.exec(line);
                if (infoC) {
                    funcName = $.trim(infoC[1]);
                    chFrom = line.indexOf(funcName);
                    chTo = chFrom + funcName.length;
                    functionList.push(new FileLocation(null, i, chFrom, chTo, funcName));
                }
            }
        }
    }

    /**
     * @param {string} query what the user is searching for
     * @returns {Array.<string>} sorted and filtered results that match the query
     */
    function search(query) {
        createFunctionList();

        query = query.slice(query.indexOf("@") + 1, query.length);
        var filteredList = $.map(functionList, function (itemInfo) {

            var functionName = itemInfo.functionName;
            if (functionName.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                return functionName;
            }
        }).sort(function (a, b) {
            a = a.toLowerCase();
            b = b.toLowerCase();
            if (a > b) {
                return -1;
            } else if (a < b) {
                return 1;
            } else {
                return 0;
            }
        });

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
     * @param {string} selectedItem
     */
    function itemFocus(selectedItem) {
        var fileLocation = getLocationFromFunctionName(selectedItem);

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
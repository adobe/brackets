/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror */



define(function (require, exports, module) {
    'use strict';

    var EditorManager       = require("editor/EditorManager"),
        DocumentManager     = require("document/DocumentManager");


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
            
            var regexA = new RegExp(/(function\b)(.+)\b\(.*?\)/gi);  // recognizes the form: function functionName()
            var regexB = new RegExp(/(.+)\s=\sfunction\s(\(.*?\))/gi); // recognizes the form: functionName = function()
            var regexC = new RegExp(/(.+:\sfunction\s\(.*?\))/gi); // recognizes the form: functionName: function()
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
    function filter(query) {
        createFunctionList();

        query = query.slice(query.indexOf("@") + 1, query.length);
        var filteredList = $.map(functionList, function (itemInfo) {

            var functionName = itemInfo.functionName;
            if (functionName.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                return functionName;
            }
        }).sort(function (a, b) {
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
        // TODO: match any location of @ when QuickFileOpen._handleItemFocus() is modified to
        // dynamic open files
        //if (query.indexOf("@") !== -1) {
        if (query.indexOf("@") === 0) {
            return true;
        }
    }

    /**
     * Select the selected item in the current document
     * @param {HTMLLIElement} selectedItem
     */
    function itemFocus(selectedItem) {
        var fileLocation = getLocationFromFunctionName($(selectedItem).text());

        if (fileLocation) {
            var from = {line: fileLocation.line, ch: fileLocation.chFrom};
            var to = {line: fileLocation.line, ch: fileLocation.chTo};
            EditorManager.getCurrentFullEditor().setSelection(from, to);
        }
    }

    /**
     * TODO: selectedItem is currently a <LI> item from smart auto complete container. It should just be data
     */
    function itemSelect(selectedItem) {
        itemFocus(selectedItem);
    }


    /**
     * Returns quick open plug-in
     * TODO: would like to use the QuickOpenPlugin plug-in object type in QuickFileOpen.js,
     * but right now I can't make this file depend on  QuickFileOpen.js because it would
     * create a circular dependency
     */
    function getPlugin() {
        var jsFuncProvider = {  name: "JavaScript functions",
                                fileTypes: ["js"],
                                done: done,
                                filter: filter,
                                match: match,
                                itemFocus: itemFocus,
                                itemSelect: itemSelect,
                                resultsFormatter: null // use default
                            };

        return jsFuncProvider;
    }


    exports.getPlugin = getPlugin;

});
/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror */



define(function (require, exports, module) {
    'use strict';

    var QuickFileOpen        = require("QuickFileOpen"),
        FileIndexManager    = require("FileIndexManager"),
        DocumentManager     = require("DocumentManager");


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
     * by createCachedFunctionList()
     * @type {Array.<FileLocation>}
     */
    var functionList = [];

    // currently NOT used. This was an attempt to use CodeMirror tokens to find functions
    function generateFunctionList2() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        var docText = doc.editor.getText();
        var mode = CodeMirror.getMode({indentUnit: 2}, "javascript");
        var state = CodeMirror.startState(mode);

        var stream = new CodeMirror.StringStream(docText);
        var style, token;
        while (!stream.eol()) {
            style = mode.token(stream, state);
            token = stream.current();

            stream.start = stream.pos;

            console.log(token + " " + style);

            //  if(style==="tag") {
            //  console.log( token + "    " + style );
            //  }
        }
    }

    /**
     * Retrieves the FileLocation object stored in the functionsList for a given functon name
     * @param {string} functionName
     * @returns {FileLocation}
     */
    function getLocationFromFunctionName(functionName) {
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
     *
     *
     */
    // create function list and caches it in FileIndexMangage
    function createCachedFunctionList() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        var fileInfo = FileIndexManager.getFileInfo(doc.file.fullPath);
        var data = FileIndexManager.getFileInfoData(fileInfo, "JavaScriptFunctionList");
        if (fileInfo &&  data && !data.dirty && data.data !== null) {
            // cached function list data is present and clean so use it
            functionList = data.data;
        } else {
            // function list data is not cached or is dirty, so rebuild
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

            FileIndexManager.setFileInfoData(fileInfo, "JavaScriptFunctionList", functionList);
        }
    }

    /**
     * @param {string} query what the user is searching for
     * @returns {Array.<string>} sorted and filtered results that match the query
     */
    function filter(query) {
        createCachedFunctionList();

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
     * @param {boolean} returns true if this plugin wants to provide results for this query
     */
    function match(query) {
        if (query.indexOf("@") !== -1) {
            return true;
        }
    }

    /**
     * TODO: selectedItem is currently a <LI> item from smart auto complete container. It should just be data
     */
    function itemFocus(selectedItem) {
        var fileLocation = getLocationFromFunctionName($(selectedItem).text());

        if (fileLocation) {
            var from = {line: fileLocation.line, ch: fileLocation.chFrom};
            var to = {line: fileLocation.line, ch: fileLocation.chTo};
            DocumentManager.getCurrentDocument().editor.setSelection(from, to);
        }
    }

    /**
     * TODO: selectedItem is currently a <LI> item from smart auto complete container. It should just be data
     */
    function itemSelect(selectedItem) {
        itemFocus(selectedItem);
    }

    /**
     *
     *
     */
    function resultsFormatter(item, query) {
        query = query.slice(query.indexOf("@") + 1, query.length);
        var boldName = item.replace(new RegExp(query, "gi"), "<strong>$&</strong>");
        return "<li>" + boldName + "</li>";
    }


    /**
     * Returns quick open plugin
     * TODO: would like to use the QuickOpenPlugin plugin object type in QuickFileOpen.js,
     * but right now I can't make this file depend on  QuickFileOpen.js because it would
     * create a circular dependency
     */
    function getPlugin() {
        var jsFuncProvider = {     name: "JavaScript functions",
                                 fileTypes: ["js"],
                                 filter: filter,
                                 match: match,
                                itemFocus: itemFocus,
                                itemSelect: itemSelect,
                                resultsFormatter: resultsFormatter
                            };

        return jsFuncProvider;
    }


    exports.getPlugin = getPlugin;

});
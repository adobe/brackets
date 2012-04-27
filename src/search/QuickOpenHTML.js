/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, regexp: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */



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

    // create function list and caches it in FileIndexMangage
    function createIDList() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        if (!idList) {
            idList = [];
            var docText = doc.getText();
            var lines = docText.split("\n");

            var regex = new RegExp(/\sid\s?=\s?"(.*?)"/gi);
            var id, chFrom, chTo, i, line;
            for (i = 0; i < lines.length; i++) {
                line = lines[i];

                var info;
                while ((info = regex.exec(line)) !== null) {
                    id = info[1];
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
     * @returns {Array.<string>} sorted and filtered results that match the query
     */
    function filter(query) {
        createIDList();

        query = query.slice(query.indexOf("@") + 1, query.length);
        var filteredList = $.map(idList, function (itemInfo) {
            if (itemInfo.id.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                return itemInfo.id;
            }
        }).sort();

        return filteredList;
    }

    /**
     * @param {string} query what the user is searching for
     * @param {boolean} returns true if this plug-in wants to provide results for this query
     */
    function match(query) {
        // TODO: match any location of @ when QuickFileOpen._handleItemFocus() is modified to
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
        var fileLocation = getLocationFromID($(selectedItem).text());
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
        var jsFuncProvider = {  name: "html ids",
                                fileTypes: ["html"],
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
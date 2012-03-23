/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */



define(function (require, exports, module) {
    'use strict';

    var FileIndexManager    = require("project/FileIndexManager"),
        EditorManager       = require("editor/EditorManager"),
        CSSUtils            = require("language/CSSUtils"),
        DocumentManager     = require("document/DocumentManager");


    /**
     * Contains a list of information about selectors for a single document. This array is populated
     * by createCachedSelectorList()
     * @type {Array.<FileLocation>}
     */
    var selectorList = [];



    // create function list and caches it in FileIndexMangage
    function createCachedSelectorList() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        var fileInfo = FileIndexManager.getFileInfo(doc.file.fullPath);
        var data = FileIndexManager.getFileInfoData(fileInfo, "CSSSelectorsList");
        if (fileInfo &&  data && !data.dirty && data.data !== null) {
            // cached function list data is present and clean so use it
            selectorList = data.data;
        } else {
            var docText = doc.getText();
            selectorList = CSSUtils.extractAllSelectors(docText);
            FileIndexManager.setFileInfoData(fileInfo, "CSSSelectorsList", selectorList);
        }
    }

    function getLocationFromSelectorName(selector) {
        var i, result;
        for (i = 0; i < selectorList.length; i++) {
            var selectorInfo = selectorList[i];
            if (selectorInfo.selector === selector) {
                result = selectorInfo;
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
        createCachedSelectorList();

        query = query.slice(query.indexOf("@") + 1, query.length);
        var filteredList = $.map(selectorList, function (itemInfo) {

            var selector = itemInfo.selector;

            // TODO: work around for issue #483
            if(selector[0] === "/" && selector[1] === "*")
                return null;

            if (selector.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                return selector;
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
     * Select the selected item in the current document
     * @param {string} selectedItem
     */
    function itemFocus(selectedItem) {
        var selectorInfo = getLocationFromSelectorName($(selectedItem).text());
        if (selectorInfo) {
            var from = {line: selectorInfo.line, ch: selectorInfo.character};
            var to = {line: selectorInfo.line, ch: selectorInfo.selectorEndChar};
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
     * Returns quick open plugin
     * TODO: would like to use the QuickOpenPlugin plugin object type in QuickFileOpen.js,
     * but right now I can't make this file depend on  QuickFileOpen.js because it would
     * create a circular dependency
     */
    function getPlugin() {
        var jsFuncProvider = {  name: "CSS Selectors",
                                fileTypes: ["css"],
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
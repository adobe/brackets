/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */



define(function (require, exports, module) {
    'use strict';

    var EditorManager       = brackets.getModule("editor/EditorManager"),
        QuickOpen           = brackets.getModule("search/QuickOpen"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        DocumentManager     = brackets.getModule("document/DocumentManager");


    /**
     * Contains a list of information about selectors for a single document. This array is populated
     * by createSelectorList()
     * @type {?Array.<FileLocation>}
     */
    var selectorList = null;

    /** clears selectorList */
    function done() {
        selectorList = null;
    }

    // create function list and caches it in FileIndexMangager
    function createSelectorList() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        if (!selectorList) {
            selectorList = [];
            var docText = doc.getText();
            selectorList = CSSUtils.extractAllSelectors(docText);
        }
    }

    function getLocationFromSelectorName(selector) {
        if (!selectorList) {
            return null;
        }
        
        // TODO: handle multiple selectors with same name in CSS file
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
    function search(query) {
        createSelectorList();

        query = query.slice(query.indexOf("@") + 1, query.length);
        var filteredList = $.map(selectorList, function (itemInfo) {

            var selector = itemInfo.selector;

            if (selector.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                return selector;
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
     * @param {boolean} returns true if this plugin wants to provide results for this query
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
     * @param {HTMLLIElement} selectedItem
     */
    function itemFocus(selectedItem) {
        var selectorInfo = getLocationFromSelectorName($(selectedItem).text());
        if (selectorInfo) {
            var from = {line: selectorInfo.selectorStartLine, ch: selectorInfo.selectorStartChar};
            var to = {line: selectorInfo.selectorStartLine, ch: selectorInfo.selectorEndChar};
            EditorManager.getCurrentFullEditor().setSelection(from, to);
        }
    }

    /**
     * TODO: selectedItem is currently a <LI> item from smart auto complete container. It should just be data
     */
    function itemSelect(selectedItem) {
        itemFocus(selectedItem);
    }



    QuickOpen.addQuickOpenPlugin(
        {
            name: "CSS Selectors",
            fileTypes: ["css"],
            done: done,
            search: search,
            match: match,
            itemFocus: itemFocus,
            itemSelect: itemSelect,
            resultsFormatter: null // use default
        }
    );


});
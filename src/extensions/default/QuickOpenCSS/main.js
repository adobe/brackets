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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */



define(function (require, exports, module) {
    "use strict";

    var EditorManager       = brackets.getModule("editor/EditorManager"),
        QuickOpen           = brackets.getModule("search/QuickOpen"),
        QuickOpenHelper     = brackets.getModule("search/QuickOpenHelper"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        StringMatch         = brackets.getModule("utils/StringMatch");


    /**
     * Returns a list of information about selectors for a single document. This array is populated
     * by createSelectorList()
     * @return {?Array.<FileLocation>}
     */
    function createSelectorList() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            return;
        }

        var docText = doc.getText();
        return CSSUtils.extractAllSelectors(docText, doc.getLanguage().getMode());
    }


    /**
     * @param {string} query what the user is searching for
     * @return {Array.<SearchResult>} sorted and filtered results that match the query
     */
    function search(query, matcher) {
        var selectorList = matcher.selectorList;
        if (!selectorList) {
            selectorList = createSelectorList();
            matcher.selectorList = selectorList;
        }
        query = query.slice(query.indexOf("@") + 1, query.length);

        // Filter and rank how good each match is
        var filteredList = $.map(selectorList, function (itemInfo) {
            var searchResult = matcher.match(CSSUtils.getCompleteSelectors(itemInfo), query);
            if (searchResult) {
                searchResult.selectorInfo = itemInfo;
            }
            return searchResult;
        });

        // Sort based on ranking & basic alphabetical order
        StringMatch.basicMatchSort(filteredList);

        return filteredList;
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
        var selectorInfo = selectedItem.selectorInfo;

        var from = {line: selectorInfo.selectorStartLine, ch: selectorInfo.selectorStartChar};
        var to = {line: selectorInfo.selectorStartLine, ch: selectorInfo.selectorEndChar};
        EditorManager.getCurrentFullEditor().setSelection(from, to, true);
    }

    function itemSelect(selectedItem, query) {
        itemFocus(selectedItem, query, true);
    }



    QuickOpen.addQuickOpenPlugin(
        {
            name: "CSS Selectors",
            languageIds: ["css", "less", "scss"],
            search: search,
            match: QuickOpenHelper.match,
            itemFocus: itemFocus,
            itemSelect: itemSelect
        }
    );


});

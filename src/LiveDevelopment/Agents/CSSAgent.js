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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $, PathUtils */

/**
 * CSSAgent keeps track of loaded style sheets and allows reloading them
 * from a {Document}.
 */

define(function CSSAgent(require, exports, module) {
    "use strict";

    require("thirdparty/path-utils/path-utils.min");

    var Inspector = require("LiveDevelopment/Inspector/Inspector");

    var _load; // {$.Deferred} load promise
    var _urlToStyle; // {url -> loaded} style definition

    /** 
     * Create a canonicalized version of the given URL, stripping off query strings and hashes.
     * @param {string} url the URL to canonicalize
     * @return the canonicalized URL
     */
    function _canonicalize(url) {
        return PathUtils.parseUrl(url).hrefNoSearch;
    }

    // WebInspector Event: Page.loadEventFired
    function _onLoadEventFired(event, res) {
        // res = {timestamp}
        _urlToStyle = {};
        Inspector.CSS.getAllStyleSheets(function onGetAllStyleSheets(res) {
            var i, header;
            for (i in res.headers) {
                header = res.headers[i];
                _urlToStyle[_canonicalize(header.sourceURL)] = header;
            }
            _load.resolve();
        });
    }

    /** Get a style sheet for a url
     * @param {string} url
     */
    function styleForURL(url) {
        return _urlToStyle[_canonicalize(url)];
    }

    /** Get a list of all loaded stylesheet files by URL */
    function getStylesheetURLs() {
        var urls = [], url;
        for (url in _urlToStyle) {
            if (_urlToStyle.hasOwnProperty(url)) {
                urls.push(url);
            }
        }
        return urls;
    }

    /** Reload a CSS style sheet from a document
     * @param {Document} document
     */
    function reloadCSSForDocument(doc) {
        var style = styleForURL(doc.url);
        console.assert(style, "Style Sheet for document not loaded: " + doc.url);
        Inspector.CSS.setStyleSheetText(style.styleSheetId, doc.getText());
    }

    /** Empties a CSS style sheet given a document that has been deleted
     * @param {Document} document
     */
    function clearCSSForDocument(doc) {
        var style = styleForURL(doc.url);
        console.assert(style, "Style Sheet for document not loaded: " + doc.url);
        Inspector.CSS.setStyleSheetText(style.styleSheetId, "");
    }

    /** Initialize the agent */
    function load() {
        _load = new $.Deferred();
        $(Inspector.Page).on("loadEventFired.CSSAgent", _onLoadEventFired);
        return _load.promise();
    }

    /** Clean up */
    function unload() {
        $(Inspector.Page).off(".CSSAgent");
    }

    // Export public functions
    exports.styleForURL = styleForURL;
    exports.getStylesheetURLs = getStylesheetURLs;
    exports.reloadCSSForDocument = reloadCSSForDocument;
    exports.clearCSSForDocument = clearCSSForDocument;
    exports.load = load;
    exports.unload = unload;
});
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
 *
 * CSSAgent dispatches styleSheetAdded and styleSheetRemoved events, passing
 * the URL for the added/removed style sheet.
 */
define(function CSSAgent(require, exports, module) {
    "use strict";

    require("thirdparty/path-utils/path-utils.min");

    var Inspector = require("LiveDevelopment/Inspector/Inspector");

    /** @type {Object.<string, CSS.CSSStyleSheetHeader>} */
    var _urlToStyle = {};
    
    /** @type {Object.<string, string>} */
    var _styleSheetIdToUrl;

    /** @type {boolean} This is undefined until we test for API */
    var _getAllStyleSheetsNotFound;

    /** 
     * Create a canonicalized version of the given URL, stripping off query strings and hashes.
     * @param {string} url the URL to canonicalize
     * @return the canonicalized URL
     */
    function _canonicalize(url) {
        return PathUtils.parseUrl(url).hrefNoSearch;
    }

    /**
     * @private
     * WebInspector Event: Page.frameNavigated
     * @param {jQuery.Event} event
     * @param {frame: Frame} res
     */
    function _onFrameNavigated(event, res) {
        // Clear maps when navigating to a new page
        _urlToStyle = {};
        _styleSheetIdToUrl = {};
    }

    /**
     * Get a style sheet for a url
     * @param {string} url
     * @return {CSS.CSSStyleSheetHeader}
     */
    function styleForURL(url) {
        return _urlToStyle[_canonicalize(url)];
    }

    /**
     * @deprecated Use styleSheetAdded and styleSheetRemoved events
     * Get a list of all loaded stylesheet files by URL
     */
    function getStylesheetURLs() {
        var urls = [], url;
        for (url in _urlToStyle) {
            if (_urlToStyle.hasOwnProperty(url)) {
                urls.push(url);
            }
        }
        return urls;
    }

    /**
     * Reload a CSS style sheet from a document
     * @param {Document} document
     * @return {jQuery.Promise}
     */
    function reloadCSSForDocument(doc) {
        var style = styleForURL(doc.url);
        console.assert(style, "Style Sheet for document not loaded: " + doc.url);
        return Inspector.CSS.setStyleSheetText(style.styleSheetId, doc.getText());
    }

    /**
     * Empties a CSS style sheet given a document that has been deleted
     * @param {Document} document
     * @return {jQuery.Promise}
     */
    function clearCSSForDocument(doc) {
        var style = styleForURL(doc.url);
        console.assert(style, "Style Sheet for document not loaded: " + doc.url);
        return Inspector.CSS.setStyleSheetText(style.styleSheetId, "");
    }
    
    /**
     * @private
     * @param {jQuery.Event} event
     * @param {header: CSSStyleSheetHeader}
     */
    function _styleSheetAdded(event, res) {
        var url = _canonicalize(res.header.sourceURL),
            existing = _urlToStyle[url];
        
        // detect duplicates
        if (existing && existing.styleSheetId === res.header.styleSheetId) {
            return;
        }
        
        _urlToStyle[url] = res.header;
        _styleSheetIdToUrl[res.header.styleSheetId] = url;
        
        $(exports).triggerHandler("styleSheetAdded", [url, res.header]);
    }
    
    /**
     * @private
     * @param {jQuery.Event} event
     * @param {styleSheetId: StyleSheetId}
     */
    function _styleSheetRemoved(event, res) {
        var url = _styleSheetIdToUrl[res.styleSheetId],
            header = url && _urlToStyle[url];
        
        if (url) {
            delete _urlToStyle[url];
        }
        
        delete _styleSheetIdToUrl[res.styleSheetId];
        
        $(exports).triggerHandler("styleSheetRemoved", [url, header]);
    }
    
    /**
     * @private
     * Attempt to use deleted API CSS.getAllStyleSheets
     * @param {jQuery.Event} event
     * @param {frameId: Network.FrameId}
     */
    function _onFrameStoppedLoading(event, res) {
        var regexChromeUA,
            userAgent,
            uaMatch;

        // Check for undefined so user agent string is only parsed once
        if (_getAllStyleSheetsNotFound === undefined) {
            regexChromeUA = /Chrome\/(\d+)\./;  // Example: "... Chrome/34.0.1847.131 ..."
            userAgent     = Inspector.getUserAgent();
            uaMatch       = userAgent.match(regexChromeUA);

            // If we have user agent string, and Chrome is >= 34, then don't use getAllStyleSheets
            if (uaMatch && parseInt(uaMatch[1], 10) >= 34) {
                _getAllStyleSheetsNotFound = true;
                $(Inspector.Page).off("frameStoppedLoading.CSSAgent", _onFrameStoppedLoading);
                return;
            }
        }

        // Manually fire getAllStyleSheets since it will be removed from
        // Inspector.json in a future update
        Inspector.send("CSS", "getAllStyleSheets").done(function (res) {
            res.headers.forEach(function (header) {
                // _styleSheetAdded will ignore duplicates
                _getAllStyleSheetsNotFound = false;
                _styleSheetAdded(null, { header: header });
            });
        }).fail(function (err) {
            // Disable getAllStyleSheets if the first call fails
            _getAllStyleSheetsNotFound = (err.code === -32601);
            $(Inspector.Page).off("frameStoppedLoading.CSSAgent", _onFrameStoppedLoading);
        });
    }

    /** Enable the domain */
    function enable() {
        return Inspector.CSS.enable();
    }

    /** Initialize the agent */
    function load() {
        $(Inspector.Page).on("frameNavigated.CSSAgent", _onFrameNavigated);
        $(Inspector.CSS).on("styleSheetAdded.CSSAgent", _styleSheetAdded);
        $(Inspector.CSS).on("styleSheetRemoved.CSSAgent", _styleSheetRemoved);

        // getAllStyleSheets was deleted beginning with Chrome 34
        if (!_getAllStyleSheetsNotFound) {
            $(Inspector.Page).on("frameStoppedLoading.CSSAgent", _onFrameStoppedLoading);
        }
    }

    /** Clean up */
    function unload() {
        $(Inspector.Page).off(".CSSAgent");
        $(Inspector.CSS).off(".CSSAgent");
    }

    // Export public functions
    exports.enable = enable;
    exports.styleForURL = styleForURL;
    exports.getStylesheetURLs = getStylesheetURLs;
    exports.reloadCSSForDocument = reloadCSSForDocument;
    exports.clearCSSForDocument = clearCSSForDocument;
    exports.load = load;
    exports.unload = unload;
});
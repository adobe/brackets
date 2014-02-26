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

    var _load; // {$.Deferred} load promise
    
    /** @type {Object.<string, CSS.CSSStyleSheetHeader>} */
    var _urlToStyle;
    
    /** @type {Object.<string, string>} */
    var _styleSheetIdToUrl;

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

    /** Get a style sheet for a url
     * @param {string} url
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
    
    /**
     * @private
     * @param {jQuery.Event} event
     * @param {header: CSSStyleSheetHeader}
     */
    function _styleSheetAdded(event, res) {
        if (!_urlToStyle) {
            return;
        }
        
        var url = _canonicalize(res.header.sourceURL);
        
        _urlToStyle[url] = res.header;
        _styleSheetIdToUrl[res.header.styleSheetId] = url;
        
        $(exports).triggerHandler("styleSheetAdded", [url]);
    }
    
    /**
     * @private
     * @param {jQuery.Event} event
     * @param {styleSheetId: StyleSheetId}
     */
    function _styleSheetRemoved(event, res) {
        if (!_urlToStyle) {
            return;
        }
        
        var url = _styleSheetIdToUrl[res.styleSheetId];
        
        if (url) {
            delete _urlToStyle[url];
        }
        
        delete _styleSheetIdToUrl[res.styleSheetId];
        
        $(exports).triggerHandler("styleSheetRemoved", [url]);
    }

    /** Initialize the agent */
    function load() {
        // "loading" is done when the domain is enabled 
        _load = Inspector.CSS.enable();
        
        $(Inspector.Page).on("frameNavigated.CSSAgent", _onFrameNavigated);
        $(Inspector.CSS).on("styleSheetAdded.CSSAgent", _styleSheetAdded);
        $(Inspector.CSS).on("styleSheetRemoved.CSSAgent", _styleSheetRemoved);
        
        return _load.promise();
    }

    /** Clean up */
    function unload() {
        $(Inspector.Page).off(".CSSAgent");
        $(Inspector.CSS).off(".CSSAgent");
    }

    // Export public functions
    exports.styleForURL = styleForURL;
    exports.getStylesheetURLs = getStylesheetURLs;
    exports.reloadCSSForDocument = reloadCSSForDocument;
    exports.clearCSSForDocument = clearCSSForDocument;
    exports.load = load;
    exports.unload = unload;
});
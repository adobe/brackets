/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 * @author Jonathan Diehl <jdiehl@adobe.com>
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $ */

/**
 * CSSAgent keeps track of loaded style sheets and allows reloading them
 * from a {Document}.
 */

define(function CSSAgent(require, exports, module) {
    'use strict';

    var Inspector = require("LiveDevelopment/Inspector/Inspector");

    var _load; // {$.Deferred} load promise
    var _urlToStyle; // {url -> loaded} style definition

    // WebInspector Event: Page.loadEventFired
    function _onLoadEventFired(res) {
        // res = {timestamp}
        _urlToStyle = {};
        Inspector.CSS.getAllStyleSheets(function onGetAllStyleSheets(res) {
            var i, header;
            for (i in res.headers) {
                header = res.headers[i];
                _urlToStyle[header.sourceURL] = header;
            }
            _load.resolve();
        });
    }

    /** Get a style sheet for a url
     * @param {string} url
     */
    function styleForURL(url) {
        return _urlToStyle[url];
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
    function reloadDocument(doc) {
        var style = styleForURL(doc.url);
        console.assert(style, "Style Sheet for document not loaded: " + doc.url);
        Inspector.CSS.setStyleSheetText(style.styleSheetId, doc.getText());
    }
    
    /** Empties a CSS style sheet given a document that has been deleted
     * @param {Document} document
     */
    function reloadDeletedDocument(doc) {
        var style = styleForURL(doc.url);
        console.assert(style, "Style Sheet for document not loaded: " + doc.url);
        Inspector.CSS.setStyleSheetText(style.styleSheetId, "");
    }

    /** Initialize the agent */
    function load() {
        _load = new $.Deferred();
        Inspector.on("Page.loadEventFired", _onLoadEventFired);
        return _load.promise();
    }

    /** Clean up */
    function unload() {
        Inspector.off("Page.loadEventFired", _onLoadEventFired);
    }

    // Export public functions
    exports.styleForURL = styleForURL;
    exports.getStylesheetURLs = getStylesheetURLs;
    exports.reloadDocument = reloadDocument;
    exports.reloadDeletedDocument = reloadDeletedDocument;
    exports.load = load;
    exports.unload = unload;
});
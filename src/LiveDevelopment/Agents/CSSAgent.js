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

    var Async               = require("utils/Async"),
        FileSystem          = require("filesystem/FileSystem"),
        FileUtils           = require("file/FileUtils"),
        Inspector           = require("LiveDevelopment/Inspector/Inspector"),
        LiveDevelopment     = require("LiveDevelopment/LiveDevelopment"),
        SourceMapConsumer   = require("thirdparty/source-map/lib/source-map/source-map-consumer").SourceMapConsumer;

    var _load; // {$.Deferred} load promise
    var _urlToStyle; // {url -> loaded} style definition
    var _sourceMapURLs;

    function _initSourceMaps() {
        var deferred = new $.Deferred();

        if (!_sourceMapURLs || _sourceMapURLs.length === 0) {
            return deferred.resolve().promise();
        }

        // Process source maps
        var server = LiveDevelopment._getServer(),
            sourceMapPath,
            sourceMapPaths = [];

        // Convert source map URLs to local paths
        _sourceMapURLs.forEach(function (sourceMapURL) {
            sourceMapPath = server.urlToPath(sourceMapURL);

            if (sourceMapPath) {
                sourceMapPaths.push(sourceMapPath);
            }
        });

        // Read source map content from disk
        var readSourceMapsPromise = Async.doInParallel(sourceMapPaths, function (path) {
            var sourceMapDeferred = new $.Deferred(),
                file = FileSystem.getFileForPath(path);

            // TODO setup change events
            FileUtils.readAsText(file).done(function (contents) {
                var sourceMap = new SourceMapConsumer(contents);
                console.log(sourceMap);

                sourceMapDeferred.resolve();
            }).fail(sourceMapDeferred.reject);

            return sourceMapDeferred.promise();
        }, false);

        readSourceMapsPromise.then(deferred.resolve, deferred.reject);

        return deferred.promise();
    }

    // WebInspector Event: Page.loadEventFired
    function _onLoadEventFired(event, res) {
        // res = {timestamp}
        _urlToStyle = {};
        _sourceMapURLs = [];
        
        Inspector.CSS.enable().done(function () {
            Inspector.CSS.getAllStyleSheets(function onGetAllStyleSheets(res) {
                var i,
                    header,
                    parseURL,
                    sourceURL,
                    sourceMapURL;

                for (i in res.headers) {
                    header = res.headers[i];
                    parseURL = PathUtils.parseUrl(header.sourceURL)
                    sourceURL = parseURL.hrefNoSearch;
                    
                    _urlToStyle[sourceURL] = header;
                    
                    if (header.sourceMapURL) {
                        sourceMapURL = sourceURL.replace(new RegExp(parseURL.filename + "$"), header.sourceMapURL);
                        _sourceMapURLs.push(sourceMapURL);
                    }
                }

                _initSourceMaps().always(_load.resolve);
            });
        });
    }

    /** Get a style sheet for a url
     * @param {string} url
     */
    function styleForURL(url) {
        if (_urlToStyle) {
            return _urlToStyle[PathUtils.parseUrl(url).hrefNoSearch];
        }
        
        return null;
    }

    /** Get a list of all loaded stylesheet files by URL */
    function getStylesheetURLs() {
        return Object.keys(_urlToStyle);
    }
    
    function getStylesheetSourceMapURLs() {
        return _sourceMapURLs;
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
    exports.getStylesheetSourceMapURLs = getStylesheetSourceMapURLs;
    exports.reloadCSSForDocument = reloadCSSForDocument;
    exports.clearCSSForDocument = clearCSSForDocument;
    exports.load = load;
    exports.unload = unload;
});
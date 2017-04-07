/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    // Core modules
    var _               = brackets.getModule("thirdparty/lodash"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        FileSystem      = brackets.getModule("filesystem/FileSystem"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        CSSUtils        = brackets.getModule("language/CSSUtils"),
        HTMLUtils       = brackets.getModule("language/HTMLUtils"),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils");

    // Extension modules
    var InlineDocsViewer = require("InlineDocsViewer");


    /*
     * Caches docs promises
     */
    var promiseCache = {};

    /**
     * Lazily loads JSON docs files. Returns a Promise the is resolved with the parsed Object, or
     * rejected if the file is missing/corrupt.
     * @param {string} fileName JSON file to load
     * @return {!$.Promise}
     */
    function getDocs(fileName) {
        if (!promiseCache[fileName]) {
            var result = new $.Deferred(),
                path = ExtensionUtils.getModulePath(module, fileName),
                file = FileSystem.getFileForPath(path);

            FileUtils.readAsText(file)
                .done(function (text) {
                    var jsonData;
                    try {
                        jsonData = JSON.parse(text);
                    } catch (ex) {
                        console.error("Malformed documentation database: ", path, ex);
                        result.reject();
                    }
                    result.resolve(jsonData);  // ignored if we already reject()ed above
                })
                .fail(function (err) {
                    console.error("Unable to load documentation database: ", path,  err);
                    result.reject();
                });

            promiseCache[fileName] = result.promise();
        }

        return promiseCache[fileName];
    }


    /**
     * Inline docs provider.
     *
     * @param {!Editor} editor
     * @param {!{line:Number, ch:Number}} pos
     * @return {?$.Promise} resolved with an InlineWidget; null if we're not going to provide anything
     */
    function inlineProvider(hostEditor, pos) {
        var jsonFile, propInfo,
            propQueue = [], // priority queue of propNames to try
            langId = hostEditor.getLanguageForSelection().getId(),
            cssLikeLangs = ["css", "less", "scss"],
            htmlLikeLangs = ["html"],
            isCssLike = cssLikeLangs.indexOf(langId) > -1,
            isHtmlLike = htmlLikeLangs.indexOf(langId) > -1;

        // Only provide docs when cursor is in supported language
        if (!isCssLike && !isHtmlLike) {
            return null;
        }

        // Only provide docs if the selection is within a single line
        var sel = hostEditor.getSelection();
        if (sel.start.line !== sel.end.line) {
            return null;
        }

        if (isCssLike) {
            jsonFile = "css.json";
            propInfo = CSSUtils.getInfoAtPos(hostEditor, sel.start);
            if (propInfo.name) {
                propQueue.push("css/properties/" + propInfo.name);
                // remove possible vendor prefixes
                propQueue.push("css/properties/" + propInfo.name.replace(/^-(?:webkit|moz|ms|o)-/, ""));
            }
        } else { // HTML-like language
            jsonFile = "html.json";
            propInfo = HTMLUtils.getTagInfo(hostEditor, sel.start);
            if (propInfo.position.tokenType === HTMLUtils.ATTR_NAME && propInfo.attr && propInfo.attr.name) {
                // we're on an HTML attribute (and not on its value)
                propQueue.push("html/attributes/" + propInfo.attr.name.toLowerCase());
            }
            if (propInfo.tagName) { // we're somehow on an HTML tag (no matter where exactly)
                propInfo = propInfo.tagName.toLowerCase();
                if (/^h[1-6]$/.test(propInfo)) { // h1..h6 are expressed as "hn" in Web Platform Docs
                    propInfo = "hn";
                }
                propQueue.push("html/elements/" + propInfo);
            }
        }

        // Are we on a supported property? (no matter if info is available for the property)
        if (propQueue.length) {
            var result = new $.Deferred();

            // Load JSON file if not done yet
            getDocs(jsonFile)
                .done(function (docs) {
                    docs = docs.PROPERTIES;
                    // Construct inline widget (if we have docs for this property)

                    var displayName, propDetails,
                        propName = _.find(propQueue, function (propName) { // find the first property where info is available
                            return docs.hasOwnProperty(propName);
                        });

                    if (propName) {
                        // strip off all prefixes from the propName
                        var propPrefix = propName.substr(0, propName.lastIndexOf("/"));
                        propDetails = docs[propName];
                        displayName = propName.substr(propName.lastIndexOf("/") + 1);
                        if (propPrefix === "html/elements") {
                            displayName = "<" + displayName + ">";
                        }
                    }
                    if (propDetails) {
                        var inlineWidget = new InlineDocsViewer(displayName, propDetails);
                        inlineWidget.load(hostEditor);
                        result.resolve(inlineWidget);
                    } else {
                        result.reject();
                    }
                })
                .fail(function () {
                    result.reject();
                });

            return result.promise();

        } else {
            return null;
        }
    }

    // Register as inline docs provider
    EditorManager.registerInlineDocsProvider(inlineProvider);

    exports._getDocs         = getDocs;
    exports._inlineProvider  = inlineProvider;
});

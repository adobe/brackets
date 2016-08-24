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
    var EditorManager        = brackets.getModule("editor/EditorManager"),
        FileSystem           = brackets.getModule("filesystem/FileSystem"),
        FileUtils            = brackets.getModule("file/FileUtils"),
        ExtensionUtils       = brackets.getModule("utils/ExtensionUtils"),
        CSSUtils             = brackets.getModule("language/CSSUtils");

    // Extension modules
    var InlineDocsViewer = require("InlineDocsViewer");


    /** @type {?$.Promise} */
    var _cssDocsPromise = null;

    /**
     * Lazily loads JSON docs files. Returns a Promise the is resolved with the parsed Object, or
     * rejected if the file is missing/corrupt.
     * @return {!$.Promise}
     */
    function getCSSDocs() {
        if (!_cssDocsPromise) {
            var result = new $.Deferred();

            var path = ExtensionUtils.getModulePath(module, "css.json"),
                file = FileSystem.getFileForPath(path);

            FileUtils.readAsText(file)
                .done(function (text) {
                    var jsonData;
                    try {
                        jsonData = JSON.parse(text);
                    } catch (ex) {
                        console.error("Malformed CSS documentation database: ", ex);
                        result.reject();
                    }
                    result.resolve(jsonData);  // ignored if we already reject()ed above
                })
                .fail(function (err) {
                    console.error("Unable to load CSS documentation database: ", err);
                    result.reject();
                });

            _cssDocsPromise = result.promise();
        }

        return _cssDocsPromise;
    }


    /**
     * Inline docs provider. Currently looks up docs based on CSS properties only.
     *
     * @param {!Editor} editor
     * @param {!{line:Number, ch:Number}} pos
     * @return {?$.Promise} resolved with an InlineWidget; null if we're not going to provide anything
     */
    function inlineProvider(hostEditor, pos) {
        var langId = hostEditor.getLanguageForSelection().getId();
        // Only provide docs when cursor is in CSS content
        if (langId !== "css" && langId !== "scss" && langId !== "less") {
            return null;
        }

        // Only provide docs if the selection is within a single line
        var sel = hostEditor.getSelection();
        if (sel.start.line !== sel.end.line) {
            return null;
        }

        // Explicitly use selection start rather than pos, which is usually selection end
        var cssInfo = CSSUtils.getInfoAtPos(hostEditor, sel.start);

        // Are we at a propety name (or in a value where name is discernible?)
        if (cssInfo && cssInfo.name) {
            var cssPropName = cssInfo.name,
                result = new $.Deferred();

            // Load JSON file if not done yet
            getCSSDocs()
                .done(function (cssDocs) {
                    // Construct inline widget (if we have docs for this property)
                    var cssPropDetails = cssDocs.PROPERTIES["css/properties/" + cssPropName];
                    if (!cssPropDetails) {
                        cssPropName = cssPropName.replace(/^-(webkit|moz|ms|o)-/, ""); // remove possible vendor prefixes
                        if (cssPropName) {
                            cssPropDetails = cssDocs.PROPERTIES["css/properties/" + cssPropName];
                        }
                    }
                    if (cssPropDetails) {
                        var inlineWidget = new InlineDocsViewer(cssPropName, cssPropDetails);
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

    exports._getCSSDocs      = getCSSDocs;
    exports._inlineProvider  = inlineProvider;
});

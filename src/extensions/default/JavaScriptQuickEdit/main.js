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

define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var MultiRangeInlineEditor  = brackets.getModule("editor/MultiRangeInlineEditor").MultiRangeInlineEditor,
        EditorManager           = brackets.getModule("editor/EditorManager"),
        JSUtils                 = brackets.getModule("language/JSUtils"),
        LanguageManager         = brackets.getModule("language/LanguageManager"),
        PerfUtils               = brackets.getModule("utils/PerfUtils"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        Strings                 = brackets.getModule("strings");

    /**
     * Return the token string that is at the specified position.
     *
     * @param hostEditor {!Editor} editor
     * @param {!{line:number, ch:number}} pos
     * @return {functionName: string, reason: string}
     */
    function _getFunctionName(hostEditor, pos) {
        var token = hostEditor._codeMirror.getTokenAt(pos, true);

        // If the pos is at the beginning of a name, token will be the
        // preceding whitespace or dot. In that case, try the next pos.
        if (!/\S/.test(token.string) || token.string === ".") {
            token = hostEditor._codeMirror.getTokenAt({line: pos.line, ch: pos.ch + 1}, true);
        }

        // Return valid function expressions only (function call or reference)
        if (!((token.type === "variable") ||
              (token.type === "variable-2") ||
              (token.type === "property"))) {
            return {
                functionName: null,
                reason: Strings.ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND
            };
        }

        return {
            functionName: token.string,
            reason: null
        };
    }

    /**
     * @private
     * For unit and performance tests. Allows lookup by function name instead of editor offset
     * without constructing an inline editor.
     *
     * @param {!string} functionName
     * @return {$.Promise} a promise that will be resolved with an array of function offset information
     */
    function _findInProject(functionName) {
        var result = new $.Deferred();

        PerfUtils.markStart(PerfUtils.JAVASCRIPT_FIND_FUNCTION);

        function _nonBinaryFileFilter(file) {
            return !LanguageManager.getLanguageForPath(file.fullPath).isBinary();
        }

        ProjectManager.getAllFiles(_nonBinaryFileFilter)
            .done(function (files) {
                JSUtils.findMatchingFunctions(functionName, files)
                    .done(function (functions) {
                        PerfUtils.addMeasurement(PerfUtils.JAVASCRIPT_FIND_FUNCTION);
                        result.resolve(functions);
                    })
                    .fail(function () {
                        PerfUtils.finalizeMeasurement(PerfUtils.JAVASCRIPT_FIND_FUNCTION);
                        result.reject();
                    });
            })
            .fail(function () {
                result.reject();
            });

        return result.promise();
    }

    /**
     * @private
     * For unit and performance tests. Allows lookup by function name instead of editor offset .
     *
     * @param {!Editor} hostEditor
     * @param {!string} functionName
     * @return {?$.Promise} synchronously resolved with an InlineWidget, or
     *         {string} if js other than function is detected at pos, or
     *         null if we're not ready to provide anything.
     */
    function _createInlineEditor(hostEditor, functionName) {
        // Use Tern jump-to-definition helper, if it's available, to find InlineEditor target.
        var helper = brackets._jsCodeHintsHelper;
        if (helper === null) {
            return null;
        }

        var result = new $.Deferred();
        PerfUtils.markStart(PerfUtils.JAVASCRIPT_INLINE_CREATE);

        var response = helper();
        if (response.hasOwnProperty("promise")) {
            response.promise.done(function (jumpResp) {
                var resolvedPath = jumpResp.fullPath;
                if (resolvedPath) {

                    // Tern doesn't always return entire function extent.
                    // Use QuickEdit search now that we know which file to look at.
                    var fileInfos = [];
                    fileInfos.push({name: jumpResp.resultFile, fullPath: resolvedPath});
                    JSUtils.findMatchingFunctions(functionName, fileInfos, true)
                        .done(function (functions) {
                            if (functions && functions.length > 0) {
                                var jsInlineEditor = new MultiRangeInlineEditor(functions);
                                jsInlineEditor.load(hostEditor);

                                PerfUtils.addMeasurement(PerfUtils.JAVASCRIPT_INLINE_CREATE);
                                result.resolve(jsInlineEditor);
                            } else {
                                // No matching functions were found
                                PerfUtils.addMeasurement(PerfUtils.JAVASCRIPT_INLINE_CREATE);
                                result.reject();
                            }
                        })
                        .fail(function () {
                            PerfUtils.addMeasurement(PerfUtils.JAVASCRIPT_INLINE_CREATE);
                            result.reject();
                        });

                } else {        // no result from Tern.  Fall back to _findInProject().

                    _findInProject(functionName).done(function (functions) {
                        if (functions && functions.length > 0) {
                            var jsInlineEditor = new MultiRangeInlineEditor(functions);
                            jsInlineEditor.load(hostEditor);

                            PerfUtils.addMeasurement(PerfUtils.JAVASCRIPT_INLINE_CREATE);
                            result.resolve(jsInlineEditor);
                        } else {
                            // No matching functions were found
                            PerfUtils.addMeasurement(PerfUtils.JAVASCRIPT_INLINE_CREATE);
                            result.reject();
                        }
                    }).fail(function () {
                        PerfUtils.finalizeMeasurement(PerfUtils.JAVASCRIPT_INLINE_CREATE);
                        result.reject();
                    });
                }

            }).fail(function () {
                PerfUtils.finalizeMeasurement(PerfUtils.JAVASCRIPT_INLINE_CREATE);
                result.reject();
            });

        }

        return result.promise();
    }

    /**
     * This function is registered with EditorManager as an inline editor provider. It creates an inline editor
     * when the cursor is on a JavaScript function name, finds all functions that match the name
     * and shows (one/all of them) in an inline editor.
     *
     * @param {!Editor} editor
     * @param {!{line:number, ch:number}} pos
     * @return {$.Promise} a promise that will be resolved with an InlineWidget
     *      or null if we're not ready to provide anything.
     */
    function javaScriptFunctionProvider(hostEditor, pos) {
        // Only provide a JavaScript editor when cursor is in JavaScript content
        if (hostEditor.getModeForSelection() !== "javascript") {
            return null;
        }

        // Only provide JavaScript editor if the selection is within a single line
        var sel = hostEditor.getSelection();
        if (sel.start.line !== sel.end.line) {
            return null;
        }

        // Always use the selection start for determining the function name. The pos
        // parameter is usually the selection end.
        var functionResult = _getFunctionName(hostEditor, sel.start);
        if (!functionResult.functionName) {
            return functionResult.reason || null;
        }

        return _createInlineEditor(hostEditor, functionResult.functionName);
    }

    // init
    EditorManager.registerInlineEditProvider(javaScriptFunctionProvider);
    PerfUtils.createPerfMeasurement("JAVASCRIPT_INLINE_CREATE", "JavaScript Inline Editor Creation");
    PerfUtils.createPerfMeasurement("JAVASCRIPT_FIND_FUNCTION", "JavaScript Find Function");

    // for unit tests only
    exports.javaScriptFunctionProvider  = javaScriptFunctionProvider;
    exports._createInlineEditor         = _createInlineEditor;
    exports._findInProject              = _findInProject;
});

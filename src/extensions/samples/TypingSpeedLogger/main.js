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
/*global define, brackets, window */

define(function (require, exports, module) {
    "use strict";

    var EditorManager   = brackets.getModule("editor/EditorManager"),
        PerfUtils       = brackets.getModule("utils/PerfUtils");

    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // shim layer with setTimeout fallback
    var requestAnimFrame = (function () {
        return window.requestAnimationFrame    ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    }());

    var STRING_FIRSTPAINT        = "Typing Speed: First repaint",
        STRING_PAINTBEFORECHANGE = "Typing Speed: Paint before DOM update",
        STRING_ONCHANGE          = "Typing Speed: DOM update complete",
        STRING_PAINTAFTERCHANGE  = "Typing Speed: Paint after DOM update";

    function _getInputField(editor) {
        return editor._codeMirror.getInputField();
    }

    /**
     * Installs input event handler on the current editor (full or inline).
     */
    function initTypingSpeedLogging() {
        var editor = null,
            inputField = null,
            inProgress = false;

        var inputChangedHandler = function () {
            // CodeMirror's fastPoll will batch up input events into a consolidated change
            if (inProgress) {
                return;
            }

            inProgress = true;

            // use a single markStart call so all start times are the same
            PerfUtils.markStart([
                STRING_FIRSTPAINT,
                STRING_PAINTBEFORECHANGE,
                STRING_ONCHANGE,
                STRING_PAINTAFTERCHANGE
            ]);

            var repaintBeforeChangeHandler = function () {
                if (PerfUtils.isActive(STRING_FIRSTPAINT)) {
                    PerfUtils.addMeasurement(STRING_FIRSTPAINT);
                }

                if (PerfUtils.isActive(STRING_ONCHANGE)) {
                    // don't know which paint event will be the last one,
                    // so keep updating measurement until we hit onChange
                    PerfUtils.updateMeasurement(STRING_PAINTBEFORECHANGE);
                    requestAnimFrame(repaintBeforeChangeHandler);
                }
            };

            var repaintAfterChangeHandler = function () {
                PerfUtils.addMeasurement(STRING_PAINTAFTERCHANGE);

                // need to tell PerfUtils that we are done updating this measurement
                PerfUtils.finalizeMeasurement(STRING_PAINTBEFORECHANGE);

                inProgress = false;
            };

            var onChangeHandler = function (event, editor, change) {
                PerfUtils.addMeasurement(STRING_ONCHANGE);
                editor.off("change.typingSpeedLogger", onChangeHandler);

                requestAnimFrame(repaintAfterChangeHandler);
            };

            requestAnimFrame(repaintBeforeChangeHandler);
            editor.on("change.typingSpeedLogger", onChangeHandler);
        };

        var updateFocusedEditor = function (focusedEditor) {
            if (editor) {
                inputField.removeEventListener("input", inputChangedHandler, true);
            }

            if (focusedEditor) {
                editor = focusedEditor;
                inputField = _getInputField(focusedEditor);

                // Listen for input changes in the capture phase, before
                // CodeMirror's event handling.
                inputField.addEventListener("input", inputChangedHandler, true);
            }
        };

        EditorManager.on("activeEditorChange", function (event, focusedEditor) {
            updateFocusedEditor(focusedEditor);
        });
        updateFocusedEditor(EditorManager.getFocusedEditor());
    }

    (function () {
        initTypingSpeedLogging();
    }());
});

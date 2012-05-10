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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    'use strict';

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
    
    function KeystrokeData(init) {
        init = init || 0;
        this.input = init;
        this.firstPaint = init;
        this.paintBeforeChange = init;
        this.onChange = init;
        this.paintAfterChange = init;
    }
    
    var min,
        sum,
        avg,
        max,
        charCount, /* using charCount instead of inputEventCount will artificially lower metrics */
        inputEventCount,
        perfData = PerfUtils.perfData;
    
    function _writePerfData(metricName, propName, recent) {
        perfData[metricName] = min[propName]
            + " / " + avg[propName]
            + " / " + max[propName]
            + " / " + recent[propName];
    }
    
    function _updateKeystrokeStats(data) {
        min.firstPaint = Math.min(min.firstPaint, data.firstPaint);
        min.paintBeforeChange = Math.min(min.paintBeforeChange, data.paintBeforeChange);
        min.onChange = Math.min(min.onChange, data.onChange);
        min.paintAfterChange = Math.min(min.paintAfterChange, data.paintAfterChange);
        
        sum.firstPaint += data.firstPaint;
        sum.paintBeforeChange += data.paintBeforeChange;
        sum.onChange += data.onChange;
        sum.paintAfterChange += data.paintAfterChange;
        
        avg.firstPaint = Math.round(sum.firstPaint / inputEventCount);
        avg.paintBeforeChange = Math.round(sum.paintBeforeChange / inputEventCount);
        avg.onChange = Math.round(sum.onChange / inputEventCount);
        avg.paintAfterChange = Math.round(sum.paintAfterChange / inputEventCount);
        
        max.firstPaint = Math.max(max.firstPaint, data.firstPaint);
        max.paintBeforeChange = Math.max(max.paintBeforeChange, data.paintBeforeChange);
        max.onChange = Math.max(max.onChange, data.onChange);
        max.paintAfterChange = Math.max(max.paintAfterChange, data.paintAfterChange);
        
        _writePerfData("Typing Speed: First repaint (min / avg / max / recent)", "firstPaint", data);
        _writePerfData("Typing Speed: Paint before DOM update", "paintBeforeChange", data);
        _writePerfData("Typing Speed: DOM update complete", "onChange", data);
        _writePerfData("Typing Speed: Paint after DOM update", "paintAfterChange", data);
    }
    
    function _getInputField(editor) {
        return editor._codeMirror.getInputField();
    }
    
    function resetTypingSpeedLogs() {
        min = new KeystrokeData(Number.POSITIVE_INFINITY);
        sum = new KeystrokeData(0);
        avg = new KeystrokeData(0);
        max = new KeystrokeData(Number.NEGATIVE_INFINITY);
        inputEventCount = 0;
    }
    
    /**
     * Installs input event handler on the current editor (full or inline).
     */
    function initTypingSpeedLogging() {
        var editor = null,
            inputField = null,
            inProgress = false;
        
        resetTypingSpeedLogs();
        
        var inputChangedHandler = function () {
            // CodeMirror's fastPoll will batch up input events into a consolidated change
            if (inProgress) {
                return;
            }
            
            inProgress = true;
            
            // Since input events are batched, inputEventCount isn't 1:1 with actual input events.
            inputEventCount++;
            
            var data = new KeystrokeData(0);
            data.input = Date.now();
        
            var repaintBeforeChangeHandler = function () {
                if (data.firstPaint === 0) {
                    data.firstPaint = Date.now() - data.input;
                }
                
                // keep logging until we hit onChange
                if (data.onChange === 0) {
                    data.paintBeforeChange = Date.now() - data.input;
                    requestAnimFrame(repaintBeforeChangeHandler);
                }
            };
            
            var repaintAfterChangeHandler = function () {
                data.paintAfterChange = Date.now() - data.input;
                
                inProgress = false;
                
                // we have all the data for this input sequence. compute min/avg/max.
                _updateKeystrokeStats(data);
            };
        
            var onChangeHandler = function (event, editor, change) {
                var textChangesLen = change.text.length,
                    i = 0;
                
                data.onChange = Date.now() - data.input;
                $(editor).off("change.typingSpeedLogger", onChangeHandler);
                
                for (i = 0; i < textChangesLen; i++) {
                    charCount += change.text[i].length;
                }
                
                requestAnimFrame(repaintAfterChangeHandler);
            };
            
            requestAnimFrame(repaintBeforeChangeHandler);
            $(editor).on("change.typingSpeedLogger", onChangeHandler);
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
        
        $(EditorManager).on("focusedEditorChange", function (event, focusedEditor) {
            updateFocusedEditor(focusedEditor);
        });
        updateFocusedEditor(EditorManager.getFocusedEditor());
    }
    
    (function () {
        initTypingSpeedLogging();
    }());
    
    exports.resetTypingSpeedLogs = resetTypingSpeedLogs;
});

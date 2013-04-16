/*
 * Copyright (c) 2013
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
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window, tinycolor, Chainvas */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var AppInit             = brackets.getModule("utils/AppInit"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        CSSProperties       = require("text!CSSProperties.json"),
        properties          = JSON.parse(CSSProperties);
    
    /**
     * @constructor
     */
    function MyHints() {}

    /**
     * Determines whether font hints are available in the current editor
     * context.
     *
     * @param {Editor} editor
     * A non-null editor object for the active window.
     *
     * @param {String} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {Boolean}
     * Determines whether the current provider is able to provide hints for
     * the given editor context and, in case implicitChar is non- null,
     * whether it is appropriate to do so.
     */
    MyHints.prototype.hasHints = function (editor, implicitChar) {
        this.editor = editor;
        var cursor = this.editor.getCursorPos();

        this.info = CSSUtils.getInfoAtPos(editor, cursor);

        // This prototype only handles a css value
        if (this.info.context === CSSUtils.PROP_VALUE && properties[this.info.name]) {
            return true;
        }

        return false;
    };

    /**
     * Returns a list of availble font hints, if possible, for the current
     * editor context.
     *
     * @return {Object<hints: Array<jQuery.Object>, match: String,
     *      selectInitial: Boolean>}
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides 1. a sorted array formatted hints; 2. a
     * null string match to indicate that the hints are already formatted;
     * and 3. a boolean that indicates whether the first result, if one exists,
     * should be selected by default in the hint list window.
     */
    MyHints.prototype.getHints = function (key) {
        this.info = CSSUtils.getInfoAtPos(this.editor, this.editor.getCursorPos());

        var needle = this.info.name,
            valueNeedle = "",
            context = this.info.context,
            result,
            selectInitial = false;

        if (context === CSSUtils.PROP_VALUE) {
            if (!properties[needle]) {
                return null;
            }

            // Cursor is in an existing property value or partially typed value
            if (!this.info.isNewItem && this.info.index !== -1) {
                valueNeedle = this.info.values[this.info.index].trim();
                valueNeedle = valueNeedle.substr(0, this.info.offset);
            }

            result = $.map(properties[needle].values, function (pvalue, pindex) {
                if (typeof pvalue !== "string" || pvalue.indexOf(valueNeedle) === 0) {
                    return pvalue;
                }
            }).sort();

            // TODO: should dialog item be sorted? filtered?
            return {
                hints: result,
                match: valueNeedle,
                selectInitial: selectInitial
            };
        }

        return null;
    };

    /**
     * Inserts a given font hint into the current editor context.
     *
     * @param {jQuery.Object} completion
     * The hint to be inserted into the editor context.
     *
     * @return {Boolean}
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    MyHints.prototype.insertHint = function (completion) {
        var offset = this.info.offset,
            cursor = this.editor.getCursorPos(),
            start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            keepHints = false,
            newCursor,
            ctx;

        if (this.info.context !== CSSUtils.PROP_VALUE) {
            return false;
        }

        start.line = end.line = cursor.line;
        start.ch = cursor.ch - offset;
        end.ch = start.ch;

        // HACK (tracking adobe/brackets#1688): We talk to the private CodeMirror instance
        // directly to replace the range instead of using the Document, as we should. The
        // reason is due to a flaw in our current document synchronization architecture when
        // inline editors are open.
        this.editor._codeMirror.replaceRange(completion, start, end);

        return false;
    };

    function handleEdgeWebFonts() {
        return window.prompt("Font name:");
    }

    CodeHintManager.registerDialog("((edge-web-fonts))", handleEdgeWebFonts);
    
    AppInit.appReady(function () {
        var myHints = new MyHints();
        CodeHintManager.registerHintProvider(myHints, ["css"], 1);

        // For unit testing
//        exports.cssPropHintProvider = cssPropHints;
    });
});

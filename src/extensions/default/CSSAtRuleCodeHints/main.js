/*
 * Copyright (c) 2017 - present Adobe Systems Incorporated. All rights reserved.
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

    // Load dependent modules
    var AppInit         = brackets.getModule("utils/AppInit"),
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        AtRulesText     = require("text!AtRulesDef.json"),
        AtRules         = JSON.parse(AtRulesText);


    /**
     * @constructor
     */
    function AtRuleHints() {
    }

    // As we are only going to provide @rules name hints
    // we should claim that we don't have hints for anything else
    AtRuleHints.prototype.hasHints = function (editor, implicitChar) {
        var pos = editor.getCursorPos(),
            token = editor._codeMirror.getTokenAt(pos),
            cmState;

        this.editor = editor;

        if (token.state.base && token.state.base.localState) {
            cmState = token.state.base.localState;
        } else {
            cmState = token.state;
        }

        // Check if we are at '@' rule 'def' context
        if ((token.type === "def" && cmState.context.type === "at")
                || (token.type === "variable-2" && (cmState.context.type === "top" || cmState.context.type === "block"))) {
            this.filter = token.string;
            return true;
        } else {
            this.filter = null;
            return false;
        }
    };

    AtRuleHints.prototype.getHints = function (implicitChar) {
        var pos     = this.editor.getCursorPos(),
            token   = this.editor._codeMirror.getTokenAt(pos);

        this.filter = token.string;
        this.token = token;
        
        if (!this.filter) {
            return null;
        }

        // Filter the property list based on the token string
        var result = Object.keys(AtRules).filter(function (key) {
            if (key.indexOf(token.string) === 0) {
                return key;
            }
        }).sort();

        return {
            hints: result,
            match: this.filter,
            selectInitial: true,
            defaultDescriptionWidth: true,
            handleWideResults: false
        };
    };


    /**
     * Inserts a given @<rule> hint into the current editor context.
     *
     * @param {string} completion
     * The hint to be inserted into the editor context.
     *
     * @return {boolean}
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    AtRuleHints.prototype.insertHint = function (completion) {
        var cursor = this.editor.getCursorPos();
        this.editor.document.replaceRange(completion, {line: cursor.line, ch: this.token.start}, {line: cursor.line, ch: this.token.end});
        return false;
    };

    AppInit.appReady(function () {
        // Register code hint providers
        var restrictedBlockHints = new AtRuleHints();
        CodeHintManager.registerHintProvider(restrictedBlockHints, ["css", "less", "scss"], 0);
        
        // For unit testing
        exports.restrictedBlockHints = restrictedBlockHints;
    });
});

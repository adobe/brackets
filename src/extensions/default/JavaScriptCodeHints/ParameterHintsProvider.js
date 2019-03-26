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

    var ScopeManager = brackets.getModule("JSUtils/ScopeManager"),
        OVERWRITE_EXISTING_HINT = false;
    
    function JSParameterHintsProvider() {
        this.hintState = {};
        this.hintStack = [];
        this.preserveHintStack; // close a function hint without clearing stack
        this.session; // current editor session, updated by main
    }
        
    /**
     * Update the current session for use by the Function Hint Manager.
     *
     * @param {Session} value - current session.
     */
    JSParameterHintsProvider.prototype.setSession = function (value) {
        this.session = value;
    }

    /**
     * Test if a function hint is being displayed.
     *
     * @return {boolean} - true if a function hint is being displayed, false
     * otherwise.
     */
    JSParameterHintsProvider.prototype.isHintDisplayed = function () {
        return this.hintState.visible === true;
    }

    /**
     * Save the state of the current hint. Called when popping up a parameter hint
     * for a parameter, when the parameter already part of an existing parameter
     * hint.
     */
    JSParameterHintsProvider.prototype.pushHintOnStack = function () {
        this.hintStack.push(hintState);
    }

    /**
     * Restore the state of the previous function hint.
     *
     * @return {boolean} - true the a parameter hint has been popped, false otherwise.
     */
    JSParameterHintsProvider.prototype.popHintFromStack = function () {
        if (this.hintStack.length > 0) {
            this.hintState = this.hintStack.pop();
            this.hintState.visible = false;
            return true;
        }

        return false;
    }

    /**
     * Reset the function hint stack.
     */
    JSParameterHintsProvider.prototype.clearFunctionHintStack = function () {
        this.hintStack = [];
    }

    /**
     * Test if the function call at the cursor is different from the currently displayed
     * function hint.
     *
     * @param {{line:number, ch:number}} functionCallPos - the offset of the function call.
     * @return {boolean}
     */
    JSParameterHintsProvider.prototype.hasFunctionCallPosChanged = function (functionCallPos) {
        var oldFunctionCallPos = this.hintState.functionCallPos;
        return (oldFunctionCallPos === undefined ||
            oldFunctionCallPos.line !== functionCallPos.line ||
            oldFunctionCallPos.ch !== functionCallPos.ch);
    }

    /**
     * Dismiss the function hint.
     *
     */
    JSParameterHintsProvider.prototype.cleanHintState = function () {
        if (this.hintState.visible) {
            if (!this.preserveHintStack) {
                this.clearFunctionHintStack();
            }
        }
    }

    /**
     * Pop up a function hint on the line above the caret position.
     *
     * @param {boolean=} pushExistingHint - if true, push the existing hint on the stack. Default is false, not
     * to push the hint.
     * @param {string=} hint - function hint string from tern.
     * @param {{inFunctionCall: boolean, functionCallPos:
     * {line: number, ch: number}}=} functionInfo -
     * if the functionInfo is already known, it can be passed in to avoid
     * figuring it out again.
     * @return {jQuery.Promise} - The promise will not complete until the
     *      hint has completed. Returns null, if the function hint is already
     *      displayed or there is no function hint at the cursor.
     *
     */
    JSParameterHintsProvider.prototype._getParameterHint = function (pushExistingHint, hint, functionInfo) {
        var result = $.Deferred();
        functionInfo = functionInfo || this.session.getFunctionInfo();
        if (!functionInfo.inFunctionCall) {
            this.cleanHintState();
            result.reject(null);
        }

        if (this.hasFunctionCallPosChanged(functionInfo.functionCallPos)) {

            var pushHint = pushExistingHint && this.isHintDisplayed();
            if (pushHint) {
                this.pushHintOnStack();
                this.preserveHintStack = true;
            }

            this.cleanHintState();
            this.preserveHintStack = false;
        } else if (this.isHintDisplayed()) {
            result.reject(null);
        }

        this.hintState.functionCallPos = functionInfo.functionCallPos;

        var request = null;
        if (!hint) {
            request = ScopeManager.requestParameterHint(this.session, functionInfo.functionCallPos);
        } else {
            this.session.setFnType(hint);
            request = $.Deferred();
            request.resolveWith(null, [hint]);
        }
        
        var self = this;
        request.done(function (fnType) {
            var hints = self.session.getParameterHint(functionInfo.functionCallPos);
            result.resolve(hints);
        }).fail(function () {
            hintState = {};
            result.reject(null);
        });

        return result;
    }

    JSParameterHintsProvider.prototype.hasParameterHints = function () {
        return true;
    };

    JSParameterHintsProvider.prototype.getParameterHints = function (onCursorActivity) {
        var functionInfo = this.session.getFunctionInfo(),
            result = null;
        
        if (onCursorActivity) {
            if (functionInfo.inFunctionCall) {
                // If in a different function hint, then dismiss the old one and
                // display the new one if there is one on the stack
                if (this.hasFunctionCallPosChanged(functionInfo.functionCallPos)) {
                    if (this.popHintFromStack()) {
                        var poppedFunctionCallPos = this.hintState.functionCallPos,
                            currentFunctionCallPos = this.functionInfo.functionCallPos;

                        if (poppedFunctionCallPos.line === currentFunctionCallPos.line &&
                            poppedFunctionCallPos.ch === currentFunctionCallPos.ch) {
                            this.preserveHintStack = true;
                            result = this._getParameterHint(OVERWRITE_EXISTING_HINT,
                                this.hintState.fnType, functionInfo);
                            this.preserveHintStack = false;
                            return result;
                        }
                    } else {
                        this.cleanHintState();
                    }
                }

                var hints = this.session.getParameterHint(functionInfo.functionCallPos);
                return $.Deferred().resolve(hints);
            }

            this.cleanHintState();
            return $.Deferred().reject(null);
        } else {
            if (functionInfo.inFunctionCall) {
                var token = this.session.getToken();

                if (token && token.string === "(") {
                    return this._getParameterHint();
                }
            } else {
                this.cleanHintState();
            }
            return $.Deferred().reject(null);
        }
    };

    exports.JSParameterHintsProvider = JSParameterHintsProvider;
});

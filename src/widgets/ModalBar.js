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
/*global define, $, brackets, window */

/**
 * A "modal bar" component. This is a lightweight replacement for modal dialogs that
 * appears at the top of the editor area for operations like Find and Quick Open.
 */
define(function (require, exports, module) {
    "use strict";
    
    var EditorManager  = require("editor/EditorManager"),
        KeyEvent       = require("utils/KeyEvent"),
        AnimationUtils = require("utils/AnimationUtils");

    /**
     * @constructor
     *
     * Creates a modal bar whose contents are the given template.
     * @param {string} template The HTML contents of the modal bar.
     * @param {boolean} autoClose If true, then close the dialog if the user hits RETURN
     *      in the first input field. Dispatches jQuery events for these cases:
     *      "commit" on RETURN and "close" always. 
     * @param {boolean} animate If true (the default), animate the dialog closed, otherwise
     *      close it immediately.
     */
    function ModalBar(template, autoClose, animate) {
        if (animate === undefined) {
            animate = true;
        }
        
        this._handleInputKeydown = this._handleInputKeydown.bind(this);
        this._handleFocusChange = this._handleFocusChange.bind(this);
        
        this._$root = $("<div class='modal-bar'/>")
            .html(template)
            .insertBefore("#editor-holder");

        if (animate) {
            this._$root.addClass("popout offscreen");
            // Forcing the renderer to do a layout, which will cause it to apply the transform for the "offscreen"
            // class, so it will animate when you remove the class.
            window.getComputedStyle(this._$root.get(0)).getPropertyValue("top");
            this._$root.removeClass("popout offscreen");
        }
        
        // If something *other* than an editor (like another modal bar) has focus, set the focus 
        // to the editor here, before opening up the new modal bar. This ensures that the old
        // focused item has time to react and close before the new modal bar is opened.
        // See bugs #4287 and #3424
        if (!EditorManager.getFocusedEditor()) {
            EditorManager.focusEditor();
        }
        
        if (autoClose) {
            this._autoClose = true;
            var $firstInput = this._getFirstInput()
                .on("keydown", this._handleInputKeydown);
            window.document.body.addEventListener("focusin", this._handleFocusChange, true);
                
            // Set focus to the first input field, or the first button if there is no input field.
            if ($firstInput.length > 0) {
                $firstInput.focus();
            } else {
                $("button", this._$root).first().focus();
            }
        }
        
        // Preserve scroll position of the current full editor across the editor refresh, adjusting for the 
        // height of the modal bar so the code doesn't appear to shift if possible.
        var fullEditor = EditorManager.getCurrentFullEditor(),
            scrollPos;
        if (fullEditor) {
            scrollPos = fullEditor.getScrollPos();
        }
        EditorManager.resizeEditor();
        if (fullEditor) {
            fullEditor._codeMirror.scrollTo(scrollPos.x, scrollPos.y + this.height());
        }
    }
    
    /**
     * A jQuery object containing the root node of the ModalBar.
     */
    ModalBar.prototype._$root = null;
    
    /**
     * True if this ModalBar is set to autoclose.
     */
    ModalBar.prototype._autoClose = false;
    
    /**
     * Returns a jQuery object for the first input field in the dialog. Will be 0-length if there is none.
     */
    ModalBar.prototype._getFirstInput = function () {
        return $("input[type='text']", this._$root).first();
    };
    
    /**
     * @return {number} Height of the modal bar in pixels, if open.
     */
    ModalBar.prototype.height = function () {
        return this._$root.outerHeight();
    };
    
    /**
     * Prepares the ModalBar for closing by popping it out of the main flow and resizing/
     * rescrolling the Editor to maintain its current apparent code position. Useful if
     * you want to do that as a separate operation from actually animating the ModalBar
     * closed and removing it (for example, if you need to switch full editors in between).
     * If you don't call this explicitly, it will get called at the beginning of `close()`.
     *
     * @param {boolean=} restoreScrollPos If true (the default), adjust the scroll position
     *     of the editor to account for the ModalBar disappearing. If not set, the caller
     *     should do it immediately on return of this function (before the animation completes),
     *     because the editor will already have been resized.
     */
    ModalBar.prototype.prepareClose = function (restoreScrollPos) {
        if (restoreScrollPos === undefined) {
            restoreScrollPos = true;
        }
        
        this._$root.addClass("popout");
        
        // Preserve scroll position of the current full editor across the editor refresh, adjusting for the 
        // height of the modal bar so the code doesn't appear to shift if possible.
        var fullEditor = EditorManager.getCurrentFullEditor(),
            barHeight,
            scrollPos;
        if (restoreScrollPos && fullEditor) {
            barHeight = this.height();
            scrollPos = fullEditor.getScrollPos();
        }
        EditorManager.resizeEditor();
        if (restoreScrollPos && fullEditor) {
            fullEditor._codeMirror.scrollTo(scrollPos.x, scrollPos.y - barHeight);
        }
    };
    
    /**
     * Closes the modal bar and returns focus to the active editor. Returns a promise that is
     * resolved when the bar is fully closed and the container is removed from the DOM.
     * @param {boolean=} restoreScrollPos If true (the default), adjust the scroll position
     *     of the editor to account for the ModalBar disappearing. If not set, the caller
     *     should do it immediately on return of this function (before the animation completes),
     *     because the editor will already have been resized. Note that this is ignored if
     *     `prepareClose()` was already called (you need to pass the parameter to that
     *     function if you call it first).
     * @param {boolean=} animate If true (the default), animate the closing of the ModalBar,
     *     otherwise close it immediately.
     * @return {$.Promise} promise resolved when close is finished
     */
    ModalBar.prototype.close = function (restoreScrollPos, animate) {
        var result = new $.Deferred(),
            self = this;

        if (restoreScrollPos === undefined) {
            restoreScrollPos = true;
        }
        if (animate === undefined) {
            animate = true;
        }
        
        // If someone hasn't already called `prepareClose()` to pop the ModalBar out of the flow
        // and resize the editor, then do that here.
        if (!this._$root.hasClass("popout")) {
            this.prepareClose(restoreScrollPos);
        }

        if (this._autoClose) {
            window.document.body.removeEventListener("focusin", this._handleFocusChange, true);
        }

        $(this).triggerHandler("close");
        
        function doRemove() {
            self._$root.remove();
            result.resolve();
        }
        
        if (animate) {
            AnimationUtils.animateUsingClass(this._$root.get(0), "offscreen")
                .done(doRemove);
        } else {
            doRemove();
        }
        
        EditorManager.focusEditor();

        return result.promise();
    };
    
    /**
     * If autoClose is set, handles the RETURN/ESC keys in the input field.
     */
    ModalBar.prototype._handleInputKeydown = function (e) {
        if (e.keyCode === KeyEvent.DOM_VK_RETURN || e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
            e.stopPropagation();
            e.preventDefault();
            
            var value = this._getFirstInput().val();
            this.close();
            if (e.keyCode === KeyEvent.DOM_VK_RETURN) {
                $(this).triggerHandler("commit", [value]);
            }
        }
    };
    
    /**
     * If autoClose is set, detects when something other than the modal bar is getting focus and
     * dismisses the modal bar.
     */
    ModalBar.prototype._handleFocusChange = function (e) {
        if (!$.contains(this._$root.get(0), e.target)) {
            var value = this._getFirstInput().val();
            this.close();
        }
    };
    
    /**
     * @return {jQueryObject} A jQuery object representing the root of the ModalBar.
     */
    ModalBar.prototype.getRoot = function () {
        return this._$root;
    };
    
    exports.ModalBar = ModalBar;
});
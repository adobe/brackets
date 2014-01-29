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
/*global define, $, brackets, window, Mustache */

/**
 * Utilities for creating and managing standard modal dialogs.
 */
define(function (require, exports, module) {
    "use strict";
    
    require("utils/Global");

    var KeyBindingManager = require("command/KeyBindingManager"),
        KeyEvent          = require("utils/KeyEvent"),
        NativeApp         = require("utils/NativeApp"),
        Strings           = require("strings"),
        DialogTemplate    = require("text!htmlContent/dialog-template.html");
    
    /**
     * Dialog Buttons IDs
     * @const {string}
     */
    var DIALOG_BTN_CANCEL           = "cancel",
        DIALOG_BTN_OK               = "ok",
        DIALOG_BTN_DONTSAVE         = "dontsave",
        DIALOG_BTN_SAVE_AS          = "save_as",
        DIALOG_CANCELED             = "_canceled",
        DIALOG_BTN_DOWNLOAD         = "download";
    
    /**
     * Dialog Buttons Class Names
     * @const {string}
     */
    var DIALOG_BTN_CLASS_PRIMARY    = "primary",
        DIALOG_BTN_CLASS_NORMAL     = "",
        DIALOG_BTN_CLASS_LEFT       = "left";
    
    /** @type {number} The z-index used for the dialogs. Each new dialog increase this number by 2 */
    var zIndex = 1050;

    /**
     * @private
     * Dismises a modal dialog
     * @param {$.Element} $dlg
     * @param {string} buttonId
     */
    function _dismissDialog($dlg, buttonId) {
        $dlg.data("buttonId", buttonId);
        $dlg.modal("hide");
    }
    
    /**
     * @private
     * If autoDismiss is true, then dismisses the dialog. Otherwise just raises an event that the
     * given button was clicked.
     * @param {$.Element} $dlg The dialog element to be dismissed.
     * @param {string} buttonId The ID of the button that was clicked.
     * @param {boolean} autoDismiss Whether to autodismiss the dialog on a button click.
     */
    function _processButton($dlg, buttonId, autoDismiss) {
        if (autoDismiss) {
            _dismissDialog($dlg, buttonId);
        } else {
            $dlg.triggerHandler("buttonClick", buttonId);
        }
    }

    /**
     * @private
     * Returns true if the modal dialog has a button with the given ID
     * @param {$.Element} $dlg
     * @param {string} buttonId
     * @return {boolean}
     */
    function _hasButton($dlg, buttonId) {
        return ($dlg.find("[data-button-id='" + buttonId + "']").length > 0);
    }


    /**
     * @private
     * Handles the use of Tab so that it stays inside the Dialog
     * @param {$.Event} event
     * @param {$.Element} $dlg
     */
    function _handleTab(event, $dlg) {
        var $inputs = $(":input:enabled, a", $dlg).filter(":visible");

        if ($(event.target).closest($dlg).length) {
            // If it's the first or last tabbable element, focus the last/first element
            if ((!event.shiftKey && event.target === $inputs[$inputs.length - 1]) ||
                    (event.shiftKey && event.target === $inputs[0])) {
                $inputs.filter(event.shiftKey ? ":last" : ":first").focus();
                event.preventDefault();

            // If there is no element to focus, don't let it focus outside of the dialog
            } else if (!$inputs.length) {
                event.preventDefault();
            }

        // If the focus left the dialog, focus the first element in the dialog
        } else {
            $inputs.first().focus();
            event.preventDefault();
        }
    }


    /**
     * Handles the keyDown event for the dialogs
     * @param {$.Event} e
     * @param {boolean} autoDismiss
     * @return {boolean}
     */
    var _keydownHook = function (e, autoDismiss) {
        var $primaryBtn     = this.find(".primary"),
            buttonId        = null,
            which           = String.fromCharCode(e.which),
            $focusedElement = this.find(".dialog-button:focus, a:focus");
        
        // There might be a textfield in the dialog's UI; don't want to mistake normal typing for dialog dismissal
        var inTextArea    = (e.target.tagName === "TEXTAREA"),
            inTypingField = inTextArea || ($(e.target).filter(":text, :password").length > 0);
        
        if (e.which === KeyEvent.DOM_VK_TAB) {
            _handleTab(e, this);
        } else if (e.which === KeyEvent.DOM_VK_ESCAPE) {
            buttonId = DIALOG_BTN_CANCEL;
        } else if (e.which === KeyEvent.DOM_VK_RETURN && !inTextArea) {  // enter key in single-line text input still dismisses
            // Click primary
            $primaryBtn.click();
        } else if (e.which === KeyEvent.DOM_VK_SPACE) {
            // Space bar on focused button or link
            $focusedElement.click();
        } else if (brackets.platform === "mac") {
            // CMD+D Don't Save
            if (e.metaKey && (which === "D")) {
                if (_hasButton(this, DIALOG_BTN_DONTSAVE)) {
                    buttonId = DIALOG_BTN_DONTSAVE;
                }
            // FIXME (issue #418) CMD+. Cancel swallowed by native shell
            } else if (e.metaKey && (e.which === KeyEvent.DOM_VK_PERIOD)) {
                buttonId = DIALOG_BTN_CANCEL;
            }
        } else { // if (brackets.platform === "win") {
            // 'N' Don't Save
            if (which === "N" && !inTypingField) {
                if (_hasButton(this, DIALOG_BTN_DONTSAVE)) {
                    buttonId = DIALOG_BTN_DONTSAVE;
                }
            }
        }
        
        if (buttonId) {
            _processButton(this, buttonId, autoDismiss);
        }
        
        // Stop any other global hooks from processing the event (but
        // allow it to continue bubbling if we haven't otherwise stopped it).
        return true;
    };
    
    
    
    /**
     * @constructor
     * @private
     *
     * @param {$.Element} $dlg The dialog jQuery element
     * @param {$.Promise} promise A promise that will be resolved with the ID of the clicked button when the dialog
     *     is dismissed. Never rejected.
     */
    function Dialog($dlg, promise) {
        this._$dlg    = $dlg;
        this._promise = promise;
    }
    
    /** @type {$.Element} The dialog jQuery element */
    Dialog.prototype.getElement = function () {
        return this._$dlg;
    };
    
    /** @type {$.Promise} The dialog promise */
    Dialog.prototype.getPromise = function () {
        return this._promise;
    };
    
    /**
     * Closes the dialog if is visible
     */
    Dialog.prototype.close = function () {
        if (this._$dlg.is(":visible")) {   // Bootstrap breaks if try to hide dialog that's already hidden
            _dismissDialog(this._$dlg, DIALOG_CANCELED);
        }
    };
    
    /**
     * Adds a done callback to the dialog promise
     */
    Dialog.prototype.done = function (callback) {
        this._promise.done(callback);
    };
    

    /**
     * Don't allow dialog to exceed viewport size
     */
    function setDialogMaxSize() {
        var maxWidth, maxHeight,
            $dlgs = $(".modal-inner-wrapper > .instance");

        // Verify 1 or more modal dialogs are showing
        if ($dlgs.length > 0) {
            maxWidth  = $("body").width();
            maxHeight = $("body").height();

            $dlgs.css({
                "max-width":  maxWidth,
                "max-height": maxHeight,
                "overflow":   "auto"
            });
        }
    }
    
    /**
     * Creates a new modal dialog from a given template.
     * The template can either be a string or a jQuery object representing a DOM node that is *not* in the current DOM.
     *
     * @param {string} template A string template or jQuery object to use as the dialog HTML.
     * @param {boolean=} autoDismiss Whether to automatically dismiss the dialog when one of the buttons
     *      is clicked. Default true. If false, you'll need to manually handle button clicks and the Esc
     *      key, and dismiss the dialog yourself when ready by calling `close()` on the returned dialog.
     * @return {Dialog}
     */
    function showModalDialogUsingTemplate(template, autoDismiss) {
        if (autoDismiss === undefined) {
            autoDismiss = true;
        }
        
        $("body").append("<div class='modal-wrapper'><div class='modal-inner-wrapper'></div></div>");

        var result    = $.Deferred(),
            promise   = result.promise(),
            $dlg      = $(template)
                .addClass("instance")
                .appendTo(".modal-inner-wrapper:last");

        // Don't allow dialog to exceed viewport size
        setDialogMaxSize();
        
        // Save the dialog promise for unit tests
        $dlg.data("promise", promise);

        var keydownHook = function (e) {
            return _keydownHook.call($dlg, e, autoDismiss);
        };

        // Pipe dialog-closing notification back to client code
        $dlg.one("hidden", function () {
            var buttonId = $dlg.data("buttonId");
            if (!buttonId) {    // buttonId will be undefined if closed via Bootstrap's "x" button
                buttonId = DIALOG_BTN_CANCEL;
            }
            
            // Let call stack return before notifying that dialog has closed; this avoids issue #191
            // if the handler we're triggering might show another dialog (as long as there's no
            // fade-out animation)
            window.setTimeout(function () {
                result.resolve(buttonId);
            }, 0);
            
            // Remove the dialog instance from the DOM.
            $dlg.remove();
            $(".modal-backdrop:last").addClass("last-backdrop");

            // Remove our global keydown handler.
            KeyBindingManager.removeGlobalKeydownHook(keydownHook);
            
            //Remove wrapper
            $(".modal-wrapper:last").remove();
        }).one("shown", function () {
            // Set focus to the default button
            var primaryBtn = $dlg.find(".primary");

            if (primaryBtn) {
                primaryBtn.focus();
            }

            // Push our global keydown handler onto the global stack of handlers.
            KeyBindingManager.addGlobalKeydownHook(keydownHook);
        });
        
        // Click handler for buttons
        $dlg.one("click", ".dialog-button", function (e) {
            _processButton($dlg, $(this).attr("data-button-id"), autoDismiss);
        });
        
        $(".last-backdrop").removeClass("last-backdrop");
        
        // Run the dialog
        $dlg
            .modal({
                backdrop: "static",
                show:     true,
                selector: ".modal-inner-wrapper:last",
                keyboard: false // handle the ESC key ourselves so we can deal with nested dialogs
            })
            // Updates the z-index of the modal dialog and the backdrop
            .css("z-index", zIndex + 1)
            .next()
            .css("z-index", zIndex)
            .addClass("last-backdrop");
        
        zIndex += 2;
        
        return (new Dialog($dlg, promise));
    }
    
    
    /**
     * Creates a new general purpose modal dialog using the default template and the template variables given
     * as parameters as described.
     *
     * @param {string} dlgClass A class name identifier for the dialog. Typically one of DefaultDialogs.*
     * @param {string=} title The title of the dialog. Can contain HTML markup. Defaults to "".
     * @param {string=} message The message to display in the dialog. Can contain HTML markup. Defaults to "".
     * @param {Array.<{className: string, id: string, text: string}>=} buttons An array of buttons where each button
     *      has a class, id and text property. The id is used in "data-button-id". Defaults to a single Ok button.
     *      Typically className is one of DIALOG_BTN_CLASS_*, id is one of DIALOG_BTN_*
     * @param {boolean=} autoDismiss Whether to automatically dismiss the dialog when one of the buttons
     *      is clicked. Default true. If false, you'll need to manually handle button clicks and the Esc
     *      key, and dismiss the dialog yourself when ready by calling `close()` on the returned dialog.
     * @return {Dialog}
     */
    function showModalDialog(dlgClass, title, message, buttons, autoDismiss) {
        var templateVars = {
            dlgClass: dlgClass,
            title:    title   || "",
            message:  message || "",
            buttons:  buttons || [{ className: DIALOG_BTN_CLASS_PRIMARY, id: DIALOG_BTN_OK, text: Strings.OK }]
        };
        var template = Mustache.render(DialogTemplate, templateVars);
        
        return showModalDialogUsingTemplate(template, autoDismiss);
    }
    
    /**
     * Immediately closes any dialog instances with the given class. The dialog callback for each instance will
     * be called with the special buttonId DIALOG_CANCELED (note: callback is run asynchronously).
     * @param {string} dlgClass The class name identifier for the dialog.
     * @param {string=} buttonId The button id to use when closing the dialog. Defaults to DIALOG_CANCELED
     */
    function cancelModalDialogIfOpen(dlgClass, buttonId) {
        $("." + dlgClass + ".instance").each(function () {
            if ($(this).is(":visible")) {   // Bootstrap breaks if try to hide dialog that's already hidden
                _dismissDialog($(this), buttonId || DIALOG_CANCELED);
            }
        });
    }
    
    window.addEventListener("resize", setDialogMaxSize);
    
    exports.DIALOG_BTN_CANCEL            = DIALOG_BTN_CANCEL;
    exports.DIALOG_BTN_OK                = DIALOG_BTN_OK;
    exports.DIALOG_BTN_DONTSAVE          = DIALOG_BTN_DONTSAVE;
    exports.DIALOG_BTN_SAVE_AS           = DIALOG_BTN_SAVE_AS;
    exports.DIALOG_CANCELED              = DIALOG_CANCELED;
    exports.DIALOG_BTN_DOWNLOAD          = DIALOG_BTN_DOWNLOAD;
    
    exports.DIALOG_BTN_CLASS_PRIMARY     = DIALOG_BTN_CLASS_PRIMARY;
    exports.DIALOG_BTN_CLASS_NORMAL      = DIALOG_BTN_CLASS_NORMAL;
    exports.DIALOG_BTN_CLASS_LEFT        = DIALOG_BTN_CLASS_LEFT;
    
    exports.showModalDialog              = showModalDialog;
    exports.showModalDialogUsingTemplate = showModalDialogUsingTemplate;
    exports.cancelModalDialogIfOpen      = cancelModalDialogIfOpen;
});

/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, brackets: false */

/**
 * Utilities for working with Deferred, Promise, and other asynchronous processes.
 */
define(function (require, exports, module) {
    'use strict';

    var DIALOG_BTN_CANCEL = "cancel",
        DIALOG_BTN_OK = "ok",
        DIALOG_BTN_DONTSAVE = "dontsave",
        DIALOG_CANCELED = "_canceled";
    
    // TODO: (issue #258) In future, we should templatize the HTML for the dialogs rather than having 
    // it live directly in the HTML.
    var DIALOG_ID_ERROR = "error-dialog",
        DIALOG_ID_SAVE_CLOSE = "save-close-dialog",
        DIALOG_ID_EXT_CHANGED = "ext-changed-dialog",
        DIALOG_ID_EXT_DELETED = "ext-deleted-dialog";

    function _dismissDialog(dlg, buttonId) {
        dlg.data("buttonId", buttonId);
        dlg.modal(true).hide();
    }
    
    function _hasButton(dlg, buttonId) {
        return dlg.find("[data-button-id='" + buttonId + "']");
    }
    
    /**
     * General purpose modal dialog. Assumes that:
     * -- the root tag of the dialog is marked with a unique class name (passed as dlgClass), as well as the
     *    classes "template modal hide".
     * -- the HTML for the dialog contains elements with "title" and "message" classes, as well as a number 
     *    of elements with "dialog-button" class, each of which has a "data-button-id".
     *
     * @param {string} dlgClass The class of the dialog node in the HTML.
     * @param {string} title The title of the error dialog. Can contain HTML markup.
     * @param {string} message The message to display in the error dialog. Can contain HTML markup.
     * @return {Deferred} a $.Deferred() that will be resolved with the ID of the clicked button when the dialog
     *     is dismissed. Never rejected.
     */
    function showModalDialog(dlgClass, title, message, callback) {
        var result = $.Deferred();
        
        // We clone the HTML rather than using it directly so that if two dialogs of the same
        // type happen to show up, they can appear at the same time. (This is an edge case that
        // shouldn't happen often, but we can't prevent it from happening since everything is
        // asynchronous.)
        var dlg = $("." + dlgClass + ".template")
            .clone()
            .removeClass("template")
            .addClass("instance")
            .appendTo(document.body);

        // Set title and message
        $(".dialog-title", dlg).html(title);
        $(".dialog-message", dlg).html(message);

        // Pipe dialog-closing notification back to client code
        dlg.one("hidden", function () {
            var buttonId = dlg.data("buttonId");
            if (!buttonId) {    // buttonId will be undefined if closed via Bootstrap's "x" button
                buttonId = DIALOG_BTN_CANCEL;
            }
            
            // Let call stack return before notifying that dialog has closed; this avoids issue #191
            // if the handler we're triggering might show another dialog (as long as there's no
            // fade-out animation)
            setTimeout(function () {
                result.resolve(buttonId);
            }, 0);
            
            // Remove the dialog instance from the DOM.
            dlg.remove();
        });

        function stopEvent(e) {
            // Stop the event if the target is not inside the dialog
            if (!($.contains(dlg.get(0), e.target))) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
        
        // Standard keyboard handlers.
        // Need to add both keydown and keyup handlers here to make sure
        // the enter key was pressed while the dialog was showing.
        // Otherwise, if a keydown or keypress from somewhere else
        // triggered an alert, the keyup could immediately dismiss it.
        var keyDownHandled = false;
        
        function keydownHandler(e) {
            keyDownHandled = true;
            stopEvent(e);
        }
        
        function keyupHandler(e) {
            if (keyDownHandled) {
                var primaryBtn = dlg.find(".primary"),
                    buttonId = null;
                
                if (e.keyCode === 13) {
                    if (primaryBtn) {
                        buttonId = primaryBtn.attr("data-button-id");
                    }
                } else {
                    var keyCode = String.fromCharCode(e.keyCode);
                    
                    if (keyCode) {
                        keyCode = keyCode.toLowerCase();

                        if (brackets.platform === "mac") {
                            // CMD+D Don't Save
                            if (e.ctrlKey && keyCode === 'd') {
                                if (_hasButton(DIALOG_BTN_DONTSAVE)) {
                                    buttonId = DIALOG_BTN_DONTSAVE;
                                }
                            // CMD+. Cancel
                            } else if (e.ctrlKey && keyCode === '.') {
                                buttonId = DIALOG_BTN_CANCEL;
                            }
                        } else { // if (brackets.platform === "win") {
                            // 'n' Don't Save
                            if (keyCode === 'n') {
                                if (_hasButton(DIALOG_BTN_DONTSAVE)) {
                                    buttonId = DIALOG_BTN_DONTSAVE;
                                }
                            }
                        }
                    }
                }
            
                keyDownHandled = false;
                
                if (buttonId) {
                    _dismissDialog(dlg, buttonId);
                    stopEvent(e);
                }
            }
        }
        
        // These handlers are added at the capture phase to make sure we
        // get first crack at the events. 
        document.body.addEventListener("keydown", keydownHandler, true);
        document.body.addEventListener("keyup", keyupHandler, true);
        
        // Click handler for buttons
        dlg.one("click", ".dialog-button", function (e) {
            _dismissDialog(dlg, $(this).attr("data-button-id"));
        });

        // Run the dialog
        dlg.modal({
            backdrop: "static",
            show: true
        }).on("hide", function (e) {
            // Remove key event handlers
            document.body.removeEventListener("keydown", keydownHandler, true);
            document.body.removeEventListener("keyup", keyupHandler, true);
        });
        return result;
    }
    
    /**
     * Immediately closes any dialog instances with the given class. The dialog callback for each instance will 
     * be called with the special buttonId DIALOG_CANCELED (note: callback is run asynchronously).
     */
    function cancelModalDialogIfOpen(dlgClass) {
        $("." + dlgClass + ".instance").each(function (dlg) {
            if (dlg.is(":visible")) {   // Bootstrap breaks if try to hide dialog that's already hidden
                _dismissDialog(dlg, DIALOG_CANCELED);
            }
        });
    }
    
    exports.DIALOG_BTN_CANCEL = DIALOG_BTN_CANCEL;
    exports.DIALOG_BTN_OK = DIALOG_BTN_OK;
    exports.DIALOG_BTN_DONTSAVE = DIALOG_BTN_DONTSAVE;
    exports.DIALOG_CANCELED = DIALOG_CANCELED;
    
    exports.DIALOG_ID_ERROR = DIALOG_ID_ERROR;
    exports.DIALOG_ID_SAVE_CLOSE = DIALOG_ID_SAVE_CLOSE;
    exports.DIALOG_ID_EXT_CHANGED = DIALOG_ID_EXT_CHANGED;
    exports.DIALOG_ID_EXT_DELETED = DIALOG_ID_EXT_DELETED;
    
    exports.showModalDialog = showModalDialog;
    exports.cancelModalDialogIfOpen = cancelModalDialogIfOpen;
});
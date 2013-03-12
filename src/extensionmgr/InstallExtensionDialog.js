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
/*global define, window, $, PathUtils, Mustache, document */

define(function (require, exports, module) {
    "use strict";
    
    require("thirdparty/path-utils/path-utils.min");

    var Dialogs                = require("widgets/Dialogs"),
        StringUtils            = require("utils/StringUtils"),
        Strings                = require("strings"),
        Commands               = require("command/Commands"),
        CommandManager         = require("command/CommandManager"),
        KeyEvent               = require("utils/KeyEvent"),
        InstallDialogTemplate  = require("text!extensionmgr/install-extension-dialog.html");

    var STATE_CLOSED            = 0,
        STATE_GETTING_URL       = 1,
        STATE_INSTALLING        = 2,
        STATE_INSTALLED         = 3,
        STATE_INSTALL_FAILED    = 4,
        STATE_INSTALL_CANCELLED = 5;
    
    var $dlg,
        $url,
        $okButton,
        $cancelButton,
        $inputArea,
        $msgArea,
        $msg,
        $spinner,
        dialogDeferred,
        installer,
        state = STATE_CLOSED;
    
    /**
     * @private
     * Transitions the dialog into a new state as the installation proceeds.
     * @param {number} newState The state to transition into; one of the STATE_* variables.
     */
    function _enterState(newState) {
        var url, msg;
        
        switch (newState) {
        case STATE_GETTING_URL:
            // This should match the default appearance of the dialog when it first opens.
            $spinner.removeClass("spin");
            $msgArea.hide();
            $inputArea.show();
            $okButton
                .removeAttr("disabled")
                .text(Strings.INSTALL);
            break;
            
        case STATE_INSTALLING:
            url = $url.val();
            if (url !== "") {
                $inputArea.hide();
                $msg.text(StringUtils.format(Strings.INSTALLING_FROM, url));
                $spinner.addClass("spin");
                $msgArea.show();
                $okButton.attr("disabled", "disabled");
                installer.install(url)
                    .done(function () {
                        _enterState(STATE_INSTALLED);
                    })
                    .fail(function () {
                        _enterState(STATE_INSTALL_FAILED);
                    });
            } else {
                // TODO: Show error. Should we keep Install button grayed until it's valid?
                newState = STATE_GETTING_URL;
            }
            break;
            
        case STATE_INSTALLED:
        case STATE_INSTALL_FAILED:
        case STATE_INSTALL_CANCELLED:
            if (newState === STATE_INSTALL_CANCELLED) {
                // TODO: do we need to wait for acknowledgement? That will require adding a new
                // "waiting for cancelled" state.
                installer.cancel();
            }
                
            $spinner.removeClass("spin");
            if (newState === STATE_INSTALLED) {
                msg = Strings.INSTALL_SUCCEEDED;
            } else if (newState === STATE_INSTALL_FAILED) {
                // TODO: show error message from backend--how do we pass this?
                msg = Strings.INSTALL_FAILED;
            } else {
                msg = Strings.INSTALL_CANCELLED;
            }
            $msg.text(msg);
            $okButton
                .removeAttr("disabled")
                .text(Strings.CLOSE);
            $cancelButton.hide();
            break;
            
        case STATE_CLOSED:
            $(document.body).off(".installDialog");
            
           // Only resolve as successful if we actually installed something.
            Dialogs.cancelModalDialogIfOpen("install-extension-dialog");
            if (state === STATE_INSTALLED) {
                dialogDeferred.resolve();
            } else {
                dialogDeferred.reject();
            }
            break;
            
        }
        state = newState;
    }

    /**
     * @private
     * Handle a click on the Cancel button, which either cancels an ongoing installation (leaving
     * the dialog open), or closes the dialog if no installation is in progress.
     */
    function _handleCancel() {
        if (state === STATE_INSTALLING) {
            _enterState(STATE_INSTALL_CANCELLED);
        } else {
            _enterState(STATE_CLOSED);
        }
    }
    
    /**
     * @private
     * Handle a click on the default button, which is "Install" while we're waiting for the
     * user to enter a URL, and "Close" once we've successfully finished installation.
     */
    function _handleOk() {
        if (state === STATE_INSTALLED || state === STATE_INSTALL_FAILED || state === STATE_INSTALL_CANCELLED) {
            // In these end states, this is a "Close" button: just close the dialog and indicate
            // success.
            _enterState(STATE_CLOSED);
        } else if (state === STATE_GETTING_URL) {
            _enterState(STATE_INSTALLING);
        }
    }
    
    /**
     * @private
     * Handle key up events on the document. We use this to detect the Esc key.
     */
    function _handleKeyUp(e) {
        if (e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
            _handleCancel();
        }
    }
    
    function MockInstaller() { }
    MockInstaller.prototype.install = function (url) {
        var result = new $.Deferred();
        // *** Fake behavior for now until we have a backend. Enter "fail" somewhere in the
        // URL to make the installation fail.
        window.setTimeout(function () {
            if (state === STATE_INSTALLING) {
                if (url.match(/fail/)) {
                    result.reject();
                } else {
                    result.resolve();
                }
            }
        }, 5000);
        return result.promise();
    };
    MockInstaller.prototype.cancel = function () { };
    
    /**
     * @private
     * Sets the installer backend.
     * @param {{install: function(string): $.Promise, cancel: function()}} i
     *     The installer backend object to use. Must define two functions:
     *     install(url): takes the URL of the extension to install, and returns a promise
     *         that's resolved or rejected when the installation succeeds or fails.
     *     cancel(): cancels an ongoing installation.
     */
    function _setInstaller(i) {
        installer = i;
    }
    
    /**
     * @private
     * Returns the jQuery objects for various dialog fileds. For unit testing only.
     * @return {object} fields An object containing "dlg", "okButton", "cancelButton", and "url" fields.
     */
    function _getDialogFields() {
        return {
            $dlg: $dlg,
            $okButton: $okButton,
            $cancelButton: $cancelButton,
            $url: $url
        };
    }
    
    /**
     * @private
     * Closes the dialog if it's not already closed. For unit testing only.
     */
    function _closeDialog() {
        if (state !== STATE_CLOSED) {
            _enterState(STATE_CLOSED);
        }
    }

    /**
     * @private
     * Show a dialog that allows the user to enter the URL of an extension ZIP file to install.
     * @return {$.Promise} A promise object that will be resolved when the selected extension
     *     has finished installing, or rejected if the dialog is cancelled.
     */
    function _showDialog() {
        if (state !== STATE_CLOSED) {
            // Somehow the dialog got invoked twice. Just ignore this.
            return;
        }
        
        // *** TODO: initialize real installer
        if (!installer) {
            _setInstaller(new MockInstaller());
        }
        
        // We ignore the promise returned by showModalDialogUsingTemplate, since we're managing the 
        // lifecycle of the dialog ourselves.
        Dialogs.showModalDialogUsingTemplate(
            Mustache.render(InstallDialogTemplate, Strings),
            null,
            null,
            false
        );
        
        $dlg          = $(".install-extension-dialog.instance");
        $url          = $dlg.find(".url").focus();
        $okButton     = $dlg.find(".dialog-button[data-button-id='ok']");
        $cancelButton = $dlg.find(".dialog-button[data-button-id='cancel']");
        $inputArea    = $dlg.find(".input-field");
        $msgArea      = $dlg.find(".message-field");
        $msg          = $msgArea.find(".message");
        $spinner      = $msgArea.find(".spinner");

        $okButton.on("click", _handleOk);
        $cancelButton.on("click", _handleCancel);
        $(document.body).on("keyup.installDialog", _handleKeyUp);
        
        _enterState(STATE_GETTING_URL);

        dialogDeferred = new $.Deferred();
        return dialogDeferred.promise();
    }

    CommandManager.register(Strings.CMD_INSTALL_EXTENSION, Commands.FILE_INSTALL_EXTENSION, _showDialog);
    
    // For unit testing
    exports._setInstaller    = _setInstaller;
    exports._showDialog      = _showDialog;
    exports._getDialogFields = _getDialogFields;
    exports._closeDialog     = _closeDialog;
});

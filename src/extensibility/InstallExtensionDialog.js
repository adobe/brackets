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
/*global define, window, $, brackets, Mustache, document */
/*unittests: Install Extension Dialog*/

define(function (require, exports, module) {
    "use strict";

    var Dialogs                = require("widgets/Dialogs"),
        File                   = require("filesystem/File"),
        StringUtils            = require("utils/StringUtils"),
        Strings                = require("strings"),
        FileSystem             = require("filesystem/FileSystem"),
        KeyEvent               = require("utils/KeyEvent"),
        Package                = require("extensibility/Package"),
        NativeApp              = require("utils/NativeApp"),
        InstallDialogTemplate  = require("text!htmlContent/install-extension-dialog.html");

    var STATE_CLOSED              = 0,
        STATE_START               = 1,
        STATE_VALID_URL           = 2,
        STATE_INSTALLING          = 3,
        STATE_INSTALLED           = 4,
        STATE_INSTALL_FAILED      = 5,
        STATE_CANCELING_INSTALL   = 6,
        STATE_CANCELING_HUNG      = 7,
        STATE_INSTALL_CANCELED    = 8,
        STATE_ALREADY_INSTALLED   = 9,
        STATE_OVERWRITE_CONFIRMED = 10,
        STATE_NEEDS_UPDATE        = 11;

    /**
     * Creates a new extension installer dialog.
     * @constructor
     * @param {{install: function(url), cancel: function()}} installer The installer backend to use.
     */
    function InstallExtensionDialog(installer, _isUpdate) {
        this._installer = installer;
        this._state = STATE_CLOSED;
        this._installResult = null;
        this._isUpdate = _isUpdate;

        // Timeout before we allow user to leave STATE_INSTALL_CANCELING without waiting for a resolution
        // (per-instance so we can poke it for unit testing)
        this._cancelTimeout = 10 * 1000;
    }

    /**
     * The dialog root.
     * @type {jQuery}
     */
    InstallExtensionDialog.prototype.$dlg = null;

    /**
     * The url input field.
     * @type {jQuery}
     */
    InstallExtensionDialog.prototype.$url = null;

    /**
     * The ok button.
     * @type {jQuery}
     */
    InstallExtensionDialog.prototype.$okButton = null;

    /**
     * The cancel button.
     * @type {jQuery}
     */
    InstallExtensionDialog.prototype.$cancelButton = null;

    /**
     * The area containing the url input label and field.
     * @type {jQuery}
     */
    InstallExtensionDialog.prototype.$inputArea = null;

    /**
     * The area containing the installation message and spinner.
     * @type {jQuery}
     */
    InstallExtensionDialog.prototype.$msgArea = null;

    /**
     * The span containing the installation message.
     * @type {jQuery}
     */
    InstallExtensionDialog.prototype.$msg = null;

    /**
     * The "Browse Extensions" button.
     * @type {jQuery}
     */
    InstallExtensionDialog.prototype.$browseExtensionsButton = null;

    /**
     * A deferred that's resolved/rejected when the dialog is closed and
     * something has/hasn't been installed successfully.
     * @type {$.Deferred}
     */
    InstallExtensionDialog.prototype._dialogDeferred = null;


    /**
     * installer The installer backend for this dialog.
     * @type {{install: function(url), cancel: function()}}
     */
    InstallExtensionDialog.prototype._installer = null;

    /**
     * The current state of the dialog; one of the STATE_* constants above.
     * @type {number}
     */
    InstallExtensionDialog.prototype._state = null;

    /**
     * @private
     * Transitions the dialog into a new state as the installation proceeds.
     * @param {number} newState The state to transition into; one of the STATE_* variables.
     */
    InstallExtensionDialog.prototype._enterState = function (newState) {
        var url,
            msg,
            self = this,
            prevState = this._state;

        // Store the new state up front in case some of the processing below ends up changing
        // the state again immediately.
        this._state = newState;

        switch (newState) {
        case STATE_START:
            // This should match the default appearance of the dialog when it first opens.
            this.$msg.find(".spinner").remove();
            this.$msgArea.hide();
            this.$inputArea.show();
            this.$okButton
                .prop("disabled", true)
                .text(Strings.INSTALL);
            break;

        case STATE_VALID_URL:
            this.$okButton.prop("disabled", false);
            break;

        case STATE_INSTALLING:
            url = this.$url.val().trim();
            this.$inputArea.hide();
            this.$browseExtensionsButton.hide();
            this.$msg.text(StringUtils.format(Strings.INSTALLING_FROM, url))
                .append("<span class='spinner inline spin'/>");
            this.$msgArea.show();
            this.$okButton.prop("disabled", true);
            this._installer.install(url)
                .done(function (result) {
                    self._installResult = result;
                    if (result.installationStatus === Package.InstallationStatuses.ALREADY_INSTALLED ||
                            result.installationStatus === Package.InstallationStatuses.OLDER_VERSION ||
                            result.installationStatus === Package.InstallationStatuses.SAME_VERSION) {
                        self._enterState(STATE_ALREADY_INSTALLED);
                    } else if (result.installationStatus === Package.InstallationStatuses.NEEDS_UPDATE) {
                        self._enterState(STATE_NEEDS_UPDATE);
                    } else {
                        self._enterState(STATE_INSTALLED);
                    }
                })
                .fail(function (err) {
                    // If the "failure" is actually a user-requested cancel, don't show an error UI
                    if (err === "CANCELED") {
                        console.assert(self._state === STATE_CANCELING_INSTALL || self._state === STATE_CANCELING_HUNG);
                        self._enterState(STATE_INSTALL_CANCELED);
                    } else {
                        self._errorMessage = Package.formatError(err);
                        self._enterState(STATE_INSTALL_FAILED);
                    }
                });
            break;

        case STATE_CANCELING_INSTALL:
            // This should call back the STATE_INSTALLING fail() handler above, unless it's too late to cancel
            // in which case we'll still jump to STATE_INSTALLED after this
            this.$cancelButton.prop("disabled", true);
            this.$msg.text(Strings.CANCELING_INSTALL);
            this._installer.cancel();
            window.setTimeout(function () {
                if (self._state === STATE_CANCELING_INSTALL) {
                    self._enterState(STATE_CANCELING_HUNG);
                }
            }, this._cancelTimeout);
            break;

        case STATE_CANCELING_HUNG:
            this.$msg.text(Strings.CANCELING_HUNG);
            this.$okButton
                .removeAttr("disabled")
                .text(Strings.CLOSE);
            break;

        case STATE_INSTALLED:
        case STATE_INSTALL_FAILED:
        case STATE_INSTALL_CANCELED:
        case STATE_NEEDS_UPDATE:
            if (newState === STATE_INSTALLED) {
                msg = Strings.INSTALL_SUCCEEDED;
            } else if (newState === STATE_INSTALL_FAILED) {
                msg = Strings.INSTALL_FAILED;
            } else if (newState === STATE_NEEDS_UPDATE) {
                msg = Strings.EXTENSION_UPDATE_INSTALLED;
            } else {
                msg = Strings.INSTALL_CANCELED;
            }
            this.$msg.html($("<strong/>").text(msg));
            if (this._errorMessage) {
                this.$msg.append($("<p/>").text(this._errorMessage));
            }
            this.$okButton
                .removeAttr("disabled")
                .text(Strings.CLOSE);
            this.$cancelButton.hide();
            break;

        case STATE_ALREADY_INSTALLED:
            var installResult = this._installResult;
            var status = installResult.installationStatus;
            var msgText = Strings["EXTENSION_" + status];
            if (status === Package.InstallationStatuses.OLDER_VERSION) {
                msgText = StringUtils.format(msgText, installResult.metadata.version, installResult.installedVersion);
            }
            this.$msg.text(msgText);
            this.$okButton
                .prop("disabled", false)
                .text(Strings.OVERWRITE);
            break;

        case STATE_OVERWRITE_CONFIRMED:
            this._enterState(STATE_CLOSED);
            break;

        case STATE_CLOSED:
            $(document.body).off(".installDialog");

           // Only resolve as successful if we actually installed something.
            Dialogs.cancelModalDialogIfOpen("install-extension-dialog");
            if (prevState === STATE_INSTALLED || prevState === STATE_NEEDS_UPDATE ||
                    prevState === STATE_OVERWRITE_CONFIRMED) {
                this._dialogDeferred.resolve(this._installResult);
            } else {
                this._dialogDeferred.reject();
            }
            break;
        }
    };

    /**
     * @private
     * Handle a click on the Cancel button, which either cancels an ongoing installation (leaving
     * the dialog open), or closes the dialog if no installation is in progress.
     */
    InstallExtensionDialog.prototype._handleCancel = function () {
        if (this._state === STATE_INSTALLING) {
            this._enterState(STATE_CANCELING_INSTALL);
        } else if (this._state === STATE_ALREADY_INSTALLED) {
            // If we were prompting the user about overwriting a previous installation,
            // and the user cancels, we can delete the downloaded file.
            if (this._installResult && this._installResult.localPath && !this._installResult.keepFile) {
                var filename = this._installResult.localPath;
                FileSystem.getFileForPath(filename).unlink();
            }
            this._enterState(STATE_CLOSED);
        } else if (this._state !== STATE_CANCELING_INSTALL) {
            this._enterState(STATE_CLOSED);
        }
    };

    /**
     * @private
     * Handle a click on the default button, which is "Install" while we're waiting for the
     * user to enter a URL, and "Close" once we've successfully finished installation.
     */
    InstallExtensionDialog.prototype._handleOk = function () {
        if (this._state === STATE_INSTALLED ||
                this._state === STATE_INSTALL_FAILED ||
                this._state === STATE_INSTALL_CANCELED ||
                this._state === STATE_CANCELING_HUNG ||
                this._state === STATE_NEEDS_UPDATE) {
            // In these end states, this is a "Close" button: just close the dialog and indicate
            // success.
            this._enterState(STATE_CLOSED);
        } else if (this._state === STATE_VALID_URL) {
            this._enterState(STATE_INSTALLING);
        } else if (this._state === STATE_ALREADY_INSTALLED) {
            this._enterState(STATE_OVERWRITE_CONFIRMED);
        }
    };

    /**
     * @private
     * Handle key up events on the document. We use this to detect the Esc key.
     */
    InstallExtensionDialog.prototype._handleKeyUp = function (e) {
        if (e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
            this._handleCancel();
        }
    };

    /**
     * @private
     * Handle typing in the URL field.
     */
    InstallExtensionDialog.prototype._handleUrlInput = function (e) {
        var url     = this.$url.val().trim(),
            valid   = (url !== "");
        if (!valid && this._state === STATE_VALID_URL) {
            this._enterState(STATE_START);
        } else if (valid && this._state === STATE_START) {
            this._enterState(STATE_VALID_URL);
        }
    };

    /**
     * @private
     * Closes the dialog if it's not already closed. For unit testing only.
     */
    InstallExtensionDialog.prototype._close = function () {
        if (this._state !== STATE_CLOSED) {
            this._enterState(STATE_CLOSED);
        }
    };

    /**
     * Initialize and show the dialog.
     * @param {string=} urlToInstall If specified, immediately starts installing the given file as if the user had
     *     specified it.
     * @return {$.Promise} A promise object that will be resolved when the selected extension
     *     has finished installing, or rejected if the dialog is cancelled.
     */
    InstallExtensionDialog.prototype.show = function (urlToInstall) {
        if (this._state !== STATE_CLOSED) {
            // Somehow the dialog got invoked twice. Just ignore this.
            return this._dialogDeferred.promise();
        }

        var context = {
            Strings: Strings,
            isUpdate: this._isUpdate,
            includeBrowseExtensions: !!brackets.config.extension_listing_url
        };

        // We ignore the promise returned by showModalDialogUsingTemplate, since we're managing the
        // lifecycle of the dialog ourselves.
        Dialogs.showModalDialogUsingTemplate(Mustache.render(InstallDialogTemplate, context), false);

        this.$dlg          = $(".install-extension-dialog.instance");
        this.$url          = this.$dlg.find(".url").focus();
        this.$okButton     = this.$dlg.find(".dialog-button[data-button-id='ok']");
        this.$cancelButton = this.$dlg.find(".dialog-button[data-button-id='cancel']");
        this.$inputArea    = this.$dlg.find(".input-field");
        this.$msgArea      = this.$dlg.find(".message-field");
        this.$msg          = this.$msgArea.find(".message");
        this.$browseExtensionsButton = this.$dlg.find(".browse-extensions");

        this.$okButton.on("click", this._handleOk.bind(this));
        this.$cancelButton.on("click", this._handleCancel.bind(this));
        this.$url.on("input", this._handleUrlInput.bind(this));
        this.$browseExtensionsButton.on("click", function () {
            NativeApp.openURLInDefaultBrowser(brackets.config.extension_listing_url);
        });
        $(window.document.body).on("keyup.installDialog", this._handleKeyUp.bind(this));

        this._enterState(STATE_START);
        if (urlToInstall) {
            // Act as if the user had manually entered the URL.
            this.$url.val(urlToInstall);
            this._enterState(STATE_VALID_URL);
            this._enterState(STATE_INSTALLING);
        }

        this._dialogDeferred = new $.Deferred();
        return this._dialogDeferred.promise();
    };


    /** Mediates between this module and the Package extension-installation utils. Mockable for unit-testing. */
    function InstallerFacade(isLocalFile) {
        this._isLocalFile = isLocalFile;
    }

    InstallerFacade.prototype.install = function (url) {
        if (this.pendingInstall) {
            console.error("Extension installation already pending");
            return new $.Deferred().reject("DOWNLOAD_ID_IN_USE").promise();
        }

        if (this._isLocalFile) {
            var deferred = new $.Deferred();

            this.pendingInstall = {
                promise: deferred.promise(),
                cancel: function () {
                    // Can't cancel local zip installs
                }
            };

            Package.installFromPath(url).then(function (installationResult) {
                // Flag to keep zip files for local file installation
                installationResult.keepFile = true;
                deferred.resolve(installationResult);
            }, deferred.reject);
        } else {
            this.pendingInstall = Package.installFromURL(url);
        }

        // Store now since we'll null pendingInstall immediately if the promise was resolved synchronously
        var promise = this.pendingInstall.promise;

        var self = this;
        this.pendingInstall.promise.always(function () {
            self.pendingInstall = null;
        });

        return promise;
    };
    InstallerFacade.prototype.cancel = function () {
        this.pendingInstall.cancel();
    };

    /**
     * @private
     * Show a dialog that allows the user to enter the URL of an extension ZIP file to install.
     * @return {$.Promise} A promise object that will be resolved when the selected extension
     *     has finished installing, or rejected if the dialog is cancelled.
     */
    function showDialog() {
        var dlg = new InstallExtensionDialog(new InstallerFacade());
        return dlg.show();
    }

    /**
     * @private
     * Show the installation dialog and automatically begin installing the given URL.
     * @param {(string|File)=} urlOrFileToInstall If specified, immediately starts installing the given file as if the user had
     *     specified it.
     * @return {$.Promise} A promise object that will be resolved when the selected extension
     *     has finished installing, or rejected if the dialog is cancelled.
     */
    function installUsingDialog(urlOrFileToInstall, _isUpdate) {
        var isLocalFile = (urlOrFileToInstall instanceof File),
            dlg = new InstallExtensionDialog(new InstallerFacade(isLocalFile), _isUpdate);

        return dlg.show(urlOrFileToInstall.fullPath || urlOrFileToInstall);
    }

    /**
     * @private
     * Show the update dialog and automatically begin downloading the update from the given URL.
     * @param {string} urlToUpdate URL to download
     * @return {$.Promise} A promise object that will be resolved when the selected extension
     *     has finished downloading, or rejected if the dialog is cancelled.
     */
    function updateUsingDialog(urlToUpdate) {
        return installUsingDialog(urlToUpdate, true);
    }

    exports.showDialog          = showDialog;
    exports.installUsingDialog  = installUsingDialog;
    exports.updateUsingDialog   = updateUsingDialog;

    // Exposed for unit testing only
    exports._Dialog = InstallExtensionDialog;
});

/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var StartupState   = brackets.getModule("bramble/StartupState");
    var Path           = brackets.getModule("filesystem/impls/filer/BracketsFiler").Path;
    var CommandManager = brackets.getModule("command/CommandManager");
    var CMD_OPEN       = brackets.getModule("command/Commands").CMD_OPEN;
    var Dialogs        = brackets.getModule("widgets/Dialogs");
    var DragAndDrop    = brackets.getModule("utils/DragAndDrop");
    var KeyEvent       = brackets.getModule("utils/KeyEvent");
    var Strings        = brackets.getModule("strings");
    var Mustache       = brackets.getModule("thirdparty/mustache/mustache");

    var dialogHTML     = require("text!htmlContent/upload-files-dialog.html");

    // Not all browsers support access to camera
    var isCameraSupported = (function(navigator) {
        return !!(navigator.getUserMedia       ||
                  navigator.webkitGetUserMedia ||
                  navigator.mozGetUserMedia    ||
                  navigator.msGetUserMedia);
    }(window.navigator));

    function FileInput() {
        $(document.body)
            .append($('<input class="upload-files-input-elem" type="file" multiple />'));
    }
    FileInput.prototype.getFiles = function() {
        return this.getElem$()[0].files;
    };
    FileInput.prototype.getElem$ = function() {
        return $(".upload-files-input-elem");
    };
    FileInput.prototype.remove = function() {
        this.getElem$().remove();
    };


    function FileUploadDialog() {
        this.fileInput = new FileInput();
        this.deferred = new $.Deferred();
    }
    FileUploadDialog.prototype.show = function() {
        var self = this;
        var deferred = self.deferred;

        // We ignore the promise returned by showModalDialogUsingTemplate, since we're managing the
        // lifecycle of the dialog ourselves.
        Dialogs.showModalDialogUsingTemplate(Mustache.render(dialogHTML, Strings), false);

        var $dlg = $(".upload-files-dialog.instance");
        var $dragFilesAreaDiv = $dlg.find(".drag-files-area");
        var $uploadFilesDiv = $dlg.find(".uploading-files");
        var $fromComputerButton = $dlg.find(".dialog-button[data-button-id='from-computer']");
        var $takeSelfieButton = $dlg.find(".dialog-button[data-button-id='take-selfie']");
        var $cancelButton = $dlg.find(".dialog-button[data-button-id='cancel']");
        var $dropZoneDiv = $dlg.find(".drop-zone");

        // Disable selfie button if not supported by browser
        if(!isCameraSupported) {
            $takeSelfieButton.attr("disabled", true);
        }

        // Hide the uploadingFiles div until a drop event
        $uploadFilesDiv.hide();

        $fromComputerButton.one("click", self._handleFromComputer.bind(self));
        $takeSelfieButton.one("click", self._handleTakeSelfie.bind(self));
        $cancelButton.one("click", function() {
            self.hide();
            self.destroy();
        });
        $(window.document.body).on("keyup.installDialog", self._handleKeyUp.bind(self));

        // Hook up drag-and-drop handling
        DragAndDrop.attachHandlers({
            elem: $dropZoneDiv[0],
            ondragover: function() {
                if(self._dragover) {
                    return;
                }
                self._dragover = true;
                $dragFilesAreaDiv.addClass("drag-over");
            },
            ondragleave: function() {
                delete self._dragover;
                $dragFilesAreaDiv.removeClass("drag-over");
            },
            ondrop: function() {
                // Turn off the other buttons
                $fromComputerButton.off("click", self._handleFromComputer.bind(self));
                $takeSelfieButton.off("click", self._handleTakeSelfie.bind(self));

                // Switch to the upload spinner
                $dragFilesAreaDiv.hide();
                $uploadFilesDiv.show();
            },
            onfilesdone: function() {
                self.hide();
                self.destroy();
            },
            autoRemoveHandlers: true
        });

        return deferred.promise();
    };
    FileUploadDialog.prototype._handleKeyUp = function(e) {
        var self = this;

        // Dismiss dialog on ESC
        if (e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
            self.hide();
            self.destroy();
            self.deferred.resolve();
        }
    };
    FileUploadDialog.prototype._handleTakeSelfie = function() {
        var self = this;
        var deferred = self.deferred;

        self.hide();
        self.destroy();

        // Take a selfie, then show the image in the editor.
        CommandManager.execute("bramble.selfie")
            .done(function(filename) {
                // Get the absolute path to the new file and open
                filename = Path.join(StartupState.project("root"), filename);
                CommandManager.execute(CMD_OPEN, { fullPath: filename })
                    .then(deferred.resolve, deferred.reject);
            })
            .fail(deferred.reject);
    };
    FileUploadDialog.prototype._handleFromComputer = function() {
        var self = this;
        var deferred = self.deferred;

        self.hide();

        function _processFiles(e) {
            var files = self.fileInput.getFiles();
            DragAndDrop.processFiles(files, function(err) {
                self.destroy();

                if(err) {
                    deferred.reject();
                } else {
                    deferred.resolve();
                }
            });
        }

        // Trigger the <input type="file"> added previously to show and process files.
        var input = self.fileInput.getElem$();
        input.on("change", _processFiles);
        input.click();
    };
    FileUploadDialog.prototype.hide = function() {
        var self = this;
        $(window.document.body).off("keyup.installDialog", self._handleKeyUp);
        Dialogs.cancelModalDialogIfOpen("upload-files-dialog");
    };
    FileUploadDialog.prototype.destroy = function() {
        this.fileInput.remove();
    };


    function show() {
        var uploadDialog = new FileUploadDialog();
        return uploadDialog.show();
    }

    exports.show = show;
});

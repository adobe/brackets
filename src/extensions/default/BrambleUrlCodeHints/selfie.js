/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var CommandManager    = brackets.getModule("command/CommandManager");
    var FileUtils         = brackets.getModule("file/FileUtils");
    var StartupState      = brackets.getModule("bramble/StartupState");
    var Filer             = brackets.getModule("filesystem/impls/filer/BracketsFiler");
    var Path              = Filer.Path;
    var fs                = Filer.fs();

    var CameraDialog      = require("camera-dialog");

    // TODO: l10n
    var SELFIE_MENU_LABEL = "Take a Selfie...";
    var SELFIE_FILENAME   = "selfie";
    var CMD_SELFIE_TEXT   = "Take a Selfie";
    var CMD_SELFIE_ID     = "bramble.selfie";

    /**
     * Generate a unique filename for this selfie, taking into account
     * that there might be other selfies already in the dir. Use an
     * auto-increment on the filename (i.e., selfie1.png, selfie2.png)
     */
    function _generateFilename(callback) {
        var root = StartupState.project("root");
        fs.readdir(root, function(err, entries) {
            if(err) {
                return callback(err);
            }

            var highest = 0;
            entries.forEach(function(entry){
                var filenameParts = /selfie(\d*)\.png/.exec(entry);
                var current;

                if(filenameParts) {
                    current = Number(filenameParts[1]);
                    if(current > highest) {
                        highest = current;
                    }
                }
            });

            var filename = SELFIE_FILENAME + (highest + 1) + ".png";
            callback(null, filename);
        });
    }

    function takeSelfie() {
        var result = new $.Deferred();

        function showCamera(filename) {
            // NOTE: we need to deal with Brackets expecting a trailing / on dir names.
            var projectRoot = StartupState.project("root").replace(/\/?$/, "/");
            var savePath = Path.join(projectRoot, filename);
            var cameraDialog = new CameraDialog(savePath);

            cameraDialog.show()
                .done(function(selfieFilePath){
                    if(selfieFilePath) {
                        // Give back a path relative to the project's mount root.
                        selfieFilePath = FileUtils.getRelativeFilename(projectRoot,
                                                                       selfieFilePath);
                    }
                    result.resolve(selfieFilePath);
                })
                .fail(function(err) {
                    result.reject(err);
                })
                .always(function() {
                    cameraDialog.close();
                    cameraDialog = null;
                });
        }

        _generateFilename(function(err, filename) {
            if(err) {
                console.error("[Selfie error] ", err);
                return result.reject();
            }
            showCamera(filename);
        });

        return result.promise();
    }

    function addSelfieCommand() {
        CommandManager.register(CMD_SELFIE_TEXT, CMD_SELFIE_ID, takeSelfie);
    }

    exports.addSelfieCommand = addSelfieCommand;
    exports.takeSelfie       = takeSelfie;
    exports.label            = SELFIE_MENU_LABEL;
});

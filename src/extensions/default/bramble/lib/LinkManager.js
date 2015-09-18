define(function (require, exports, module) {
    "use strict";

    var LiveDevMultiBrowser = brackets.getModule("LiveDevelopment/LiveDevMultiBrowser");
    var Path                = brackets.getModule("filesystem/impls/filer/BracketsFiler").Path;
    var CommandManager      = brackets.getModule("command/CommandManager");
    var Commands            = brackets.getModule("command/Commands");
    var FileSystem          = brackets.getModule("filesystem/FileSystem");

    var LinkManagerRemote = require("text!lib/LinkManagerRemote.js");

    function getRemoteScript() {
        // Intercept clicks on <a> in the preview document
        return "<script>\n" + LinkManagerRemote + "</script>\n";
    }

    function getNavigationPath(message) {
        var match = message.match(/^bramble-navigate\:(.+)/);
        return match && match[1];
    }

    // Whether or not this message is a navigation request from the LinkManagerRemote script.
    function isNavigationRequest(message) {
        return !!getNavigationPath(message);
    }

    // Attempt to navigate the preview and editor to a new path
    function navigate(message) {
        var path = getNavigationPath(message);
        if(!path) {
            return;
        }

        var currentDoc = LiveDevMultiBrowser._getCurrentLiveDoc();
        if(!currentDoc) {
            return;
        }

        var currentDir = Path.dirname(currentDoc.doc.file.fullPath);
        path = Path.resolve(currentDir, path);

        // Open it in the editor, which will also attempt to update the preview to match
        FileSystem.resolve(path, function(err, file) {
            if(err) {
                console.log("[Bramble Error] unable to open path in editor", path, err);
                return;
            }
            CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: file.fullPath });
        });
    }

    exports.getRemoteScript = getRemoteScript;
    exports.isNavigationRequest = isNavigationRequest;
    exports.navigate = navigate;
});

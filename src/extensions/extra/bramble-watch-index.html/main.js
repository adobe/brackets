/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";

    /**
     * Thimble extension for Bramble to watch for, and warn about, renames and
     * deletes to the project's root index.html file.  Too many users are confused
     * by projects without an index.html file returning a 404 when they browse to the
     * root dir / of the published project.  See 
     * https://github.com/mozilla/thimble.mozilla.org/issues/1569#issuecomment-258889724
     */

    var AppInit              = brackets.getModule("utils/AppInit"),
        Strings              = brackets.getModule("strings"),
        FileSystem           = brackets.getModule("filesystem/FileSystem"),
        BrambleStartupState  = brackets.getModule("bramble/StartupState"),
        Filer                = brackets.getModule("filesystem/impls/filer/BracketsFiler"),
        Path                 = Filer.Path,
        Dialogs              = brackets.getModule("widgets/Dialogs"),
        DefaultDialogs       = brackets.getModule("widgets/DefaultDialogs");

    // Let the user know that the root index.html file is now missing (i.e., was
    // removed/renamed) and that this will affect loading (e.g., / vs. /index.html).
    function warn() {
        var dialog = Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_INFO,
            Strings.INDEX_HTML_FILE_MISSING_DIALOG_TITLE,
            Strings.INDEX_HTML_FILE_MISSING_DIALOG_MESSAGE
        );
    }

    function init() {
        var indexPath = Path.join(BrambleStartupState.project("root"), "index.html");
        
        // Listen for delete events for the root index.html
        FileSystem.on("change", function(evt, entry, added, removed) {
            // Ignore non-dir change events.  A file being deleted will be part
            // of a change to its parent dir.
            if(!entry || !entry.isDirectory) {
                return;
            }

            // Ignore change events without `removed` entries
            if(!removed || removed.length === 0) {
                return;
            }

            // Check all the removed entries to see if any of them are the root index.html file
            for(var file, i = 0; i < removed.length; i++) {
                file = removed[i];
                if(file.fullPath === indexPath) {
                    return warn();
                }
            }
        });

        // Listen for rename events on the root index.html
        FileSystem.on("rename", function(evt, oldPath, newPath) {
            if(oldPath === indexPath) {
                warn();
            }
        });
    }

    AppInit.appReady(init);
});

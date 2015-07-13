/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, clearTimeout, setTimeout */

define(function (require, exports, module) {
    "use strict";

    /**
     * Adds automatic saving to all documents in the editor. Autosave happens
     * in two cases:
     *
     * 1) A document gets queued for saving when it is marked as dirty by the
     * DocumentManager. We then wait a certain number of ms until we trigger
     * a save for the document. You can change `SAVE_DELAY_MS` below to whatever
     * number you think reasonable.
     *
     * 2) A document gets saved right away if it is dirty and the user switches
     * to another document in the editor. You can disable this by changing
     * `SAVE_ON_EDITOR_CHANGE` below to false.
     */

    // Time in ms to wait after a dirtyFlagChange event before autosaving file
    var SAVE_DELAY_MS = 5 * 1000;

    // Whether or not to autosave immediately when the user switches away from
    // a dirty editor document.
    var SAVE_ON_EDITOR_CHANGE = true;

    var FILE_SAVE       = brackets.getModule("command/Commands").FILE_SAVE, 
        SaveCommand     = brackets.getModule("command/CommandManager").get(FILE_SAVE),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        EditorManager   = brackets.getModule("editor/EditorManager");

    // Save operations that are pending
    var pending = {};

    // Schedule a save to happen.  If `immediate` is true, we do the save
    // right now, otherwise we wait a while.
    function scheduleSave(doc, immediate) {
        var path = doc.file.fullPath;

        // Skip subsequent attempts to save, if we're already waiting on a save
        if(pending[path] && !immediate) {
            return;
        }

        // We need to hold a ref to this document for a while so addRef() it.
        doc.addRef();

        function finish() {
            doc.releaseRef();
            clearTimeout(pending[path]);
            delete pending[path];
        }

        function doSave() {
            // If the file has been saved since we queued this save operation
            // (e.g., user did it), bail right now.
            if(!doc.isDirty) {
                finish();
                return;
            }

            SaveCommand.execute({doc: doc})
                .done(finish)
                .fail(function(err) {
                    console.error('[Autosave] failed write for `' + path + '`', err);
                    finish();
                });
        }

        if(immediate) {
            doSave();
        } else {
            pending[path] = setTimeout(doSave, SAVE_DELAY_MS);
        }
    }

    // When the editor's document is flagged as having changes, schedule a save
    DocumentManager.on("dirtyFlagChange", function(evt, doc) {
        if(doc.isDirty) {
            scheduleSave(doc);
        }
    });

    // When the user navigates away from a dirty editor document, save
    EditorManager.on("activeEditorChange", function(evt, current, previous){
        if(previous && previous.document.isDirty && SAVE_ON_EDITOR_CHANGE) {
            // Don't wait to do this save, do it right now
            scheduleSave(previous.document, true);
        }
    });
});

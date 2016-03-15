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
/*global define, $ */

/**
 * FileSyncManager is a set of utilities to help track external modifications to the files and folders
 * in the currently open project.
 *
 * Currently, we detect external changes purely by checking file timestamps against the last-sync
 * timestamp recorded on Document. Brackets triggers this check whenever an external change was detected
 * by our native file watchers, and on window focus. We recheck all open Documents, but with file caching
 * the timestamp check is a fast no-op for everything other than files where a watcher change was just
 * notified. If watchers/caching are disabled, we'll essentially check only on window focus, and we'll hit
 * the disk to check every open Document's timestamp every time.
 *
 * FUTURE: Whenever we have a 'project file tree model,' we should manipulate that instead of notifying
 * DocumentManager directly. DocumentManager, the tree UI, etc. then all listen to that model for changes.
 */
define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var ProjectManager  = require("project/ProjectManager"),
        DocumentManager = require("document/DocumentManager"),
        MainViewManager = require("view/MainViewManager"),
        Async           = require("utils/Async"),
        Dialogs         = require("widgets/Dialogs"),
        DefaultDialogs  = require("widgets/DefaultDialogs"),
        Strings         = require("strings"),
        StringUtils     = require("utils/StringUtils"),
        FileUtils       = require("file/FileUtils"),
        FileSystemError = require("filesystem/FileSystemError");


    /**
     * Guard to spot re-entrancy while syncOpenDocuments() is still in progress
     * @type {boolean}
     */
    var _alreadyChecking = false;

    /**
     * If true, we should bail from the syncOpenDocuments() process and then re-run it. See
     * comments in syncOpenDocuments() for how this works.
     * @type {boolean}
     */
    var _restartPending = false;

    /**
     * @type {Array.<Document>}
     */
    var toReload;

    /**
     * @type {Array.<Document>}
     */
    var toClose;

    /**
     * @type {Array.<{doc: Document, fileTime: number}>}
     */
    var editConflicts;

    /**
     * @type {Array.<{doc: Document, fileTime: number}>}
     */
    var deleteConflicts;


    /**
     * Scans all the given Documents for changes on disk, and sorts them into four buckets,
     * populating the corresponding arrays:
     *  toReload        - changed on disk; unchanged within Brackets
     *  toClose         - deleted on disk; unchanged within Brackets
     *  editConflicts   - changed on disk; also dirty in Brackets
     *  deleteConflicts - deleted on disk; also dirty in Brackets
     *
     * @param {!Array.<Document>} docs
     * @return {$.Promise}  Resolved when all scanning done, or rejected immediately if there's any
     *      error while reading file timestamps. Errors are logged but no UI is shown.
     */
    function findExternalChanges(docs) {

        toReload = [];
        toClose = [];
        editConflicts = [];
        deleteConflicts = [];

        function checkDoc(doc) {
            var result = new $.Deferred();

            // Check file timestamp / existence

            if (doc.isUntitled()) {
                result.resolve();
            } else {
                doc.file.stat(function (err, stat) {
                    if (!err) {
                        // Does file's timestamp differ from last sync time on the Document?
                        var fileTime = stat.mtime.getTime();
                        if (fileTime !== doc.diskTimestamp.getTime()) {
                            // If the user has chosen to keep changes that conflict with the
                            // current state of the file on disk, then do nothing. This means
                            // that even if the user later undoes back to clean, we won't
                            // automatically reload the file on window reactivation. We could
                            // make it do that, but it seems better to be consistent with the
                            // deletion case below, where it seems clear that you don't want
                            // to auto-delete the file on window reactivation just because you
                            // undid back to clean.
                            if (doc.keepChangesTime !== fileTime) {
                                if (doc.isDirty) {
                                    editConflicts.push({doc: doc, fileTime: fileTime});
                                } else {
                                    toReload.push(doc);
                                }
                            }
                        }
                        result.resolve();
                    } else {
                        // File has been deleted externally
                        if (err === FileSystemError.NOT_FOUND) {
                            // If the user has chosen to keep changes previously, and the file
                            // has been deleted, then do nothing. Like the case above, this
                            // means that even if the user later undoes back to clean, we won't
                            // then automatically delete the file on window reactivation.
                            // (We use -1 as the "mod time" to indicate that the file didn't
                            // exist, since there's no actual modification time to keep track of
                            // and -1 isn't a valid mod time for a real file.)
                            if (doc.keepChangesTime !== -1) {
                                if (doc.isDirty) {
                                    deleteConflicts.push({doc: doc, fileTime: -1});
                                } else {
                                    toClose.push(doc);
                                }
                            }
                            result.resolve();
                        } else {
                            // Some other error fetching metadata: treat as a real error
                            console.log("Error checking modification status of " + doc.file.fullPath, err);
                            result.reject();
                        }
                    }
                });
            }

            return result.promise();
        }

        // Check all docs in parallel
        // (fail fast b/c we won't continue syncing if there was any error fetching timestamps)
        return Async.doInParallel(docs, checkDoc, true);
    }

    /**
     * Scans all the files in the working set that do not have Documents (and thus were not scanned
     * by findExternalChanges()). If any were deleted on disk, removes them from the working set.
     */
    function syncUnopenWorkingSet() {
        // We only care about working set entries that have never been open (have no Document).
        var unopenWorkingSetFiles = MainViewManager.getWorkingSet(MainViewManager.ALL_PANES).filter(function (wsFile) {
            return !DocumentManager.getOpenDocumentForPath(wsFile.fullPath);
        });

        function checkWorkingSetFile(file) {
            var result = new $.Deferred();

            file.stat(function (err, stat) {
                if (!err) {
                    // File still exists
                    result.resolve();
                } else {
                    // File has been deleted externally
                    if (err === FileSystemError.NOT_FOUND) {
                        DocumentManager.notifyFileDeleted(file);
                        result.resolve();
                    } else {
                        // Some other error fetching metadata: treat as a real error
                        console.log("Error checking for deletion of " + file.fullPath, err);
                        result.reject();
                    }
                }
            });
            return result.promise();
        }

        // Check all these files in parallel
        return Async.doInParallel(unopenWorkingSetFiles, checkWorkingSetFile, false);
    }


    /**
     * Reloads the Document's contents from disk, discarding any unsaved changes in the editor.
     *
     * @param {!Document} doc
     * @return {$.Promise} Resolved after editor has been refreshed; rejected if unable to load the
     *      file's new content. Errors are logged but no UI is shown.
     */
    function reloadDoc(doc) {

        var promise = FileUtils.readAsText(doc.file);

        promise.done(function (text, readTimestamp) {
            doc.refreshText(text, readTimestamp);
        });
        promise.fail(function (error) {
            console.log("Error reloading contents of " + doc.file.fullPath, error);
        });
        return promise;
    }

    /**
     * Reloads all the documents in "toReload" silently (no prompts). The operations are all run
     * in parallel.
     * @return {$.Promise} Resolved/rejected after all reloads done; will be rejected if any one
     *      file's reload failed. Errors are logged (by reloadDoc()) but no UI is shown.
     */
    function reloadChangedDocs() {
        // Reload each doc in turn, and once all are (async) done, signal that we're done
        return Async.doInParallel(toReload, reloadDoc, false);
    }

    /**
     * @param {FileError} error
     * @param {!Document} doc
     * @return {Dialog}
     */
    function showReloadError(error, doc) {
        return Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_ERROR,
            Strings.ERROR_RELOADING_FILE_TITLE,
            StringUtils.format(
                Strings.ERROR_RELOADING_FILE,
                StringUtils.breakableUrl(doc.file.fullPath),
                FileUtils.getFileErrorString(error)
            )
        );
    }


    /**
     * Closes all the documents in "toClose" silently (no prompts). Completes synchronously.
     */
    function closeDeletedDocs() {
        toClose.forEach(function (doc) {
            DocumentManager.notifyFileDeleted(doc.file);
        });
    }


    /**
     * Walks through all the documents in "editConflicts" & "deleteConflicts" and prompts the user
     * about each one. Processing is sequential: if the user chooses to reload a document, the next
     * prompt is not shown until after the reload has completed.
     *
     * @param {string} title Title of the dialog.
     * @return {$.Promise} Resolved/rejected after all documents have been prompted and (if
     *      applicable) reloaded (and any resulting error UI has been dismissed). Rejected if any
     *      one reload failed.
     */
    function presentConflicts(title) {

        var allConflicts = editConflicts.concat(deleteConflicts);

        function presentConflict(docInfo, i) {
            var result = new $.Deferred(),
                promise = result.promise(),
                doc = docInfo.doc,
                fileTime = docInfo.fileTime;

            // If window has been re-focused, skip all remaining conflicts so the sync can bail & restart
            if (_restartPending) {
                result.resolve();
                return promise;
            }

            var toClose;
            var dialogId;
            var message;
            var buttons;

            // Prompt UI varies depending on whether the file on disk was modified vs. deleted
            if (i < editConflicts.length) {
                toClose = false;
                dialogId = DefaultDialogs.DIALOG_ID_EXT_CHANGED;
                message = StringUtils.format(
                    Strings.EXT_MODIFIED_MESSAGE,
                    StringUtils.breakableUrl(
                        ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath)
                    )
                );
                buttons = [
                    {
                        className: Dialogs.DIALOG_BTN_CLASS_LEFT,
                        id:        Dialogs.DIALOG_BTN_DONTSAVE,
                        text:      Strings.RELOAD_FROM_DISK
                    },
                    {
                        className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id:        Dialogs.DIALOG_BTN_CANCEL,
                        text:      Strings.KEEP_CHANGES_IN_EDITOR
                    }
                ];

            } else {
                toClose = true;
                dialogId = DefaultDialogs.DIALOG_ID_EXT_DELETED;
                message = StringUtils.format(
                    Strings.EXT_DELETED_MESSAGE,
                    StringUtils.breakableUrl(
                        ProjectManager.makeProjectRelativeIfPossible(doc.file.fullPath)
                    )
                );
                buttons = [
                    {
                        className: Dialogs.DIALOG_BTN_CLASS_LEFT,
                        id:        Dialogs.DIALOG_BTN_DONTSAVE,
                        text:      Strings.CLOSE_DONT_SAVE
                    },
                    {
                        className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id:        Dialogs.DIALOG_BTN_CANCEL,
                        text:      Strings.KEEP_CHANGES_IN_EDITOR
                    }
                ];
            }

            Dialogs.showModalDialog(dialogId, title, message, buttons)
                .done(function (id) {
                    if (id === Dialogs.DIALOG_BTN_DONTSAVE) {
                        if (toClose) {
                            // Discard - close all editors
                            DocumentManager.notifyFileDeleted(doc.file);
                            result.resolve();
                        } else {
                            // Discard - load changes from disk
                            reloadDoc(doc)
                                .done(function () {
                                    result.resolve();
                                })
                                .fail(function (error) {
                                    // Unable to load changed version from disk - show error UI
                                    showReloadError(error, doc)
                                        .done(function () {
                                            // After user dismisses, move on to next conflict prompt
                                            result.reject();
                                        });
                                });
                        }

                    } else {
                        // Cancel - if user doesn't manually save or close, remember that they
                        // chose to keep the changes in the editor and don't prompt again unless the
                        // file changes again
                        // OR programmatically canceled due to _resetPending - we'll skip all
                        // remaining files in the conflicts list (see above)

                        // If this wasn't programmatically cancelled, remember that the user
                        // has accepted conflicting changes as of this file version.
                        if (!_restartPending) {
                            doc.keepChangesTime = fileTime;
                        }

                        result.resolve();
                    }
                });

            return promise;
        }

        // Begin walking through the conflicts, one at a time
        return Async.doSequentially(allConflicts, presentConflict, false);
    }



    /**
     * Check to see whether any open files have been modified by an external app since the last time
     * Brackets synced up with the copy on disk (either by loading or saving the file). For clean
     * files, we silently upate the editor automatically. For files with unsaved changes, we prompt
     * the user.
     *
     * @param {string} title Title to use for document. Default is "External Changes".
     */
    function syncOpenDocuments(title) {

        title = title || Strings.EXT_MODIFIED_TITLE;

        // We can become "re-entrant" if the user leaves & then returns to Brackets before we're
        // done -- easy if a prompt dialog is left open. Since the user may have left Brackets to
        // revert some of the disk changes, etc. we want to cancel the current sync and immediately
        // begin a new one. We let the orig sync run until the user-visible dialog phase, then
        // bail; if we're already there we programmatically close the dialog to bail right away.
        if (_alreadyChecking) {
            _restartPending = true;

            // Close dialog if it was open. This will 'unblock' presentConflict(), which bails back
            // to us immediately upon seeing _restartPending. We then restart the sync - see below
            Dialogs.cancelModalDialogIfOpen(DefaultDialogs.DIALOG_ID_EXT_CHANGED);
            Dialogs.cancelModalDialogIfOpen(DefaultDialogs.DIALOG_ID_EXT_DELETED);

            return;
        }

        _alreadyChecking = true;


        // Syncing proceeds in four phases:
        //  1) Check all open files for external modifications
        //  2) Check any other working set entries (that are not open) for deletion, and remove
        //     from working set if deleted
        //  3) Refresh all Documents that are clean (if file changed on disk)
        //  4) Close all Documents that are clean (if file deleted on disk)
        //  5) Prompt about any Documents that are dirty (if file changed/deleted on disk)
        // Each phase fully completes (asynchronously) before the next one begins.


        // 1) Check for external modifications
        var allDocs = DocumentManager.getAllOpenDocuments();

        findExternalChanges(allDocs)
            .done(function () {
                // 2) Check un-open working set entries for deletion (& "close" if needed)
                syncUnopenWorkingSet()
                    .always(function () {
                        // If we were unable to check any un-open files for deletion, silently ignore
                        // (after logging to console). This doesn't have any bearing on syncing truly
                        // open Documents (which we've already successfully checked).

                        // 3) Reload clean docs as needed
                        reloadChangedDocs()
                            .always(function () {
                                // 4) Close clean docs as needed
                                // This phase completes synchronously
                                closeDeletedDocs();

                                // 5) Prompt for dirty editors (conflicts)
                                presentConflicts(title)
                                    .always(function () {
                                        if (_restartPending) {
                                            // Restart the sync if needed
                                            _restartPending = false;
                                            _alreadyChecking = false;
                                            syncOpenDocuments();
                                        } else {
                                            // We're really done!
                                            _alreadyChecking = false;

                                            // If we showed a dialog, restore focus to editor
                                            if (editConflicts.length > 0 || deleteConflicts.length > 0) {
                                                MainViewManager.focusActivePane();
                                            }

                                            // (Any errors that ocurred during presentConflicts() have already
                                            // shown UI & been dismissed, so there's no fail() handler here)
                                        }
                                    });
                            });
                            // Note: if any auto-reloads failed, we silently ignore (after logging to console)
                            // and we still continue onto phase 4 and try to process those files anyway.
                            // (We'll retry the auto-reloads next time window is activated... and evenually
                            // we'll also be double checking before each Save).
                    });
            }).fail(function () {
                // Unable to fetch timestamps for some reason - silently ignore (after logging to console)
                // (We'll retry next time window is activated... and evenually we'll also be double
                // checking before each Save).

                // We can't go on without knowing which files are dirty, so bail now
                _alreadyChecking = false;
            });

    }


    // Define public API
    exports.syncOpenDocuments = syncOpenDocuments;
});

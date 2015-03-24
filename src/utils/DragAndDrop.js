 /*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";
   
    var Async           = require("utils/Async"),
        CommandManager  = require("command/CommandManager"),
        Commands        = require("command/Commands"),
        Dialogs         = require("widgets/Dialogs"),
        DefaultDialogs  = require("widgets/DefaultDialogs"),
        MainViewManager = require("view/MainViewManager"),
        FileSystem      = require("filesystem/FileSystem"),
        FileUtils       = require("file/FileUtils"),
        ProjectManager  = require("project/ProjectManager"),
        Strings         = require("strings"),
        StringUtils     = require("utils/StringUtils");
    
    /**
     * Returns true if the drag and drop items contains valid drop objects.
     * @param {Array.<DataTransferItem>} items Array of items being dragged
     * @return {boolean} True if one or more items can be dropped.
     */
    function isValidDrop(items) {
        var i, len = items.length;
        
        for (i = 0; i < len; i++) {
            if (items[i].kind === "file") {
                var entry = items[i].webkitGetAsEntry();
                
                if (entry.isFile) {
                    // If any files are being dropped, this is a valid drop
                    return true;
                } else if (len === 1) {
                    // If exactly one folder is being dropped, this is a valid drop
                    return true;
                }
            }
        }
        
        // No valid entries found
        return false;
    }
    
    /**
     * Open dropped files
     * @param {Array.<string>} files Array of files dropped on the application.
     * @return {Promise} Promise that is resolved if all files are opened, or rejected
     *     if there was an error. 
     */
    function openDroppedFiles(paths) {
        var errorFiles = [],
            ERR_MULTIPLE_ITEMS_WITH_DIR = {};
        
        return Async.doInParallel(paths, function (path, idx) {
            var result = new $.Deferred();
            
            // Only open files.
            FileSystem.resolve(path, function (err, item) {
                if (!err && item.isFile) {
                    // If the file is already open, and this isn't the last
                    // file in the list, return. If this *is* the last file,
                    // always open it so it gets selected.
                    if (idx < paths.length - 1) {
                        if (MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, path) !== -1) {
                            result.resolve();
                            return;
                        }
                    }
                    
                    CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,
                                           {fullPath: path, silent: true})
                        .done(function () {
                            result.resolve();
                        })
                        .fail(function (openErr) {
                            errorFiles.push({path: path, error: openErr});
                            result.reject();
                        });
                } else if (!err && item.isDirectory && paths.length === 1) {
                    // One folder was dropped, open it.
                    ProjectManager.openProject(path)
                        .done(function () {
                            result.resolve();
                        })
                        .fail(function () {
                            // User was already notified of the error.
                            result.reject();
                        });
                } else {
                    errorFiles.push({path: path, error: err || ERR_MULTIPLE_ITEMS_WITH_DIR});
                    result.reject();
                }
            });
            
            return result.promise();
        }, false)
            .fail(function () {
                function errorToString(err) {
                    if (err === ERR_MULTIPLE_ITEMS_WITH_DIR) {
                        return Strings.ERROR_MIXED_DRAGDROP;
                    } else {
                        return FileUtils.getFileErrorString(err);
                    }
                }

                if (errorFiles.length > 0) {
                    var message = Strings.ERROR_OPENING_FILES;
                    
                    message += "<ul class='dialog-list'>";
                    errorFiles.forEach(function (info) {
                        message += "<li><span class='dialog-filename'>" +
                            StringUtils.breakableUrl(ProjectManager.makeProjectRelativeIfPossible(info.path)) +
                            "</span> - " + errorToString(info.error) +
                            "</li>";
                    });
                    message += "</ul>";
                    
                    Dialogs.showModalDialog(
                        DefaultDialogs.DIALOG_ID_ERROR,
                        Strings.ERROR_OPENING_FILE_TITLE,
                        message
                    );
                }
            });
    }
    
    
    /**
     * Attaches global drag & drop handlers to this window. This enables dropping files/folders to open them, and also
     * protects the Brackets app from being replaced by the browser trying to load the dropped file in its place.
     */
    function attachHandlers() {
        
        function handleDragOver(event) {
            event = event.originalEvent || event;
            
            var files = event.dataTransfer.files;
            if (files && files.length) {
                event.stopPropagation();
                event.preventDefault();
                
                var dropEffect = "none";
                
                // Don't allow drag-and-drop of files/folders when a modal dialog is showing.
                if ($(".modal.instance").length === 0 && isValidDrop(event.dataTransfer.items)) {
                    dropEffect = "copy";
                }
                event.dataTransfer.dropEffect = dropEffect;
            }
        }
        
        function handleDrop(event) {
            event = event.originalEvent || event;
            
            var files = event.dataTransfer.files;
            if (files && files.length) {
                event.stopPropagation();
                event.preventDefault();
                
                brackets.app.getDroppedFiles(function (err, paths) {
                    if (!err) {
                        openDroppedFiles(paths);
                    }
                });
            }
        }
        
        // For most of the window, only respond if nothing more specific in the UI has already grabbed the event (e.g.
        // the Extension Manager drop-to-install zone, or an extension with a drop-to-upload zone in its panel)
        $(window.document.body)
            .on("dragover", handleDragOver)
            .on("drop", handleDrop);
        
        // Over CodeMirror specifically, always pre-empt CodeMirror's drag event handling if files are being dragged - CM stops
        // propagation on any drag event it sees, even when it's not a text drag/drop. But allow CM to handle all non-file drag
        // events. See bug #10617.
        window.document.body.addEventListener("dragover", function (event) {
            if ($(event.target).closest(".CodeMirror").length) {
                handleDragOver(event);
            }
        }, true);
        window.document.body.addEventListener("drop", function (event) {
            if ($(event.target).closest(".CodeMirror").length) {
                handleDrop(event);
            }
        }, true);
    }
    
    
    CommandManager.register(Strings.CMD_OPEN_DROPPED_FILES, Commands.FILE_OPEN_DROPPED_FILES, openDroppedFiles);

    // Export public API
    exports.attachHandlers      = attachHandlers;
    exports.isValidDrop         = isValidDrop;
    exports.openDroppedFiles    = openDroppedFiles;
});

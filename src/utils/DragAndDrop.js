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
/*global define, $, window, brackets */

define(function (require, exports, module) {
    "use strict";
   
    var Async           = require("utils/Async"),
        CommandManager  = require("command/CommandManager"),
        Commands        = require("command/Commands"),
        Dialogs         = require("widgets/Dialogs"),
        DefaultDialogs  = require("widgets/DefaultDialogs"),
        DocumentManager = require("document/DocumentManager"),
        FileSystem      = require("filesystem/FileSystem"),
        EditorManager   = require("editor/EditorManager"),
        FileUtils       = require("file/FileUtils"),
        ProjectManager  = require("project/ProjectManager"),
        Strings         = require("strings"),
        StringUtils     = require("utils/StringUtils");
    
    /**
     * Return an array of files excluding all files with a custom viewer. If all files
     * in the array have their own custom viewers, then the last file is added back in
     * the array since only one file with custom viewer can be open at a time.
     *
     * @param {Array.<string>} files Array of files to filter before opening.
     * @return {Array.<string>}
     */
    function filterFilesToOpen(files) {
        // Filter out all files that have their own custom viewers
        // since we don't keep them in the working set.
        var filteredFiles = files.filter(function (file) {
            return !EditorManager.getCustomViewerForPath(file);
        });
        
        // If all files have custom viewers, then add back the last file
        // so that we open it in its custom viewer.
        if (filteredFiles.length === 0 && files.length) {
            filteredFiles.push(files[files.length - 1]);
        }
        
        return filteredFiles;
    }
    
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
    function openDroppedFiles(files) {
        var errorFiles = [],
            filteredFiles = filterFilesToOpen(files);
        
        return Async.doInParallel(filteredFiles, function (path, idx) {
            var result = new $.Deferred();
            
            // Only open files.
            FileSystem.resolve(path, function (err, item) {
                if (!err && item.isFile) {
                    // If the file is already open, and this isn't the last
                    // file in the list, return. If this *is* the last file,
                    // always open it so it gets selected.
                    if (idx < filteredFiles.length - 1) {
                        if (DocumentManager.findInWorkingSet(path) !== -1) {
                            result.resolve();
                            return;
                        }
                    }
                    
                    CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET,
                                           {fullPath: path, silent: true})
                        .done(function () {
                            result.resolve();
                        })
                        .fail(function () {
                            errorFiles.push(path);
                            result.reject();
                        });
                } else if (!err && item.isDirectory && filteredFiles.length === 1) {
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
                    errorFiles.push(path);
                    result.reject();
                }
            });
            
            return result.promise();
        }, false)
            .fail(function () {
                if (errorFiles.length > 0) {
                    var message = Strings.ERROR_OPENING_FILES;
                    
                    message += "<ul class='dialog-list'>";
                    errorFiles.forEach(function (file) {
                        message += "<li><span class='dialog-filename'>" +
                            StringUtils.breakableUrl(ProjectManager.makeProjectRelativeIfPossible(file)) +
                            "</span></li>";
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
    
    CommandManager.register(Strings.CMD_OPEN_DROPPED_FILES, Commands.FILE_OPEN_DROPPED_FILES, openDroppedFiles);

    // Export public API
    exports.isValidDrop         = isValidDrop;
    exports.openDroppedFiles    = openDroppedFiles;
    exports.filterFilesToOpen   = filterFilesToOpen;
});
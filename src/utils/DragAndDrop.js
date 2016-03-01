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
/*global define, $, FileReader*/

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

    // Bramble specific bits
    var _               = require("thirdparty/lodash"),
        Filer           = require("filesystem/impls/filer/BracketsFiler"),
        Path            = Filer.Path,
        Content         = require("filesystem/impls/filer/lib/content"),
        LanguageManager = require("language/LanguageManager"),
        StartupState    = require("bramble/StartupState"),
        ArchiveUtils    = require("filesystem/impls/filer/ArchiveUtils");

    // 3MB size limit for imported files. If you change this, also change the
    // error message we generate in rejectImport() below!
    var byteLimit = 3145728;

    /**
     * Returns true if the drag and drop items contains valid drop objects.
     * @param {Array.<DataTransferItem>} items Array of items being dragged
     * @return {boolean} True if one or more items can be dropped.
     */
    function isValidDrop(types) {
        if (types) {
            for (var i = 0; i < types.length; i++) {
                if (types[i] === "Files") {
                    return true;
                }

            }
        }
        return false;
    }

    function _showErrorDialog(errorFiles, callback) {
        function errorToString(err) {
            return FileUtils.getFileErrorString(err);
        }

        if (!errorFiles.length) {
            return;
        }

        var message = Strings.ERROR_OPENING_FILES;

        message += "<ul class='dialog-list'>";
        errorFiles.forEach(function (info) {
            message += "<li><span class='dialog-filename'>" +
                StringUtils.breakableUrl(ProjectManager.makeProjectRelativeIfPossible(info.path)) +
                "</span> - " + errorToString(info.error) +
                "</li>";
        });
        message += "</ul>";

        var dlg = Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_ERROR,
            Strings.ERROR_OPENING_FILE_TITLE,
            message
        );

        if(callback) {
            dlg.done(callback);
        }
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
                _showErrorDialog(errorFiles);
            });
    }


    /**
     * Attaches global drag & drop handlers to this window. This enables dropping files/folders to open them, and also
     * protects the Brackets app from being replaced by the browser trying to load the dropped file in its place.
     */
    function attachHandlers(options) {
        // XXXBramble: we want to reuse this code for the UploadFiles extension
        // so we add support for passing exra options here.
        options = options || {};
        options.elem = options.elem || window.document.body;
        // Support optional events hooks
        var noop = function(){};
        options.ondragover = options.ondragover || noop;
        options.ondragleave = options.ondragleave || noop;
        options.ondrop = options.ondrop || noop;
        options.onfilesdone = options.onfilesdone || noop;

        // XXXBramble: extra dragleave event for UI updates in UploadFiles
        function handleDragLeave(event) {
            event = event.originalEvent || event;
            event.stopPropagation();
            event.preventDefault();

            options.ondragleave(event);
        }

        function handleDragOver(event) {
            event = event.originalEvent || event;
            event.stopPropagation();
            event.preventDefault();

            options.ondragover(event);

            var dropEffect =  "none";
            // XXXBramble: we want to reuse this in the UploadFiles modal, so treat body differently
            if(isValidDrop(event.dataTransfer.types)) {
                if(options.elem === window.document.body) {
                    if($(".modal.instance").length === 0) {
                        dropEffect = "copy";
                    }
                } else {
                    dropEffect = "copy";
                }
            }
            event.dataTransfer.dropEffect = dropEffect;
        }

        function handleDrop(event) {
            event = event.originalEvent || event;
            event.stopPropagation();
            event.preventDefault();

            options.ondrop(event);

            var files = event.dataTransfer.files;
            processFiles(files, function() {
                options.onfilesdone();

                if(options.autoRemoveHandlers) {
                    var elem = options.elem;
                    $(elem)
                        .off("dragover", handleDragOver)
                        .off("dragleave", handleDragLeave)
                        .off("drop", handleDrop);

                    elem.removeEventListener("dragover", codeMirrorDragOverHandler, true);
                    elem.removeEventListener("dragleave", codeMirrorDragLeaveHandler, true);
                    elem.removeEventListener("drop", codeMirrorDropHandler, true);
                }
            });
        }

        // For most of the window, only respond if nothing more specific in the UI has already grabbed the event (e.g.
        // the Extension Manager drop-to-install zone, or an extension with a drop-to-upload zone in its panel)
        $(options.elem)
            .on("dragover", handleDragOver)
            .on("dragleave", handleDragLeave)
            .on("drop", handleDrop);

        // Over CodeMirror specifically, always pre-empt CodeMirror's drag event handling if files are being dragged - CM stops
        // propagation on any drag event it sees, even when it's not a text drag/drop. But allow CM to handle all non-file drag
        // events. See bug #10617.
        var codeMirrorDragOverHandler = function (event) {
            if ($(event.target).closest(".CodeMirror").length) {
                handleDragOver(event);
            }
        };
        var codeMirrorDropHandler = function (event) {
            if ($(event.target).closest(".CodeMirror").length) {
                handleDrop(event);
            }
        };
        var codeMirrorDragLeaveHandler = function (event) {
            if ($(event.target).closest(".CodeMirror").length) {
                handleDragLeave(event);
            }
        };
        options.elem.addEventListener("dragover", codeMirrorDragOverHandler, true);
        options.elem.addEventListener("dragleave", codeMirrorDragLeaveHandler, true);
        options.elem.addEventListener("drop", codeMirrorDropHandler, true);
    }

    // XXXBramble: given a list of dropped files, write them into the fs, unzipping zip files.
    function processFiles(files, callback) {
        var pathList = [];
        var errorList = [];

        if (!(files && files.length)) {
            return callback();
        }

        function shouldOpenFile(filename, encoding) {
            return Content.isImage(Path.extname(filename)) || encoding === "utf8";
        }

        function handleRegularFile(deferred, file, filename, buffer, encoding) {
            file.write(buffer, {encoding: encoding}, function(err) {
                if (err) {
                    errorList.push({path: filename, error: "unable to write file: " + err.message || ""});
                    deferred.reject(err);
                    return;
                }

                // See if this file is worth trying to open in the editor or not
                if(shouldOpenFile(filename, encoding)) {
                    pathList.push(filename);
                }

                deferred.resolve();
            });
        }

        function handleZipFile(deferred, file, filename, buffer, encoding) {
            var basename = Path.basename(filename);

            ArchiveUtils.unzip(buffer, function(err) {
                if (err) {
                    errorList.push({path: filename, error: Strings.DND_ERROR_UNZIP});
                    deferred.reject(err);
                    return;
                }

                Dialogs.showModalDialog(
                    DefaultDialogs.DIALOG_ID_INFO,
                    Strings.DND_SUCCESS_UNZIP_TITLE,
                    StringUtils.format(Strings.DND_SUCCESS_UNZIP, basename)
                ).getPromise().then(deferred.resolve, deferred.reject);
            });
        }

        function handleTarFile(deferred, file, filename, buffer, encoding) {
            var basename = Path.basename(filename);

            ArchiveUtils.untar(buffer, function(err) {
                if (err) {
                    errorList.push({path: filename, error: Strings.DND_ERROR_UNTAR});
                    deferred.reject(err);
                    return;
                }

                Dialogs.showModalDialog(
                    DefaultDialogs.DIALOG_ID_INFO,
                    Strings.DND_SUCCESS_UNTAR_TITLE,
                    StringUtils.format(Strings.DND_SUCCESS_UNTAR, basename)
                ).getPromise().then(deferred.resolve, deferred.reject);
            });
        }

        /**
         * Determine whether we want to import this file at all.  If it's too large
         * or not a mime type we care about, reject it.
         */
        function rejectImport(item) {
            if (item.size > byteLimit) {
                return new Error(Strings.DND_MAX_FILE_SIZE_EXCEEDED);
            }

            // If we don't know about this language type, or the OS doesn't think
            // it's text, reject it.
            var ext = Path.extname(item.name).replace(/^\./, "").toLowerCase();
            var languageIsSupported = !!LanguageManager.getLanguageForExtension(ext);
            var typeIsText = Content.isTextType(item.type);

            if (languageIsSupported || typeIsText) {
                return null;
            }
            return new Error(Strings.DND_UNSUPPORTED_FILE_TYPE);
        }

        function prepareDropPaths(fileList) {
            // Convert FileList object to an Array with all image files first, then CSS
            // followed by HTML files at the end, since we need to write any .css, .js, etc.
            // resources first such that Blob URLs can be generated for these resources
            // prior to rewriting an HTML file.
            function rateFileByType(filename) {
                var ext = Path.extname(filename);

                // We want to end up with: [images, ..., js, ..., css, html]
                // since CSS can include images, and HTML can include CSS or JS.
                // We also treat .md like an HTML file, since we render them.
                if(Content.isHTML(ext) || Content.isMarkdown(ext)) {
                    return 10;
                } else if(Content.isCSS(ext)) {
                    return 8;
                } else if(Content.isImage(ext)) {
                    return 1;
                }
                return 3;
            }

            return _.toArray(fileList).sort(function(a,b) {
                a = rateFileByType(a.name);
                b = rateFileByType(b.name);

                if(a < b) {
                    return -1;
                }
                if(a > b) {
                    return 1;
                }
                return 0;
            });
        }

        function maybeImportFile(item) {
            var deferred = new $.Deferred();
            var reader = new FileReader();

            // Check whether we want to import this file at all before we start.
            var wasRejected = rejectImport(item);
            if (wasRejected) {
                errorList.push({path: item.name, error: wasRejected.message});
                deferred.reject(wasRejected);
                return deferred.promise();
            }

            reader.onload = function(e) {
                delete reader.onload;

                var filename = Path.join(StartupState.project("root"), item.name);
                var file = FileSystem.getFileForPath(filename);
                var ext = Path.extname(filename).toLowerCase();

                // Create a Filer Buffer, and determine the proper encoding. We
                // use the extension, and also the OS provided mime type for clues.
                var buffer = new Filer.Buffer(e.target.result);
                var utf8FromExt = Content.isUTF8Encoded(ext);
                var utf8FromOS = Content.isTextType(item.type);
                var encoding =  utf8FromExt || utf8FromOS ? 'utf8' : null;
                if(encoding === 'utf8') {
                    buffer = buffer.toString();
                }

                // Special-case .zip files, so we can offer to extract the contents
                if(ext === ".zip") {
                    handleZipFile(deferred, file, filename, buffer, encoding);
                } else if(ext === ".tar") {
                    handleTarFile(deferred, file, filename, buffer, encoding);
                } else {
                    handleRegularFile(deferred, file, filename, buffer, encoding);
                }
            };

            // Deal with error cases, for example, trying to drop a folder vs. file
            reader.onerror = function(e) {
                delete reader.onerror;

                errorList.push({path: item.name, error: e.target.error.message});
                deferred.reject(e.target.error);
            };
            reader.readAsArrayBuffer(item);

            return deferred.promise();
        }

        Async.doSequentially(prepareDropPaths(files), maybeImportFile, false)
            .done(function() {
                openDroppedFiles(pathList);
                callback(null, pathList);
            })
            .fail(function() {
                _showErrorDialog(errorList, function() {
                    callback(errorList);
                });
            });
    }

    CommandManager.register(Strings.CMD_OPEN_DROPPED_FILES, Commands.FILE_OPEN_DROPPED_FILES, openDroppedFiles);

    // Export public API
    exports.attachHandlers      = attachHandlers;
    exports.isValidDrop         = isValidDrop;
    exports.openDroppedFiles    = openDroppedFiles;
    exports.processFiles        = processFiles;
});

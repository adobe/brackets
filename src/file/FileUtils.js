/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, FileError, brackets, unescape, window */

/**
 * Set of utilites for working with files and text content.
 */
define(function (require, exports, module) {
    "use strict";

    require("utils/Global");
    
    var NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        PerfUtils           = require("utils/PerfUtils"),
        Dialogs             = require("widgets/Dialogs"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        Encodings           = NativeFileSystem.Encodings;

    
    /**
     * Asynchronously reads a file as UTF-8 encoded text.
     * @return {$.Promise} a jQuery promise that will be resolved with the 
     *  file's text content plus its timestamp, or rejected with a FileError if
     *  the file can not be read.
     */
    function readAsText(fileEntry) {
        var result = new $.Deferred(),
            reader;

        // Measure performance
        var perfTimerName = PerfUtils.markStart("readAsText:\t" + fileEntry.fullPath);
        result.always(function () {
            PerfUtils.addMeasurement(perfTimerName);
        });

        // Read file
        reader = new NativeFileSystem.FileReader();
        fileEntry.file(function (file) {
            reader.onload = function (event) {
                var text = event.target.result;
                
                fileEntry.getMetadata(
                    function (metadata) {
                        result.resolve(text, metadata.modificationTime);
                    },
                    function (error) {
                        result.reject(error);
                    }
                );
            };

            reader.onerror = function (event) {
                result.reject(event.target.error);
            };

            reader.readAsText(file, Encodings.UTF8);
        });

        return result.promise();
    }
    
    /**
     * Asynchronously writes a file as UTF-8 encoded text.
     * @param {!FileEntry} fileEntry
     * @param {!string} text
     * @return {$.Promise} a jQuery promise that will be resolved when
     * file writing completes, or rejected with a FileError.
     */
    function writeText(fileEntry, text) {
        var result = new $.Deferred();
        
        fileEntry.createWriter(function (fileWriter) {
            fileWriter.onwriteend = function (e) {
                result.resolve();
            };
            fileWriter.onerror = function (err) {
                result.reject(err);
            };

            // TODO (issue #241): NativeFileSystem.BlobBulder
            fileWriter.write(text);
        });
        
        return result.promise();
    }

    /** @const */
    var LINE_ENDINGS_CRLF = "CRLF";
    /** @const */
    var LINE_ENDINGS_LF = "LF";
    
    /**
     * Returns the standard line endings for the current platform
     * @return {LINE_ENDINGS_CRLF|LINE_ENDINGS_LF}
     */
    function getPlatformLineEndings() {
        return brackets.platform === "win" ? LINE_ENDINGS_CRLF : LINE_ENDINGS_LF;
    }
    
    /**
     * Scans the first 1000 chars of the text to determine how it encodes line endings. Returns
     * null if usage is mixed or if no line endings found.
     * @param {!string} text
     * @return {null|LINE_ENDINGS_CRLF|LINE_ENDINGS_LF}
     */
    function sniffLineEndings(text) {
        var subset = text.substr(0, 1000);  // (length is clipped to text.length)
        var hasCRLF = /\r\n/.test(subset);
        var hasLF = /[^\r]\n/.test(subset);
        
        if ((hasCRLF && hasLF) || (!hasCRLF && !hasLF)) {
            return null;
        } else {
            return hasCRLF ? LINE_ENDINGS_CRLF : LINE_ENDINGS_LF;
        }
    }

    /**
     * Translates any line ending types in the given text to the be the single form specified
     * @param {!string} text
     * @param {null|LINE_ENDINGS_CRLF|LINE_ENDINGS_LF} lineEndings
     * @return {string}
     */
    function translateLineEndings(text, lineEndings) {
        if (lineEndings !== LINE_ENDINGS_CRLF && lineEndings !== LINE_ENDINGS_LF) {
            lineEndings = getPlatformLineEndings();
        }
        
        var eolStr = (lineEndings === LINE_ENDINGS_CRLF ? "\r\n" : "\n");
        var findAnyEol = /\r\n|\r|\n/g;
        
        return text.replace(findAnyEol, eolStr);
    }

    function getFileErrorString(code) {
        // There are a few error codes that we have specific error messages for. The rest are
        // displayed with a generic "(error N)" message.
        var result;

        if (code === FileError.NOT_FOUND_ERR) {
            result = Strings.NOT_FOUND_ERR;
        } else if (code === FileError.NOT_READABLE_ERR) {
            result = Strings.NOT_READABLE_ERR;
        } else if (code === FileError.NO_MODIFICATION_ALLOWED_ERR) {
            result = Strings.NO_MODIFICATION_ALLOWED_ERR_FILE;
        } else {
            result = StringUtils.format(Strings.GENERIC_ERROR, code);
        }

        return result;
    }
    
    function showFileOpenError(code, path) {
        return Dialogs.showModalDialog(
            Dialogs.DIALOG_ID_ERROR,
            Strings.ERROR_OPENING_FILE_TITLE,
            StringUtils.format(
                Strings.ERROR_OPENING_FILE,
                StringUtils.htmlEscape(path),
                getFileErrorString(code)
            )
        );
    }

    /**
     * Convert a URI path to a native path.
     * On both platforms, this unescapes the URI
     * On windows, URI paths start with a "/", but have a drive letter ("C:"). In this
     * case, remove the initial "/".
     * @param {!string} path
     * @return {string}
     */
    function convertToNativePath(path) {
        path = unescape(path);
        if (path.indexOf(":") !== -1 && path[0] === "/") {
            return path.substr(1);
        }
        
        return path;
    }
    
    /**
     * Canonicalizes a folder path to not include a trailing slash.
     * @param {string} path
     * @return {string}
     */
    function canonicalizeFolderPath(path) {
        if (path.length > 0 && path[path.length - 1] === "/") {
            return path.slice(0, -1);
        } else {
            return path;
        }
    }

    /**
     * Returns a native absolute path to the 'brackets' source directory.
     * Note that this only works when run in brackets/src/index.html, so it does
     * not work for unit tests (which is run from brackets/test/SpecRunner.html)
     * @return {string}
     */
    function getNativeBracketsDirectoryPath() {
        var pathname = decodeURI(window.location.pathname);
        var directory = pathname.substr(0, pathname.lastIndexOf("/"));
        return convertToNativePath(directory);
    }
    
    /**
     * Given the module object passed to JS module define function,
     * convert the path to a native absolute path.
     * Returns a native absolute path to the module folder.
     * @return {string}
     */
    function getNativeModuleDirectoryPath(module) {
        var path;
        
        if (module && module.uri) {
            path = decodeURI(module.uri);
            
            // Remove module name and trailing slash from path.
            path = path.substr(0, path.lastIndexOf("/"));
        }
        return path;
    }
    
    /**
     * Update a file entry path after a file/folder name change.
     * @param {FileEntry} entry The FileEntry or DirectoryEntry to update
     * @param {string} oldName The full path of the old name
     * @param {string} newName The full path of the new name
     * @return {boolean} Returns true if the file entry was updated
     */
    function updateFileEntryPath(entry, oldName, newName) {
        if (entry.fullPath.indexOf(oldName) === 0) {
            var fullPath = entry.fullPath.replace(oldName, newName);
            
            entry.fullPath = fullPath;
            
            // TODO: Should this be a method on Entry instead?
            entry.name = null; // default if extraction fails
            if (fullPath) {
                var pathParts = fullPath.split("/");
                
                // Extract name from the end of the fullPath (account for trailing slash(es))
                while (!entry.name && pathParts.length) {
                    entry.name = pathParts.pop();
                }
            }
            
            return true;
        }
        
        return false;
    }

    /** @const - hard-coded for now, but may want to make these preferences */
    var _staticHtmlFileExts = ["htm", "html"],
        _serverHtmlFileExts = ["php", "php3", "php4", "php5", "phtm", "phtml", "cfm", "cfml", "shtm", "shtml"];

    /**
     * Determine if file extension is a static html file extension.
     * @param {String} file name with extension or just a file extension
     * @return {Boolean} Returns true if fileExt is in the list
     */
    function isStaticHtmlFileExt(fileExt) {
        if (!fileExt) {
            return false;
        }

        var i = fileExt.lastIndexOf("."),
            ext = (i === -1 || i >= fileExt.length - 1) ? fileExt : fileExt.substr(i + 1);

        return (_staticHtmlFileExts.indexOf(ext.toLowerCase()) !== -1);
    }

    /**
     * Determine if file extension is a server html file extension.
     * @param {String} file name with extension or just a file extension
     * @return {Boolean} Returns true if fileExt is in the list
     */
    function isServerHtmlFileExt(fileExt) {
        if (!fileExt) {
            return false;
        }

        var i = fileExt.lastIndexOf("."),
            ext = (i === -1 || i >= fileExt.length - 1) ? fileExt : fileExt.substr(i + 1);

        return (_serverHtmlFileExts.indexOf(ext.toLowerCase()) !== -1);
    }

    // Define public API
    exports.LINE_ENDINGS_CRLF              = LINE_ENDINGS_CRLF;
    exports.LINE_ENDINGS_LF                = LINE_ENDINGS_LF;
    exports.getPlatformLineEndings         = getPlatformLineEndings;
    exports.sniffLineEndings               = sniffLineEndings;
    exports.translateLineEndings           = translateLineEndings;
    exports.showFileOpenError              = showFileOpenError;
    exports.getFileErrorString             = getFileErrorString;
    exports.readAsText                     = readAsText;
    exports.writeText                      = writeText;
    exports.convertToNativePath            = convertToNativePath;
    exports.getNativeBracketsDirectoryPath = getNativeBracketsDirectoryPath;
    exports.getNativeModuleDirectoryPath   = getNativeModuleDirectoryPath;
    exports.canonicalizeFolderPath         = canonicalizeFolderPath;
    exports.updateFileEntryPath            = updateFileEntryPath;
    exports.isStaticHtmlFileExt            = isStaticHtmlFileExt;
    exports.isServerHtmlFileExt            = isServerHtmlFileExt;
});

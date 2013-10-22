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
        NativeFileError     = require("file/NativeFileError"),
        PerfUtils           = require("utils/PerfUtils"),
        Dialogs             = require("widgets/Dialogs"),
        DefaultDialogs      = require("widgets/DefaultDialogs"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        Encodings           = NativeFileSystem.Encodings;

    
    /**
     * Asynchronously reads a file as UTF-8 encoded text.
     * @return {$.Promise} a jQuery promise that will be resolved with the 
     *  file's text content plus its timestamp, or rejected with a NativeFileError if
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
        }, function (error) {
            result.reject(error);
        });

        return result.promise();
    }
    
    /**
     * Asynchronously writes a file as UTF-8 encoded text.
     * @param {!FileEntry} fileEntry
     * @param {!string} text
     * @return {$.Promise} a jQuery promise that will be resolved when
     * file writing completes, or rejected with a NativeFileError.
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
        }, function (error) {
            result.reject(error);
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

    function getFileErrorString(name) {
        // There are a few error codes that we have specific error messages for. The rest are
        // displayed with a generic "(error N)" message.
        var result;

        if (name === NativeFileError.NOT_FOUND_ERR) {
            result = Strings.NOT_FOUND_ERR;
        } else if (name === NativeFileError.NOT_READABLE_ERR) {
            result = Strings.NOT_READABLE_ERR;
        } else if (name === NativeFileError.NO_MODIFICATION_ALLOWED_ERR) {
            result = Strings.NO_MODIFICATION_ALLOWED_ERR_FILE;
        } else {
            result = StringUtils.format(Strings.GENERIC_ERROR, name);
        }

        return result;
    }
    
    function showFileOpenError(name, path) {
        return Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_ERROR,
            Strings.ERROR_OPENING_FILE_TITLE,
            StringUtils.format(
                Strings.ERROR_OPENING_FILE,
                StringUtils.breakableUrl(path),
                getFileErrorString(name)
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
     * Convert a Windows-native path to use Unix style slashes.
     * On Windows, this converts "C:\foo\bar\baz.txt" to "C:/foo/bar/baz.txt".
     * On Mac, this does nothing, since Mac paths are already in Unix syntax.
     * (Note that this does not add an initial forward-slash. Internally, our
     * APIs generally use the "C:/foo/bar/baz.txt" style for "native" paths.)
     * @param {string} path A native-style path.
     * @return {string} A Unix-style path.
     */
    function convertWindowsPathToUnixPath(path) {
        if (brackets.platform === "win") {
            path = path.replace(/\\/g, "/");
        }
        return path;
    }
    
    /**
     * Removes the trailing slash from a path, if it has one.
     * Warning: this differs from the format of most paths used in Brackets! Use paths ending in "/"
     * normally, as this is the format used by DirectoryEntry.fullPath.
     * 
     * @param {string} path
     * @return {string}
     */
    function stripTrailingSlash(path) {
        if (path && path[path.length - 1] === "/") {
            return path.slice(0, -1);
        } else {
            return path;
        }
    }
    
    /**
     * Warning: Contrary to the name, this does NOT return a canonical path. The canonical format
     * used by DirectoryEntry.fullPath actually DOES include the trailing "/"
     * @deprecated
     * 
     * @param {string} path
     * @return {string}
     */
    function canonicalizeFolderPath(path) {
        console.error("Warning: FileUtils.canonicalizeFolderPath() is deprecated. Use paths ending in '/' if possible, like DirectoryEntry.fullPath");
        return stripTrailingSlash(path);
    }
    
    /**
     * Get the name of a file or a directory, removing any preceding path.
     * @param {string} fullPath full path to a file or directory
     * @return {string} Returns the base name of a file or the name of a
     * directory
     */
    function getBaseName(fullPath) {
        var lastSlash = fullPath.lastIndexOf("/");
        if (lastSlash === fullPath.length - 1) {  // directory: exclude trailing "/" too
            return fullPath.slice(fullPath.lastIndexOf("/", fullPath.length - 2) + 1, -1);
        } else {
            return fullPath.slice(lastSlash + 1);
        }
    }
    
    /**
     * Returns a native absolute path to the 'brackets' source directory.
     * Note that this only works when run in brackets/src/index.html, so it does
     * not work for unit tests (which is run from brackets/test/SpecRunner.html)
     * 
     * WARNING: unlike most paths in Brackets, this path EXCLUDES the trailing "/".
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
     * 
     * WARNING: unlike most paths in Brackets, this path EXCLUDES the trailing "/".
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
     * Checks wheter a path is affected by a rename operation.
     * A path is affected if the object being renamed is a file and the given path refers
     * to that file or if the object being renamed is a directory and a prefix of the path.
     * Always checking for prefixes can create conflicts:
     * renaming file "foo" should not affect file "foobar/baz" even though "foo" is a prefix of "foobar".
     * @param {!string} path The path potentially affected
     * @param {!string} oldName An object's name before renaming
     * @param {!string} newName An object's name after renaming
     * @param {?boolean} isFolder Whether the renamed object is a folder or not
     */
    function isAffectedWhenRenaming(path, oldName, newName, isFolder) {
        isFolder = isFolder || oldName.slice(-1) === "/";
        return (isFolder && path.indexOf(oldName) === 0) || (!isFolder && path === oldName);
    }
    
    /**
     * Update a file entry path after a file/folder name change.
     * @param {FileEntry} entry The FileEntry or DirectoryEntry to update
     * @param {string} oldName The full path of the old name
     * @param {string} newName The full path of the new name
     * @return {boolean} Returns true if the file entry was updated
     */
    function updateFileEntryPath(entry, oldName, newName, isFolder) {
        if (isAffectedWhenRenaming(entry.fullPath, oldName, newName, isFolder)) {
            var oldFullPath = entry.fullPath;
            var fullPath = oldFullPath.replace(oldName, newName);
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

    /**
     * Get the file extension (excluding ".") given a path OR a bare filename.
     * Returns "" for names with no extension. If the name starts with ".", the
     * full remaining text is considered the extension.
     *
     * @param {string} fullPath full path to a file or directory
     * @return {string} Returns the extension of a filename or empty string if
     * the argument is a directory or a filename with no extension
     */
    function getFileExtension(fullPath) {
        var baseName = getBaseName(fullPath),
            idx      = baseName.lastIndexOf(".");

        if (idx === -1) {
            return "";
        }

        return baseName.substr(idx + 1);
    }

    /**
     * Similar to getFileExtension(), but includes the leading "." in the returned value.
     * @deprecated Use getFileExtension() instead. This API will be removed soon.
     */
    function getFilenameExtension(fullPath) {
        console.error("Warning: FileUtils.getFilenameExtension() is deprecated. Use FileUtils.getFileExtension() (which omits the '.') instead.");
        
        var ext = getFileExtension(fullPath);
        if (ext !== "") {
            ext = "." + ext;
        }
        return ext;
    }

    /** @const - hard-coded for now, but may want to make these preferences */
    var _staticHtmlFileExts = ["htm", "html"],
        _serverHtmlFileExts = ["php", "php3", "php4", "php5", "phtm", "phtml", "cfm", "cfml", "asp", "aspx", "jsp", "jspx", "shtm", "shtml"];

    /**
     * Determine if file extension is a static html file extension.
     * @param {string} filePath could be a path, a file name or just a file extension
     * @return {boolean} Returns true if fileExt is in the list
     */
    function isStaticHtmlFileExt(filePath) {
        if (!filePath) {
            return false;
        }

        return (_staticHtmlFileExts.indexOf(getFileExtension(filePath).toLowerCase()) !== -1);
    }

    /**
     * Determine if file extension is a server html file extension.
     * @param {string} filePath could be a path, a file name or just a file extension
     * @return {boolean} Returns true if fileExt is in the list
     */
    function isServerHtmlFileExt(filePath) {
        if (!filePath) {
            return false;
        }

        return (_serverHtmlFileExts.indexOf(getFileExtension(filePath).toLowerCase()) !== -1);
    }
    
    /**
     * Get the parent directory of a file. If a directory is passed in the directory is returned.
     * @param {string} fullPath full path to a file or directory
     * @return {string} Returns the path to the parent directory of a file or the path of a directory,
     *                  including trailing "/"
     */
    function getDirectoryPath(fullPath) {
        return fullPath.substr(0, fullPath.lastIndexOf("/") + 1);
    }

    /**
     * @private
     * Get the file name without the extension.
     * @param {string} filename File name of a file or directory
     * @return {string} Returns the file name without the extension
     */
    function _getFilenameWithoutExtension(filename) {
        var index = filename.lastIndexOf(".");
        return index === -1 ? filename : filename.slice(0, index);
    }
    
    /**
     * Compares 2 filenames in lowercases. In Windows it compares the names without the
     * extension first and then the extensions to fix issue #4409
     * @param {string} filename1
     * @param {string} filename2
     * @param {boolean} extFirst If true it compares the extensions first and then the file names.
     * @return {number} The result of the local compare function
     */
    function compareFilenames(filename1, filename2, extFirst) {
        var ext1   = getFileExtension(filename1),
            ext2   = getFileExtension(filename2),
            cmpExt = ext1.toLocaleLowerCase().localeCompare(ext2.toLocaleLowerCase(), undefined, {numeric: true}),
            cmpNames;
        
        if (brackets.platform === "win") {
            filename1 = _getFilenameWithoutExtension(filename1);
            filename2 = _getFilenameWithoutExtension(filename2);
        }
        cmpNames = filename1.toLocaleLowerCase().localeCompare(filename2.toLocaleLowerCase(), undefined, {numeric: true});
        
        return extFirst ? (cmpExt || cmpNames) : (cmpNames || cmpExt);
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
    exports.convertWindowsPathToUnixPath   = convertWindowsPathToUnixPath;
    exports.getNativeBracketsDirectoryPath = getNativeBracketsDirectoryPath;
    exports.getNativeModuleDirectoryPath   = getNativeModuleDirectoryPath;
    exports.canonicalizeFolderPath         = canonicalizeFolderPath;
    exports.stripTrailingSlash             = stripTrailingSlash;
    exports.isAffectedWhenRenaming         = isAffectedWhenRenaming;
    exports.updateFileEntryPath            = updateFileEntryPath;
    exports.isStaticHtmlFileExt            = isStaticHtmlFileExt;
    exports.isServerHtmlFileExt            = isServerHtmlFileExt;
    exports.getDirectoryPath               = getDirectoryPath;
    exports.getBaseName                    = getBaseName;
    exports.getFileExtension               = getFileExtension;
    exports.getFilenameExtension           = getFilenameExtension;
    exports.compareFilenames               = compareFilenames;
});

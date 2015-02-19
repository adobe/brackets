/*
 * Copyright (c) 2015 Adobe Systems Incorporated. All rights reserved.
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
/*global define, brackets, unescape, window */

define(function (require, exports, module) {
    "use strict";

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
     * @param {string} path Native path in the format used by FileSystemEntry.fullPath
     * @return {string} URI-encoded version suitable for appending to 'file:///`. It's not safe to use encodeURI()
     *     directly since it doesn't escape chars like "#".
     */
    function encodeFilePath(path) {
        var pathArray = path.split("/");
        pathArray = pathArray.map(function (subPath) {
            return encodeURIComponent(subPath);
        });
        return pathArray.join("/");
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
     * Get the parent directory of a file. If a directory is passed, the SAME directory is returned.
     * @param {string} fullPath full path to a file or directory
     * @return {string} Returns the path to the parent directory of a file or the path of a directory,
     *                  including trailing "/"
     */
    function getDirectoryPath(fullPath) {
        return fullPath.substr(0, fullPath.lastIndexOf("/") + 1);
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
     * Get the file name without the extension. Returns "" if name starts with "."
     * @param {string} filename File name of a file or directory, without preceding path
     * @return {string} Returns the file name without the extension
     */
    function getFilenameWithoutExtension(filename) {
        var index = filename.lastIndexOf(".");
        return index === -1 ? filename : filename.slice(0, index);
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
     * Get the parent folder of the given file/folder path. Differs from getDirectoryPath() when 'fullPath'
     * is a directory itself: returns its parent instead of the original path. (Note: if you already have a
     * FileSystemEntry, it's faster to use entry.parentPath instead).
     * @param {string} fullPath full path to a file or directory
     * @return {string} Path of containing folder (including trailing "/"); or "" if path was the root
     */
    function getParentPath(fullPath) {
        if (fullPath === "/") {
            return "";
        }
        return fullPath.substring(0, fullPath.lastIndexOf("/", fullPath.length - 2) + 1);
    }

    /**
     * Computes filename as relative to the basePath. For example:
     * basePath: /foo/bar/, filename: /foo/bar/baz.txt
     * returns: baz.txt
     *
     * The net effect is that the common prefix is stripped away. If basePath is not
     * a prefix of filename, then undefined is returned.
     *
     * @param {string} basePath Path against which we're computing the relative path
     * @param {string} filename Full path to the file for which we are computing a relative path
     * @return {string} relative path
     */
    function getRelativeFilename(basePath, filename) {
        if (!filename || filename.substr(0, basePath.length) !== basePath) {
            return;
        }

        return filename.substr(basePath.length);
    }

    /**
     * Removes the trailing slash from a path, if it has one.
     * Warning: this differs from the format of most paths used in Brackets! Use paths ending in "/"
     * normally, as this is the format used by Directory.fullPath.
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
            lang   = brackets.getLocale(),
            cmpExt = ext1.toLocaleLowerCase().localeCompare(ext2.toLocaleLowerCase(), lang, {numeric: true}),
            cmpNames;

        if (brackets.platform === "win") {
            filename1 = getFilenameWithoutExtension(filename1);
            filename2 = getFilenameWithoutExtension(filename2);
        }
        cmpNames = filename1.toLocaleLowerCase().localeCompare(filename2.toLocaleLowerCase(), lang, {numeric: true});

        return extFirst ? (cmpExt || cmpNames) : (cmpNames || cmpExt);
    }

    /**
     * Compares two paths segment-by-segment, used for sorting. When two files share a path prefix,
     * the less deeply nested one is sorted earlier in the list. Sorts files within the same parent
     * folder based on `compareFilenames()`.
     * @param {string} path1
     * @param {string} path2
     * @return {number} -1, 0, or 1 depending on whether path1 is less than, equal to, or greater than
     *     path2 according to this ordering.
     */
    function comparePaths(path1, path2) {
        var entryName1, entryName2,
            pathParts1 = path1.split("/"),
            pathParts2 = path2.split("/"),
            length     = Math.min(pathParts1.length, pathParts2.length),
            folders1   = pathParts1.length - 1,
            folders2   = pathParts2.length - 1,
            index      = 0;

        while (index < length) {
            entryName1 = pathParts1[index];
            entryName2 = pathParts2[index];

            if (entryName1 !== entryName2) {
                if (index < folders1 && index < folders2) {
                    return entryName1.toLocaleLowerCase().localeCompare(entryName2.toLocaleLowerCase());
                } else if (index >= folders1 && index >= folders2) {
                    return compareFilenames(entryName1, entryName2);
                }
                return (index >= folders1 && index < folders2) ? -1 : 1;
            }
            index++;
        }
        return 0;
    }

    // Define public API
    exports.comparePaths                   = comparePaths;
    exports.getBaseName                    = getBaseName;
    exports.getParentPath                  = getParentPath;
    exports.encodeFilePath                 = encodeFilePath;
    exports.getDirectoryPath               = getDirectoryPath;
    exports.getFileExtension               = getFileExtension;
    exports.compareFilenames               = compareFilenames;
    exports.stripTrailingSlash             = stripTrailingSlash;
    exports.convertToNativePath            = convertToNativePath;
    exports.getRelativeFilename            = getRelativeFilename;
    exports.getFilenameWithoutExtension    = getFilenameWithoutExtension;
    exports.getNativeModuleDirectoryPath   = getNativeModuleDirectoryPath;
    exports.convertWindowsPathToUnixPath   = convertWindowsPathToUnixPath;
    exports.getNativeBracketsDirectoryPath = getNativeBracketsDirectoryPath;
});

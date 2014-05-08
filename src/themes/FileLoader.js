/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function(require) {
    "use strict";

    var FileSystem = require("filesystem/FileSystem"),
        FileUtils  = require("file/FileUtils");

    // Root directory for CodeMirror themes
    var validExtensions = ["css", "less"];


    /**
    *  Return all the files in the specified path
    */
    function loadDirectory (path) {
        var result = $.Deferred();

        if ( !path ) {
            return result.reject({
                path: path,
                error: "Path not defined"
            });
        }

        function readContent(err, entries) {
            var i, files = [];
            entries = entries || [];

            for (i = 0; i < entries.length; i++) {
                if (isValid(entries[i])) {
                    files.push(entries[i].name);
                }
            }

            if ( err ) {
                result.reject({
                    path: path,
                    error: err
                });
            }
            else {
                result.resolve({
                    files: files,
                    path: path
                });
            }
        }

        FileSystem.getDirectoryForPath(path).getContents(readContent);
        return result.promise();
    }


    function isValid(file) {
        return file.isFile &&
            validExtensions.indexOf(FileUtils.getFileExtension(file.name)) !== -1;
    }


    return {
        loadDirectory: loadDirectory
    };

});


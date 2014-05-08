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
            return result.resolve({
                files: [],
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

            result.resolve({
                files: files,
                path: path,
                error: err
            });
        }

        try {
            FileSystem.getDirectoryForPath(path).getContents(readContent);
        }
        catch (ex) {
            result.resolve({
                files: [],
                path: path,
                error: ex.toString()
            });
        }

        return result.promise();
    }


    function loadList(paths) {
        var i, length, directories = [];

        for ( i = 0, length = paths.length; i < length; i++ ) {
            try {
                directories.push(loadDirectory( paths[i].path ));
            }
            catch(ex) {
            }
        }

        return $.when.apply(undefined, directories).promise();
    }


    function isValid(file) {
        return file.isFile &&
            validExtensions.indexOf(FileUtils.getFileExtension(file.name)) !== -1;
    }


    return {
        loadList: loadList,
        loadDirectory: loadDirectory
    };

});


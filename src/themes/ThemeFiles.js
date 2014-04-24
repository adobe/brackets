/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function(require) {
    "use strict";


    var FileSystem  = require("filesystem/FileSystem");

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
                if (entries[i].isFile && validExtensions.indexOf(getExtension(entries[i].name)) !== -1) {
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

        return $.when.apply((void 0), directories).promise();
    }


    function getExtension(file) {
        var lastIndexOf = file.lastIndexOf(".") + 1;
        return file.substr(lastIndexOf);
    }


    return {
        loadList: loadList,
        loadDirectory: loadDirectory
    };

});


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, define, brackets: true, $, window, unescape, navigator, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var FileSystem = require("filesystem/FileSystem1");
    
    function getAppDirectoryPath() {
        function convertToNativePath(path) {
            path = unescape(path);
            if (path.indexOf(":") !== -1 && path[0] === "/") {
                return path.substr(1);
            }

            return path;
        }

        var pathname = decodeURI(window.location.pathname);
        var directory = pathname.substr(0, pathname.lastIndexOf("/"));
        return convertToNativePath(directory);
    }
    
    
    function beforeQuit() {
        var $deferred = new $.Deferred(),
            rootPath = getAppDirectoryPath();
        var rootEntry = FileSystem.getDirectoryForPath(rootPath);
        rootEntry.getContents(function (err, contents, stats, statsErrs) {
            if (err) {
                $deferred.reject();
            } else {
                var files = contents
                    .filter(function (entry) {
                        return entry.isFile;
                    })
                    .map(function (entry) {
                        return entry.fullPath;
                    });
                var readFiles = files.filter(function (filePath) {
                    var file = FileSystem.getFileForPath(filePath);
                    file.read(function (err2, data, stat) {
                        if (err2) {
                            $deferred.reject(err2);
                        }
                        console.log(filePath);
                    });
                    return $deferred.state() !== "rejected";
                });
                if (readFiles.length === files.length) {
                    console.log("Read all files");
                    $deferred.resolve();
                }
            }
        });

        return $deferred.promise();
    }

    window.addEventListener("keydown", function (e) {
        if (String.fromCharCode(e.keyCode) === 'Q') {
            // Proper way to avoid the crash in fileIO.
//            beforeQuit().done(function () {
//                window.close();
//            });
            
            beforeQuit();
            window.close();
        }
    });
    
});

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var Content = require("filesystem/impls/filer/lib/content");
    var async = require("filesystem/impls/filer/lib/async");
    var BracketsFiler = require("filesystem/impls/filer/BracketsFiler");
    var BlobUtils = require("filesystem/impls/filer/BlobUtils");
    var Path = BracketsFiler.Path;
    var Transforms = require("filesystem/impls/filer/lib/transforms");
    var StartupState = require("bramble/StartupState");
    var decodePath = require("filesystem/impls/filer/FilerUtils").decodePath;

    // Walk the project root dir and make sure we have Blob URLs generated for
    // all file paths.
    exports.refresh = function(callback) {
        var fs = BracketsFiler.fs();

        function _getUrlAsync(filename, callback) {
            var decodedFilename = decodePath(filename);
            var cachedUrl = BlobUtils.getUrl(filename);

            // If we get a Blob URL (i.e., not the filename back) and get it
            // synchronously, run the callback and yield to main thread.
            if(cachedUrl !== filename) {
                setTimeout(function() {
                    callback(null, cachedUrl);
                }, 0);
                return;
            }

            fs.readFile(decodedFilename, null, function(err, data) {
                if(err) {
                    callback(err);
                    return;
                }

                var mime = Content.mimeFromExt(Path.extname(decodedFilename));
                var url = BlobUtils.createURL(filename, data, mime);
                callback(null, url);
            });
        }

        function _load(dirPath, callback) {
            fs.readdir(dirPath, function(err, entries) {
                if(err) {
                    return callback(err);
                }

                function _getBlobUrl(name, callback) {
                    name = Path.join(dirPath, name);

                    fs.stat(name, function(err, stats) {
                        if(err) {
                            return callback(err);
                        }

                        if(stats.type === 'DIRECTORY') {
                            _load(name, callback);
                        } else {
                            // If there's a transform needed for this file, do that first.
                            Transforms.applyTransform(name, function(err) {
                                if(err) {
                                    return callback(err);
                                }

                                _getUrlAsync(name, callback);
                            });
                        }
                    });
                }

                async.eachSeries(entries, _getBlobUrl, callback);
            });
        }

        _load(StartupState.project("root"), callback);
    };
});

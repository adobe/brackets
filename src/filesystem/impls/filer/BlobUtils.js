/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, URL, Blob */

define(function (require, exports, module) {
    "use strict";

    // BlobUtils provides an opportunistic cache for BLOB Object URLs
    // which can be looked-up synchronously.
    var Content = require("filesystem/impls/filer/lib/content");
    var FilerUtils = require("filesystem/impls/filer/FilerUtils");
    var async = require("filesystem/impls/filer/lib/async");
    var Path = FilerUtils.Path;
    var decodePath = FilerUtils.decodePath;
    var fs = require("filesystem/impls/filer/BracketsFiler").fs();

    // 2-way cache for blob URL to path for looking up either way:
    // * paths - paths keyed on blobUrls
    // * blobs - blobUrls keyed on paths
    var paths  = {};
    var blobURLs = {};

    // Generate a BLOB URL for the given filename and cache it
    function _cache(filename, url) {
        filename = Path.normalize(filename);

        // If there's an existing entry for this, remove it.
        remove(filename);

        // Now make a new set of cache entries
        blobURLs[filename] = url;
        paths[url] = filename;
    }

    // Remove the cached BLOB URL for the given filename
    function remove(filename) {
        filename = decodePath(filename);
        filename = Path.normalize(filename);

        var url = blobURLs[filename];
        // The first time a file is written, we won't have
        // a stale cache entry to clean up.
        if(!url) {
            return;
        }

        delete blobURLs[filename];
        delete paths[url];
        // Delete the reference from memory
        URL.revokeObjectURL(url);
    }

    // Update the cached records for the given filename
    function rename(oldPath, newPath) {
        oldPath = decodePath(oldPath);
        oldPath = Path.normalize(oldPath);
        newPath = decodePath(newPath);
        newPath = Path.normalize(newPath);

        var url = blobURLs[oldPath];

        blobURLs[newPath] = url;
        paths[url] = newPath;

        delete blobURLs[oldPath];
    }

    // Given a filename, lookup the cached BLOB URL
    function _getUrlSync(filename) {
        var url = blobURLs[Path.normalize(decodePath(filename))];

        // We expect this to exist, if it doesn't,
        // return path back unchanged
        return url || filename;
    }

    function _getUrlAsync(filename, callback) {
        var decodedFilename = decodePath(filename);
        var cachedUrl = blobURLs[Path.normalize(decodedFilename)];
        if(cachedUrl) {
            callback(null, cachedUrl);
            return;
        }

        fs.readFile(decodedFilename, null, function(err, data) {
            if(err) {
                callback(err);
                return;
            }

            var mime = Content.mimeFromExt(Path.extname(decodedFilename));
            var url = createURL(decodedFilename, data, mime);
            callback(null, url);
        });        
    }

    // Support sync and async calls to the URL cache. Also check to see
    // if async calls can by run immediately regardless (i.e., no disk access).
    // NOTE: make sure that we always return the filename unchanged if we
    // don't have a cached URL.  Don't return a normalized, decoded version.
    function getUrl(filename, maybeCallback) {
        if(typeof maybeCallback === "function") {
            _getUrlAsync(filename, maybeCallback);
        } else {
            return _getUrlSync(filename);
        }
    }

    // Given a BLOB URL, lookup the associated filename
    function getFilename(blobUrl) {
        var filename = paths[blobUrl];

        // We expect this to exist, if it doesn't,
        // return path back unchanged
        if(!filename) {
            return blobUrl;
        }
        return filename;
    }

    // Create a Blob URL Object, and manage its lifetime by caching.
    // Subsequent calls to create a URL for this path will auto-revoke an existing URL.
    function createURL(path, data, type) {
        path = decodePath(path);
        var blob = new Blob([data], {type: type});
        var url = URL.createObjectURL(blob);
        // NOTE: cache() will clean up existing URLs for this path.
        _cache(path, url);
        return url;
    }

    // Walk the project root dir and make sure we have Blob URLs generated for all file paths
    function preload(root, callback) {
        function _preload(dirPath, callback) {
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
                            _preload(name, callback);
                        } else {
                            getUrl(name, callback);
                        }
                    });
                }

                async.eachSeries(entries, _getBlobUrl, callback);
            });
        }

        _preload(root, callback);
    }

    exports.preload = preload;
    exports.remove = remove;
    exports.rename = rename;
    exports.getUrl = getUrl;
    exports.getFilename = getFilename;
    exports.createURL = createURL;
});

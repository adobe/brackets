/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, URL, Blob */

define(function (require, exports, module) {
    "use strict";

    // BlobUtils provides an opportunistic cache for BLOB Object URLs
    // which can be looked-up synchronously.
    var Content = require("filesystem/impls/filer/lib/content");
    var Path = require("filesystem/impls/filer/FilerUtils").Path;
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
        oldPath = Path.normalize(oldPath);
        newPath = Path.normalize(newPath);

        var url = blobURLs[oldPath];

        blobURLs[newPath] = url;
        paths[url] = newPath;

        delete blobURLs[oldPath];
    }

    // Given a filename, lookup the cached BLOB URL
    function _getUrlSync(filename) {
        var url = blobURLs[Path.normalize(filename)];

        // We expect this to exist, if it doesn't,
        // return path back unchanged
        return url || filename;
    }

    function _getUrlAsync(filename, callback) {
        var cachedUrl = blobURLs[Path.normalize(filename)];
        if(cachedUrl) {
            callback(null, cachedUrl);
            return;
        }

        fs.readFile(filename, null, function(err, data) {
            if(err) {
                callback(err);
                return;
            }

            var mime = Content.mimeFromExt(Path.extname(filename));
            var url = createURL(filename, data, mime);
            callback(null, url);
        });        
    }

    // Support sync and async calls to the URL cache. Also check to see
    // if async calls can by run immediately regardless (i.e., no disk access).
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
        var blob = new Blob([data], {type: type});
        var url = URL.createObjectURL(blob);
        // NOTE: cache() will clean up existing URLs for this path.
        _cache(path, url);
        return url;
    }

    exports.remove = remove;
    exports.rename = rename;
    exports.getUrl = getUrl;
    exports.getFilename = getFilename;
    exports.createURL = createURL;
});

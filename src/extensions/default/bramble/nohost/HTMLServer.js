/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets */
define(function (require, exports, module) {
    "use strict";

    var BaseServer              = brackets.getModule("LiveDevelopment/Servers/BaseServer").BaseServer,
        LiveDevelopmentUtils    = brackets.getModule("LiveDevelopment/LiveDevelopmentUtils"),
        Content                 = brackets.getModule("filesystem/impls/filer/lib/content"),
        BlobUtils               = brackets.getModule("filesystem/impls/filer/BlobUtils"),
        Filer                   = brackets.getModule("filesystem/impls/filer/BracketsFiler"),
        Path                    = Filer.Path,
        HTMLRewriter            = brackets.getModule("filesystem/impls/filer/lib/HTMLRewriter"),
        CSSRewriter             = brackets.getModule("filesystem/impls/filer/lib/CSSRewriter"),
        Compatibility           = require("lib/compatibility"),
        _shouldUseBlobURL;

    function _isHTML(path) {
        return LiveDevelopmentUtils.isStaticHtmlFileExt(path);
    }

    function _isCSS(path) {
        return Content.isCSS(Path.extname(path));
    }

    function HTMLServer(config) {
        config = config || {};
        BaseServer.call(this, config);
    }

    HTMLServer.prototype = Object.create(BaseServer.prototype);
    HTMLServer.prototype.constructor = HTMLServer;

    //Returns a pre-generated blob url based on path
    HTMLServer.prototype.pathToUrl = function(path) {
        return BlobUtils.getUrl(path);
    };
    //Returns a path based on blob url
    HTMLServer.prototype.urlToPath = function(url) {
        return BlobUtils.getFilename(url);
    };

    HTMLServer.prototype.start = function() {
        this.fs = Filer.fs();
    };

    HTMLServer.prototype.stop = function() {
        this.fs = null;
    };

    HTMLServer.prototype.readyToServe = function () {
        var deferred = new $.Deferred();

        // Decide if we can use Blob URLs or need to document.write()
        Compatibility.supportsIFrameHTMLBlobURL(function(err, shouldUseBlobURL) {
            if(err) {
                console.error("[Brackets HTMLServer] Unexpected error:", err);
                deferred.reject();
            }

            _shouldUseBlobURL = shouldUseBlobURL;
            deferred.resolve();
        });

        return deferred.promise();
    };

    /**
     * Determines if this server can serve local file. LiveDevServerManager
     * calls this method when determining if a server can serve a file.
     * @param {string} localPath A local path to file being served.
     * @return {boolean} true When the file can be served, otherwise false.
     */
    HTMLServer.prototype.canServe = function (localPath) {
        // If we can't transform the local path to a project relative path,
        // the path cannot be served
        if (localPath === this._pathResolver(localPath)) {
            return false;
        }

        // Url ending in "/" implies default file, which is usually index.html.
        // Return true to indicate that we can serve it.
        if (localPath.match(/\/$/)) {
            return true;
        }

        return _isHTML(localPath);
    };

    /**
     * When a livedocument is added (CSS or HTML) to the server cache, make sure live
     * instrumentation is enabled
     */
    HTMLServer.prototype.add = function (liveDocument) {
        if (liveDocument.setInstrumentationEnabled) {
            // enable instrumentation
            liveDocument.setInstrumentationEnabled(true);
        }
        BaseServer.prototype.add.call(this, liveDocument);
    };

    function _serveLiveCSS(path, liveDocument, callback) {
        CSSRewriter.rewrite(path, liveDocument.getResponseData().body, function(err, css) {
            if(err) {
                callback(err);
                return;
            }
            callback(null, BlobUtils.createURL(path, css, "text/css"));
        });

    }

    function _serveLiveHTML(path, liveDocument, server, callback) {
        HTMLRewriter.rewrite(path, liveDocument.getResponseData().body, server, function(err, html) {
            if(err) {
                callback(err);
                return;
            }
            // We either serve raw HTML or a Blob URL depending on browser compatibility.
            callback(null, _shouldUseBlobURL ? BlobUtils.createURL(path, html, "text/html") : html);
        });
    }

    /**
     * If a livedoc exists (HTML or CSS), serve the instrumented version of the file.
     */
    HTMLServer.prototype.serveLiveDocForUrl = function(url, callback) {
        var path = BlobUtils.getFilename(url);
        this.serveLiveDocForPath(path, callback);
    };

    HTMLServer.prototype.serveLiveDocForPath = function(path, callback) {
        var liveDocument = this.get(path);

        // If we don't have a live doc for this file, use the cached URL
        if(!liveDocument) {
            return BlobUtils.getUrl(path, callback);
        }

        if(_isHTML(path)) {
            _serveLiveHTML(path, liveDocument, this, callback);
        } else if (_isCSS(path)) {
            _serveLiveCSS(path, liveDocument, callback);
        } else {
            console.warn("[Brackets HTMLServer] expected .html or .css live doc type", path);
        }
    };

    exports.HTMLServer = HTMLServer;
});

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    var LanguageManager = require('language/LanguageManager');

    function _getLanguageId(ext) {
        ext = ext.replace(/^\./, "");
        var language = LanguageManager.getLanguageForExtension(ext);
        return language ? language.getId() : "";
    }

    module.exports = {
        isImage: function(ext) {
            var id = _getLanguageId(ext);
            return id === "image" || id === "svg";
        },

        isHTML: function(ext) {
            var id = _getLanguageId(ext);
            return id === "html";
        },

        isCSS: function(ext) {
            var id = _getLanguageId(ext);
            return id === "css";
        },

        isMarkdown: function(ext) {
            var id = _getLanguageId(ext);
            return id === "markdown";
        },

        mimeFromExt: function(ext) {
            switch(ext) {
            case '.html':
            case '.htmls':
            case '.htm':
            case '.htx':
            // We transform Markdown into HTML
            case '.md':
            case '.markdown':
                return 'text/html';
            case '.ico':
                return 'image/x-icon';
            case '.bmp':
                return 'image/bmp';
            case '.css':
                return 'text/css';
            case '.js':
                return 'text/javascript';
            case '.svg':
                return 'image/svg+xml';
            case '.png':
                return 'image/png';
            case '.ico':
                return 'image/x-icon';
            case '.jpg':
            case '.jpe':
            case '.jpeg':
                return 'image/jpeg';
            case '.gif':
                return 'image/gif';
            // Some of these media types can be video or audio, prefer video.
            case '.mp4':
                return 'video/mp4';
            case '.mpeg':
                return 'video/mpeg';
            case '.ogg':
            case '.ogv':
                return 'video/ogg';
            case '.mov':
            case '.qt':
                return 'video/quicktime';
            case '.webm':
                return 'video/webm';
            case '.avi':
            case '.divx':
                return 'video/avi';
            case '.mpa':
            case '.mp3':
                return 'audio/mpeg';
            case '.wav':
                return 'audio/vnd.wave';
            }

            return 'application/octet-stream';
        },

        // Check if the file can be read in utf8 encoding
        isUTF8Encoded: function(ext) {
            var mime = this.mimeFromExt(ext);

            return (/^text/).test(mime);
        },

        // Test if the given URL is really a relative path (into the fs)
        isRelativeURL: function(url) {
            if(!url) {
                return false;
            }

            return !(/\:?\/\//.test(url) || /\s*data\:/.test(url));
        }
    };
});
